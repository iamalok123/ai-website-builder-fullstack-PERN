import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../configs/openai.js";



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
        const promptEnhanceResponce = await openai.chat.completions.create({
            model: "arcee-ai/trinity-large-preview:free",
            messages: [
                {
                    role: "system",
                    content: `
                        You are a prompt enhancement specialist. The user wants to make changes to their website. Enhance their request to be more specific, actionable, and content-rich for a web developer.

                        Enhance this by:
                        1. Being specific about what elements to change, add, or remove
                        2. Mentioning design details (colors with hex codes, spacing using Tailwind scale, typography sizes)
                        3. Clarifying the desired outcome including responsive behavior (mobile/tablet/desktop)
                        4. Using clear technical terms (Tailwind classes, CSS properties)
                        5. If images are involved, specify using https://picsum.photos/{width}/{height} URLs
                        6. If layout changes are requested, specify mobile-first stacking behavior
                        7. If the user asks for "more pages" or "more features", expand this into specific sections to add (e.g., testimonials, FAQ accordion, pricing table, team section, statistics counters, blog preview, newsletter signup)
                        8. For any new sections, describe the heading, body text content (2-3 realistic sentences), and number of items/cards needed

                        Return ONLY the enhanced request, nothing else. Keep it concise (2-3 sentences).
                    `
                },
                {
                    role: "user",
                    content: `User's request: "${message}"`
                }
            ]
        })

        const enhancedPrompt = promptEnhanceResponce.choices[0].message.content;

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

        // Generate website code
        const codeGenerationResponse = await openai.chat.completions.create({
            model: "arcee-ai/trinity-large-preview:free",
            messages: [
                {
                    role: "system",
                    content: `
                        You are an expert web developer. Apply the user's requested changes to the existing website code.

                        CRITICAL REQUIREMENTS:
                        - Return ONLY the complete updated HTML code with the requested changes.
                        - Use Tailwind CSS for ALL styling.
                        - Use Tailwind utility classes for all styling changes.
                        - Include all JavaScript in <script> tags before closing </body>.
                        - Make sure it's a complete, standalone HTML document with Tailwind CSS.
                        - Return the HTML Code Only, nothing else.
                        - If using external libraries (like TinyMCE, Swiper, etc.), YOU MUST INCLUDE the CDN script/link in the <head> or before </body>.

                        MOBILE-FIRST RESPONSIVE DESIGN:
                        - PRESERVE all existing responsive classes when making changes.
                        - Any new elements must use mobile-first design: base styles for mobile, then sm:, md:, lg:, xl: for larger screens.
                        - New grids should use grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pattern.
                        - New flex layouts should use flex-col md:flex-row pattern.
                        - New content must have horizontal padding (px-4 sm:px-6 lg:px-8).

                        IMAGES:
                        - For any new images, use https://picsum.photos/{width}/{height}?random=N.
                        - Every <img> must have alt, loading="lazy", width, height, and class="w-full h-auto object-cover".
                        - NEVER use fabricated Google image URLs.

                        COLOR CONTRAST (CRITICAL):
                        - Text and background MUST ALWAYS have high contrast. Dark bg = light text (text-white/text-gray-100). Light bg = dark text (text-gray-800/text-gray-900).
                        - NEVER use same-tone text and background (e.g. dark text on dark bg, or light text on light bg).
                        - Colored/gradient backgrounds must use text-white. Cards must contrast with their parent section background.

                        JAVASCRIPT RULES:
                        - Use getElementById for DOM selection — NEVER querySelector with Tailwind class selectors.
                        - PREFERRED: Use unique IDs (e.g. id="mobile-menu" -> document.getElementById('mobile-menu')).

                        CONTENT RICHNESS FOR NEW SECTIONS:
                        - Any new section MUST have a heading (h2) AND 2-3 sentences of realistic body text.
                        - New cards/items MUST have icons (SVG or emoji), titles, AND descriptive paragraphs.
                        - Use realistic, professional placeholder text — NOT Lorem Ipsum.
                        - If adding interactive elements: implement working JavaScript (accordion toggles, counters, form validation, etc.).

                        Apply the requested changes while maintaining mobile responsiveness, content richness, and the existing Tailwind CSS styling approach.
                    `
                },
                {
                    role: "user",
                    content: `Here is the current website code: "${currentProject.current_code}" 
                            The user wants these changes: "${enhancedPrompt}"`
                }
            ]
        })

        const code = codeGenerationResponse.choices[0].message.content || '';

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
            // We ONLY escape slashes, not colons, to avoid breaking valid CSS pseudo-classes like :hover
            sanitized = sanitized.replace(/document\.querySelector\(['"](\.[^'"]+)['"]\)/g, (match, selector) => {
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
                content: `I've rolled back your website to version . You can now preview it and request any changes.`,
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

        await prisma.websiteProject.update({
            where: {
                id: projectId
            },
            data: {
                current_code: code,
                current_version_index: ''
            }
        })

        console.log('✅ saveProjectCode completed - projectId:', projectId);
        return res.status(200).json({ message: 'Project saved successfully.' });

    } catch (error: any) {
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}