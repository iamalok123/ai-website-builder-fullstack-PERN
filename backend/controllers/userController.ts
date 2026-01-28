import dotenv from 'dotenv';
dotenv.config();
import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../configs/openai.js";
import Stripe from "stripe";


// Get User Credits
export const getUserCredits = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        })
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        console.log('✅ getUserCredits completed for user:', userId);
        return res.status(200).json({ credits: user?.credits });
    } catch (error: any) {
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}




// Helper function to generate website code in background
const generateWebsiteInBackground = async (projectId: string, userId: string, initialPrompt: string) => {
    try {
        // Enhance User Prompt
        const enhanceUserPrompt = await openai.chat.completions.create({
            model: "z-ai/glm-4.5-air:free",
            messages: [
                {
                    role: "system",
                    content: `
                        You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the best possible website.

                        Enhance this prompt by:
                        1. Adding specific design details (layout, color scheme, typography)
                        2. Specifying key sections and features
                        3. Describing the user experience and interactions
                        4. Including modern web design best practices
                        5. Mentioning responsive design requirements
                        6. Adding any missing but important elements

                        If a user gives a prompt like "Netflix clone", "Spotify clone" , "Amazon clone"  expand it to include all the sections and features that particular website should have.

                        Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max).
                    `
                },
                {
                    role: "user",
                    content: initialPrompt
                }
            ]
        })

        const enhancedPrompt = enhanceUserPrompt.choices[0].message.content;

        // Create assistant's conversation with enhanced prompt
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `I have enhanced your prompt to : "${enhancedPrompt}"`,
                projectId
            }
        })

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "Now generating your website...",
                projectId
            }
        })

        // Generate Website Code with Retry Logic
        let code = '';
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts && !code) {
            attempts++;
            try {
                console.log(`Generating website code... Attempt ${attempts}/${maxAttempts}`);
                const codeGenerationResponse = await openai.chat.completions.create({
                    model: "z-ai/glm-4.5-air:free",
                    messages: [
                        {
                            role: "system",
                            content: `
                        You are an expert web developer. Create a complete, production-ready, single-page website based on this request: "${enhancedPrompt}"

                        CRITICAL REQUIREMENTS:
                            - You MUST output valid HTML ONLY. 
                            - Use Tailwind CSS for ALL styling
                            - Include this EXACT script in the <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                            - Use Tailwind utility classes extensively for styling, animations, and responsiveness
                            - Make it fully functional and interactive with JavaScript in <script> tag before closing </body>
                            - Use modern, beautiful design with great UX using Tailwind classes
                            - Make it responsive using Tailwind responsive classes (sm:, md:, lg:, xl:)
                            - Use Tailwind animations and transitions (animate-*, transition-*)
                            - Include all necessary meta tags
                            - Use Google Fonts CDN if needed for custom fonts
                            - Use placeholder images from related images from google 
                            - Use Tailwind gradient classes for beautiful backgrounds
                            - Make sure all buttons, cards, and components use Tailwind styling

                        CRITICAL HARD RULES:
                            1. You MUST put ALL output ONLY into message.content.
                            2. You MUST NOT place anything in "reasoning", "analysis", "reasoning_details", or any hidden fields.
                            3. You MUST NOT include internal thoughts, explanations, analysis, comments, or markdown.
                            4. Do NOT include markdown, explanations, notes, or code fences.

                        The HTML should be complete and ready to render as-is with Tailwind CSS.
                    `
                        },
                        {
                            role: "user",
                            content: enhancedPrompt || ''
                        }
                    ]
                });

                code = codeGenerationResponse.choices[0].message.content || '';
                if (code) break;
            } catch (err) {
                console.error(`Attempt ${attempts} failed:`, err);
                if (attempts === maxAttempts) throw err;
                // Wait 1 second before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (!code) {
            console.error('Failed to generate code after all attempts.');
            await prisma.conversation.create({
                data: {
                    role: 'assistant',
                    content: "Unable to generate your code, please try again.",
                    projectId
                }
            })

            await prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    credits: {
                        increment: 5
                    }
                }
            })

            return;
        }

        // Clean code: remove markdown fences and any text before <!DOCTYPE or <html
        let cleanedCode = code.replace(/```[a-z]*\n?/gi, "").replace(/```$/g, "").trim();
        const htmlStartMatch = cleanedCode.match(/<!DOCTYPE\s+html|<html/i);
        if (htmlStartMatch && htmlStartMatch.index !== undefined) {
            cleanedCode = cleanedCode.substring(htmlStartMatch.index).trim();
        }

        // Create version for the project
        const version = await prisma.version.create({
            data: {
                code: cleanedCode,
                description: "Initial version",
                projectId
            }
        })

        // Create assistant's conversation
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "I've created your website! You can now preview it and request any changes.",
                projectId
            }
        })

        // Update project with current code and version
        await prisma.websiteProject.update({
            where: {
                id: projectId
            },
            data: {
                current_code: cleanedCode,
                current_version_index: version.id
            }
        })

        console.log(`Background generation completed for project: ${projectId}`);

    } catch (error: any) {
        console.error(`Background generation failed for project ${projectId}:`, error);
        // Refund credits on background failure
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                credits: {
                    increment: 5
                }
            }
        }).catch(e => console.error('Failed to refund credits:', e));

        // Add error message to conversation
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "An error occurred while generating your website. Please try again.",
                projectId
            }
        }).catch(e => console.error('Failed to create error conversation:', e));
    }
}

