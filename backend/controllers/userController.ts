import dotenv from 'dotenv';
dotenv.config();
import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../configs/openai.js";
import { sanitizeAndFixHtml, AI_MODELS } from "../lib/sanitizeHtml.js";
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
        let enhancedPrompt = initialPrompt;
        try {
            const enhanceUserPrompt = await openai.chat.completions.create({
                model: AI_MODELS[0],
                temperature: 0.7,
                max_tokens: 500,
                messages: [
                    {
                        role: "system",
                        content: `You are a prompt enhancer. Take the user's website request and output a clear, concise, actionable brief for a web developer. Include: 1) A color scheme (2-3 hex colors) 2) Theme: dark or light 3) List 3-5 sections (Nav, Hero, Features, CTA, Footer) with brief descriptions 4) Mobile-first with hamburger menu. Keep it to 1-2 short paragraphs. No markdown. No complex features (no SVGs, animations, carousels). Output ONLY the enhanced brief.`
                    },
                    {
                        role: "user",
                        content: initialPrompt
                    }
                ]
            });
            enhancedPrompt = enhanceUserPrompt.choices[0].message.content || initialPrompt;
        } catch (enhanceErr) {
            console.warn('Prompt enhancement failed, using original prompt:', enhanceErr);
        }

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

        // Generate Website Code with Retry Logic + Model Rotation
        let code = '';
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts && !code) {
            const model = AI_MODELS[attempts % AI_MODELS.length];
            attempts++;
            try {
                console.log(`Generating website code with ${model}... Attempt ${attempts}/${maxAttempts}`);
                const codeGenerationResponse = await openai.chat.completions.create({
                    model,
                    temperature: 0.7,
                    messages: [
                        {
                            role: "system",
                            content: `You are a web developer. Generate a complete, working, single-page HTML website. Output ONLY valid HTML starting with <!DOCTYPE html>. No markdown, no explanations, no code fences.

INCLUDE IN <head>:
- <meta charset="UTF-8">
- <meta name="viewport" content="width=device-width, initial-scale=1.0">
- <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
- <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
- <style>body{font-family:'Inter',sans-serif;scroll-behavior:smooth;overflow-x:hidden}</style>

STRUCTURE (3-5 sections, keep HTML under 250 lines):
1. Nav: logo text + horizontal links on desktop, hamburger menu on mobile using getElementById toggle
2. Hero: h1 heading, subtitle paragraph, CTA button
3. Features/About: 3 cards in a grid with emoji icons (🚀 ⚡ 🎯 💡 🌟 📱) — NO SVGs
4. CTA or Contact section
5. Footer with copyright and links

MOBILE-FIRST RESPONSIVE:
- Start with mobile layout, add md: and lg: breakpoints for larger screens
- Grids: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
- Flex: flex-col md:flex-row
- Padding: px-4 md:px-8 lg:px-12, Section spacing: py-12 md:py-20
- Container: max-w-7xl mx-auto overflow-hidden
- Text: text-base md:text-lg, headings: text-2xl md:text-4xl

DESIGN:
- Clean, modern, professional look
- High contrast: dark bg = white/light text, light bg = dark text
- Buttons: solid bg with white text, rounded, hover states
- Consistent spacing and rounded corners

STRICT RULES:
- NO SVGs, NO iframes, NO complex animations, NO carousels, NO animated counters
- Emoji only for icons
- Images: https://picsum.photos/{w}/{h}?random=N only (never fabricated URLs)
- JS: ONLY hamburger menu toggle using getElementById. No other JavaScript
- Place <script> before </body>
- Output ONLY the complete HTML document. Nothing else.`
                        },
                        {
                            role: "user",
                            content: enhancedPrompt || initialPrompt
                        }
                    ]
                });

                const result = codeGenerationResponse.choices[0].message.content || '';
                // Validate the response looks like HTML before accepting
                if (result && (result.includes('<html') || result.includes('<!DOCTYPE') || result.includes('<head'))) {
                    code = result;
                    break;
                }
                console.warn(`Attempt ${attempts}: Response did not contain valid HTML, retrying...`);
            } catch (err) {
                console.error(`Attempt ${attempts} with ${model} failed:`, err);
                if (attempts === maxAttempts) throw err;
                await new Promise(resolve => setTimeout(resolve, 1500));
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

        // Clean and sanitize the generated code for mobile compatibility
        const cleanedCode = sanitizeAndFixHtml(code);

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


