import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../configs/openai.js";
import { sanitizeAndFixHtml, AI_MODELS } from "../lib/sanitizeHtml.js";



// Controller function to make revision
export const makeRevision = async (req: Request, res: Response) => {
    const userId = req.userId;
    try {
        const projectId = req.params.projectId as string;
        const { message } = req.body;

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        })

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.credits < 5) {
            return res.status(403).json({ message: 'Add more credits to make changes.' });
        }

        if (!message || message.trim() === "") {
            return res.status(400).json({ message: 'Please enter a valid prompt.' });
        }

        const currentProject = await prisma.websiteProject.findUnique({
            where: {
                id: projectId,
                userId: userId
            },
            include: {
                versions: true
            }
        })

        if (!currentProject) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        await prisma.conversation.create({
            data: {
                role: 'user',
                content: message,
                projectId
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

        // Enhance user prompt
        let enhancedPrompt = message;
        try {
            const promptEnhanceResponce = await openai.chat.completions.create({
                model: AI_MODELS[0],
                temperature: 0.7,
                max_tokens: 300,
                messages: [
                    {
                        role: "system",
                        content: `You are a prompt enhancer for website edits. Make the user's change request clearer and more specific for a web developer. Mention specific Tailwind classes or colors if relevant. Keep it simple — no complex animations, SVGs, or iframes. Return ONLY the enhanced request in 1-2 concise sentences.`
                    },
                    {
                        role: "user",
                        content: `User's request: "${message}"`
                    }
                ]
            });
            enhancedPrompt = promptEnhanceResponce.choices[0].message.content || message;
        } catch (enhanceErr) {
            console.warn('Prompt enhancement failed, using original message:', enhanceErr);
        }

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
                content: `Now making changes to your website...`,
                projectId
            }
        })

        // Generate website code with retry logic + model rotation
        let code = '';
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts && !code) {
            const model = AI_MODELS[attempts % AI_MODELS.length];
            attempts++;
            try {
                console.log(`Generating revision with ${model}... Attempt ${attempts}/${maxAttempts}`);
                const codeGenerationResponse = await openai.chat.completions.create({
                    model,
                    temperature: 0.7,
                    messages: [
                        {
                            role: "system",
                            content: `You are a web developer. Apply the user's requested changes to the existing HTML website code. Output ONLY the complete updated HTML starting with <!DOCTYPE html>. No markdown, no explanations, no code fences.

RULES:
- Use Tailwind CSS for all styling
- Keep <meta name="viewport" content="width=device-width, initial-scale=1.0"> in <head>
- Keep Tailwind CDN: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
- Maintain mobile-first responsive design: grid-cols-1 on mobile, md: breakpoints for larger screens
- Flex layouts: flex-col md:flex-row
- Add overflow-hidden on containers to prevent horizontal scroll
- Use getElementById for DOM selection — never querySelector with Tailwind classes
- High contrast: dark bg = light text, light bg = dark text
- Images: https://picsum.photos/{w}/{h}?random=N only. No fabricated URLs
- Icons: emoji only (🚀 ⚡ 🎯). NO SVGs, NO iframes
- JS: Only hamburger menu toggle with getElementById. No complex JS
- Keep the result concise and fast-loading
- Output ONLY the complete HTML. Nothing else.`
                        },
                        {
                            role: "user",
                            content: `Current website code:\n${currentProject.current_code}\n\nRequested changes: ${enhancedPrompt}`
                        }
                    ]
                });

                const result = codeGenerationResponse.choices[0].message.content || '';
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
                description: "Changes made by user",
                projectId
            }
        })

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "I've created your website! You can now preview it and request any changes.",
                projectId
            }
        })

        await prisma.websiteProject.update({
            where: {
                id: projectId
            },
            data: {
                current_code: cleanedCode,
                current_version_index: version.id
            }
        })

        console.log('✅ makeRevision completed - projectId:', projectId);
        return res.status(200).json({ message: "Changes made successfully." });

    } catch (error: any) {
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
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}




// Controller function to rollback to specific version

export const rollbackToVersion = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        const projectId = req.params.projectId as string;
        const versionId = req.params.versionId as string;
        if (!projectId || !versionId) {
            return res.status(400).json({ message: 'Invalid request.' });
        }

        const project = await prisma.websiteProject.findUnique({
            where: {
                id: projectId,
                userId
            },
            select: {
                versions: true
            }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        const version = project.versions.find((version) => version.id === versionId);

        if (!version) {
            return res.status(404).json({ message: 'Version not found.' });
        }

        await prisma.websiteProject.update({
            where: {
                id: projectId,
                userId
            },
            data: {
                current_code: version.code,
                current_version_index: versionId
            }
        })

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `I've rolled back your website to the selected version from ${version.timestamp.toLocaleString()}. You can now preview it and request any changes.`,
                projectId
            }
        })

        console.log('✅ rollbackToVersion completed - projectId:', projectId, 'versionId:', versionId);
        return res.status(200).json({ message: 'Version rolled back successfully.' });

    } catch (error: any) {
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}



// Controller function to delete project
export const deleteProject = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = req.params.projectId as string;

        await prisma.websiteProject.delete({
            where: {
                id: projectId,
                userId
            }
        })

        console.log('✅ deleteProject completed - projectId:', projectId);
        return res.status(200).json({ message: 'Project deleted successfully.' });

    } catch (error: any) {
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}



// Controller for getting project code for preview
export const getProjectPreview = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = req.params.projectId as string;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        const project = await prisma.websiteProject.findFirst({
            where: {
                id: projectId,
                userId
            },
            select: {
                versions: true,
                current_code: true
            }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        console.log('✅ getProjectPreview completed - projectId:', projectId);
        return res.status(200).json({ project });

    } catch (error: any) {
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}




// Get published projects
export const getPublishedProjects = async (req: Request, res: Response) => {
    try {

        const projects = await prisma.websiteProject.findMany({
            where: {
                isPublished: true
            },
            include: {
                user: true
            }
        })

        console.log('✅ getPublishedProjects completed - found', projects.length, 'published projects');
        return res.status(200).json({ projects });

    } catch (error: any) {
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}



// Get a single project by id
export const getProjectById = async (req: Request, res: Response) => {
    try {
        const projectId = req.params.projectId as string;

        const project = await prisma.websiteProject.findFirst({
            where: {
                id: projectId,
            }
        })

        if (!project || project.isPublished === false || !project.current_code) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        console.log('✅ getProjectById completed - projectId:', projectId);
        return res.status(200).json({ code: project.current_code });

    } catch (error: any) {
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}



// Controller to save project
export const saveProjectCode = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = req.params.projectId as string;
        const { code } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        if (!code) {
            return res.status(400).json({ message: 'Code is required.' });
        }

        const project = await prisma.websiteProject.findUnique({
            where: {
                id: projectId,
                userId
            }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        const cleanedCode = sanitizeAndFixHtml(code);

        await prisma.$transaction(async (tx) => {
            const version = await tx.version.create({
                data: {
                    code: cleanedCode,
                    description: "Manual save",
                    projectId
                }
            })

            await tx.websiteProject.update({
                where: {
                    id: projectId
                },
                data: {
                    current_code: cleanedCode,
                    current_version_index: version.id
                }
            })
        })

        console.log('✅ saveProjectCode completed - projectId:', projectId);
        return res.status(200).json({ message: 'Project saved successfully.' });

    } catch (error: any) {
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}
