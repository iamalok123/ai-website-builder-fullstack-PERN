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
            model: "arcee-ai/trinity-large-preview:free",
            messages: [
                {
                    role: "system",
                    content: `
                        You are a prompt enhancement specialist. Take the user's website request and make it clearer and more actionable for a web developer, while keeping it SIMPLE and FAST to build.

                        Enhance this prompt by:
                        1. Choosing a color scheme (2-3 colors with hex codes) and a Google Font (Inter, Poppins, or Outfit)
                        2. Listing 3-5 simple sections the website should have (e.g. Hero, Features/About, Contact/CTA, Footer). Do NOT ask for more than 5 sections.
                        3. Briefly describing what each section contains (a short heading + 1 sentence of content description)
                        4. Specifying if it should be dark or light themed
                        5. Mentioning mobile-responsive layout with hamburger menu on mobile

                        KEEP IT SIMPLE: No complex animations, no SVG icons, no animated counters, no carousels, no accordions, no iframes. Just clean, working HTML sections with text and simple styling.

                        Return ONLY the enhanced prompt in 1-2 short paragraphs. Be concise.
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
                    model: "arcee-ai/trinity-large-preview:free",
                    messages: [
                        {
                            role: "system",
                            content: `
                        You are an expert web developer. Create a SIMPLE, FAST-LOADING, single-page website based on this request: "${enhancedPrompt}"

                        GOAL: Generate a clean, working website FAST. Prioritize a visible, functional result over complexity. Keep total HTML under 300 lines.

                        CRITICAL REQUIREMENTS:
                            - Output valid HTML ONLY. No markdown, no explanations, no code fences.
                            - Use Tailwind CSS via this CDN in <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                            - Include a Google Font in <head>: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
                            - Set font-family via a <style> block: body { font-family: 'Inter', sans-serif; scroll-behavior: smooth; }

                        STRUCTURE (3-5 SECTIONS ONLY):
                            - Hero section with a heading (h1), subtitle text, and a CTA button
                            - Features or About section with 3 simple cards (use emoji for icons, e.g. 🚀 ⚡ 🎯 — NO SVGs)
                            - Contact or CTA section with a simple call-to-action
                            - Footer with copyright and a few links
                            - Each section needs a heading and 1-2 sentences of realistic text

                        MOBILE-FIRST RESPONSIVE DESIGN:
                            - Base styles for mobile, use md: and lg: for larger screens
                            - Navigation: horizontal links on desktop, hamburger menu on mobile with working JavaScript toggle (use getElementById)
                            - Grids: grid-cols-1 on mobile, md:grid-cols-2 or lg:grid-cols-3 on larger screens
                            - Content padding: px-4 md:px-8, sections: py-12 md:py-20
                            - Flex layouts: flex-col md:flex-row
                            - Use overflow-hidden on containers to prevent horizontal scroll

                        COLOR & CONTRAST:
                            - Use a harmonious color palette. Dark bg = light text. Light bg = dark text. Always high contrast.
                            - Buttons: use contrasting colors (e.g. bg-blue-600 text-white)
                            - Cards must contrast with their parent background

                        IMAGES:
                            - Do NOT use complex background images. Use solid Tailwind background colors or simple gradients instead.
                            - If content images are needed, use https://picsum.photos/{width}/{height}?random=N with alt text and loading="lazy"
                            - NEVER use fabricated URLs, Google image URLs, SVGs, or iframes

                        JAVASCRIPT (MINIMAL — only these two features):
                            - Hamburger menu toggle using getElementById
                            - Smooth scroll is handled by CSS scroll-behavior: smooth
                            - Do NOT add: animated counters, accordions, carousels, intersection observers, form validation, or back-to-top buttons
                            - Place <script> before closing </body>

                        STYLING:
                            - Hover effects on buttons and cards: hover:shadow-lg, transition-all duration-300
                            - Consistent spacing: gap-6, p-6, max-w-6xl mx-auto
                            - Keep it clean, modern, and visually appealing with minimal complexity

                        HARD RULES:
                            1. Output ONLY valid HTML in message.content. Nothing else.
                            2. Do NOT use SVGs, iframes, or complex embedded content.
                            3. Do NOT include markdown, explanations, or code fences.
                            4. Keep it SIMPLE and FAST. 3-5 sections max. Under 300 lines.
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

        // Sanitize generated code
        const sanitizeGeneratedCode = (html: string): string => {
            let sanitized = html;

            // Fix 1: Ensure TinyMCE is included if used
            if (sanitized.includes('tinymce') && !sanitized.includes('src="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js"')) {
                const scriptTag = '<script src="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>';
                if (sanitized.includes('</body>')) {
                    sanitized = sanitized.replace('</body>', `${scriptTag}</body>`);
                } else {
                    sanitized += scriptTag;
                }
            }

            // Fix 2: Auto-fix querySelector syntax for tailwind classes with slashes (e.g. w-1/2)
            sanitized = sanitized.replace(/document\.querySelector\(['"](\.([^'"]+))['"]\)/g, (match, selector) => {
                if (selector.includes('/')) {
                    const escaped = selector.replace(/\//g, '\\\\/');
                    return `document.querySelector('${escaped}')`;
                }
                return match;
            });

            return sanitized;
        };

        cleanedCode = sanitizeGeneratedCode(cleanedCode);

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


