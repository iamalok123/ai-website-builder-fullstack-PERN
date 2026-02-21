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
                        You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the MOST FEATURE-RICH AND CONTENT-RICH website possible.

                        Enhance this prompt by:
                        1. Adding specific design details (layout structure, color palette with hex codes, typography using Google Fonts like Inter, Poppins, or Outfit)
                        2. Specifying AT LEAST 8-12 distinct sections the website needs (hero, features/services, about us, statistics/counters, testimonials, team, portfolio/gallery, pricing, FAQ/accordion, newsletter signup, blog/news preview, contact form, partners/logos, footer with sitemap)
                        3. For EACH section, describe: the heading text, paragraph content (2-3 sentences of realistic placeholder text), number of cards/items, and specific features
                        4. Describing rich user interactions: working hamburger menu, smooth scroll navigation, animated counters, accordion FAQ, tabbed content, carousels/sliders, form validation, back-to-top button
                        5. Specifying mobile-first responsive design: layout must stack vertically on small screens, use hamburger menu for navigation on mobile, readable font sizes (min 16px body text)
                        6. Specifying image strategy: use placeholder images from https://picsum.photos/{width}/{height} with appropriate dimensions for hero backgrounds, team member avatars, portfolio items, etc.
                        7. If the user mentions dark mode, light mode, or a theme preference, include that. Otherwise, choose dark mode for tech/portfolio/gaming sites and light mode for business/ecommerce/blog sites.
                        8. Adding text-heavy content: each section must have a descriptive heading AND 2-3 sentences of realistic body text, not just a title. Cards must have both titles AND descriptions.

                        If a user gives a prompt like "Netflix clone", "Spotify clone", "Amazon clone", "AWS clone" etc., expand it to include ALL the pages and features that particular website should have — navigation between sections, search bars, category filters, product cards with prices, user profile dropdowns, etc.

                        Return ONLY the enhanced prompt, nothing else. Make it detailed and comprehensive (3-4 paragraphs).
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
                        You are an expert web developer. Create a complete, production-ready, single-page website based on this request: "${enhancedPrompt}"

                        CRITICAL REQUIREMENTS:
                            - You MUST output valid HTML ONLY.
                            - Use Tailwind CSS for ALL styling.
                            - Include this EXACT script in the <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                            - Use Tailwind utility classes extensively for styling, animations, and responsiveness.
                            - Make it fully functional and interactive with JavaScript in <script> tag before closing </body>.

                        MOBILE-FIRST RESPONSIVE DESIGN (CRITICAL):
                            - Design mobile-first: base styles for small screens, then use sm:, md:, lg:, xl: for larger screens.
                            - Navigation MUST use a hamburger menu on mobile with a working toggle via JavaScript (use getElementById, NOT querySelector with Tailwind classes).
                            - All grids must be single-column on mobile (grid-cols-1) and multi-column on larger screens (md:grid-cols-2, lg:grid-cols-3).
                            - Body text minimum 16px (text-base), headings scale responsively (text-2xl md:text-4xl lg:text-5xl).
                            - All content must be inside a container with horizontal padding (px-4 sm:px-6 lg:px-8).
                            - No horizontal overflow — use overflow-hidden on parent containers.
                            - Flex layouts must wrap or stack on mobile (flex-col md:flex-row).

                        IMAGES (CRITICAL — DO NOT USE GOOGLE IMAGE URLS):
                            - For ALL images, use https://picsum.photos/{width}/{height} (e.g. https://picsum.photos/600/400).
                            - To get different images, append ?random=N (e.g. https://picsum.photos/600/400?random=1, ?random=2, etc.).
                            - Every <img> tag MUST have: alt="descriptive text", loading="lazy", width and height attributes, and class="w-full h-auto object-cover".
                            - For hero/banner backgrounds, use inline style with background-image: url('https://picsum.photos/1920/1080?random=0') with bg-cover bg-center classes.
                            - NEVER use broken or fabricated image URLs. Only picsum.photos or placehold.co.

                        TYPOGRAPHY & FONTS:
                            - Always include a Google Font. Add this in <head>: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                            - Set body font-family to 'Inter', sans-serif via a <style> block.
                            - Use consistent Tailwind text sizing: text-sm, text-base, text-lg, text-xl, text-2xl, text-4xl.
                            - Maintain visual hierarchy: one clear h1 per page, h2 for sections, h3 for sub-sections.
                            - Use leading-relaxed or leading-loose for body text readability.

                        COLOR SCHEME & DARK/LIGHT MODE:
                            - Use a harmonious, curated color palette — avoid generic plain colors.
                            - For dark-themed sites: use dark backgrounds (gray-900/950) with LIGHT text (text-white or text-gray-100). NEVER use dark text on dark backgrounds.
                            - For light-themed sites: use white/gray-50 backgrounds with DARK text (text-gray-800 or text-gray-900). NEVER use light text on light backgrounds.
                            - CRITICAL CONTRAST RULE: Text and background MUST ALWAYS have high contrast. If bg is dark, text MUST be light. If bg is light, text MUST be dark. Every section must be independently readable.
                            - For colored/gradient backgrounds: use text-white for readability.
                            - Buttons: use contrasting text (e.g. bg-blue-600 text-white, bg-white text-gray-900).
                            - Cards on dark backgrounds: use bg-gray-800 with text-gray-100. Cards on light backgrounds: use bg-white with text-gray-800.
                            - If the prompt mentions dark/light mode toggle, implement it with a button that toggles a 'dark' class on <html> and uses Tailwind dark: variant classes.

                        ANIMATIONS & POLISH:
                            - Use Tailwind transitions (transition-all, transition-colors, duration-300).
                            - Add hover effects on buttons and cards (hover:scale-105, hover:shadow-lg).
                            - Use CSS @keyframes for entrance animations (fadeIn, slideUp) applied via Intersection Observer in JavaScript.
                            - Add smooth scrolling: html { scroll-behavior: smooth; } in a <style> block.

                        LAYOUT SYMMETRY:
                            - Use consistent spacing via Tailwind spacing scale (p-4, p-6, p-8, gaps: gap-4, gap-6, gap-8).
                            - Center sections with max-w-7xl mx-auto.
                            - Use py-16 md:py-24 for section vertical padding consistency.

                        JAVASCRIPT RULES:
                            - Use getElementById for DOM selection — NEVER querySelector with Tailwind class selectors.
                            - All interactive elements (hamburger menu, theme toggle, tabs) must be functional.
                            - Place all <script> tags before closing </body>.

                        CRITICAL HARD RULES:
                            1. You MUST put ALL output ONLY into message.content.
                            2. You MUST NOT place anything in "reasoning", "analysis", "reasoning_details", or any hidden fields.
                            3. You MUST NOT include internal thoughts, explanations, analysis, comments, or markdown.
                            4. Do NOT include markdown, explanations, notes, or code fences.

                        CONTENT RICHNESS (CRITICAL — GENERATE MAXIMUM CONTENT):
                            - The website MUST have AT LEAST 8 distinct sections (e.g. Hero, Features, About, Statistics, Testimonials, Pricing, FAQ, Contact, Footer).
                            - Every section MUST have a heading (h2) AND at least 2-3 sentences of realistic, professional body text — NOT just Lorem Ipsum.
                            - Feature/service cards MUST have an icon (use SVG or emoji), title, AND a descriptive paragraph (2-3 sentences).
                            - Include at least 6 feature/service cards, 3-4 testimonial cards with names and roles, and 3 pricing tiers if applicable.
                            - Add a statistics/counter section with at least 4 numerical stats (e.g. "500+ Clients", "99.9% Uptime").
                            - Include a FAQ section with at least 4-5 questions using an accordion/toggle pattern.
                            - Footer must have 3-4 columns with navigation links, social media links, and copyright.
                            - Navigation must have links to all major sections using smooth scrolling anchor links.

                        INTERACTIVE FEATURES (GENERATE WORKING JAVASCRIPT):
                            - Working hamburger menu toggle for mobile navigation.
                            - Smooth scroll to sections via anchor links.
                            - Animated number counters that count up when scrolled into view.
                            - FAQ accordion that toggles open/close on click.
                            - Back-to-top button that appears on scroll.
                            - Form validation on contact/newsletter forms.
                            - Tab switching or category filtering if applicable.
                            - Intersection Observer animations for section fade-in effects.

                        The HTML should be complete and ready to render as-is with Tailwind CSS on ALL devices including mobile phones.
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