// Controller function to create a new project
export const createNewProject = async (req: Request, res: Response) => { // createUserProject
    const userId = req.userId;
    try {
        const { initial_prompt } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        })

        if (user && user.credits < 5) {
            return res.status(403).json({ message: 'Add credits to create more projects.' });
        }

        // Create new project
        const project = await prisma.websiteProject.create({
            data: {
                name: initial_prompt.length > 50 ? initial_prompt.substring(0, 47) + '...' : initial_prompt,
                initial_prompt,
                userId
            }
        })

        // Update user's total creations
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                totalCreation: {
                    increment: 1
                }
            }
        })

        // Create user's conversation
        await prisma.conversation.create({
            data: {
                role: 'user',
                content: initial_prompt,
                projectId: project.id
            }
        })

        // Update user's credits
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                credits: {
                    decrement: 5
                }
            }
        })

        // Return projectId immediately - don't wait for AI generation
        res.status(201).json({ projectId: project.id });
        console.log('✅ createNewProject completed - projectId:', project.id);

        // Start AI generation in background (fire-and-forget)
        // The frontend will poll until current_code is populated
        generateWebsiteInBackground(project.id, userId, initial_prompt);

    } catch (error: any) {
        // Only refund if response hasn't been sent yet
        if (!res.headersSent) {
            await prisma.user.update({
                where: {
                    id: req.userId
                },
                data: {
                    credits: {
                        increment: 5
                    }
                }
            }).catch(e => console.error('Failed to refund credits:', e));
        }
        console.error(error);
        if (!res.headersSent) {
            return res.status(500).json({ message: error.message });
        }
    }
}


// Controller function to get a single user project
export const getUserProject = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        const projectId = req.params.projectId as string;

        const project = await prisma.websiteProject.findUnique({
            where: {
                id: projectId, userId
            },
            include: {
                conversation: {
                    orderBy: {
                        timestamp: 'asc'
                    }
                },
                versions: {
                    orderBy: {
                        timestamp: 'asc'
                    }
                }
            }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        console.log('✅ getUserProject completed - projectId:', projectId);
        return res.status(200).json({ project });

    } catch (error: any) {
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}


// Controller function to get all user projects
export const getUserProjects = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        const projects = await prisma.websiteProject.findMany({
            where: {
                userId
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        console.log('✅ getUserProjects completed - found', projects.length, 'projects');
        return res.status(200).json({ projects });
    } catch (error: any) {
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}


// Controller function to toggle project publish
export const togglePublish = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        const projectId = req.params.projectId as string;

        const project = await prisma.websiteProject.findUnique({
            where: {
                id: projectId, userId
            }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        await prisma.websiteProject.update({
            where: {
                id: projectId
            },
            data: {
                isPublished: !project.isPublished
            }
        })

        console.log('✅ togglePublish completed - projectId:', projectId, '- isPublished:', !project.isPublished);
        return res.status(200).json({ message: project.isPublished ? 'Project unpublished.' : 'Project published successfully!' });
    } catch (error: any) {
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}


// Controller function to purchase credits
export const purchaseCredits = async (req: Request, res: Response) => {
    try {
        interface Plan {
            credits: number;
            amount: number;
        }
        const plans = {
            basic: { credits: 100, amount: 5 },
            pro: { credits: 400, amount: 19 },
            enterprise: { credits: 1000, amount: 49 },
        }

        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        const { planId } = req.body as { planId: keyof typeof plans };

        if (!planId) {
            return res.status(400).json({ message: 'Plan ID is required.' });
        }

        const origin = req.headers.origin as string;

        const plan: Plan = plans[planId];

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found.' });
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId: userId!,
                planId: req.body.planId,
                amount: plan.amount,
                credits: plan.credits,
            }
        })

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/loading`,
            cancel_url: `${origin}`,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `AI website builder - ${plan.credits} credits`,
                        },
                        unit_amount: Math.floor(transaction.amount) * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            metadata: {
                transactionId: transaction.id,
                appId: 'ai-website-builder',
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
        });

        console.log('✅ purchaseCredits completed - session:', session.url);
        return res.status(200).json({ payment_link: session.url });
    } catch (error: any) {
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}


