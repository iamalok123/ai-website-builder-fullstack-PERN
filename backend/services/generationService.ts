import openai from "../configs/openai.js";
import prisma from "../lib/prisma.js";
import { AI_MODELS, sanitizeAndFixHtml } from "../lib/sanitizeHtml.js";
import { refundCredits } from "./creditService.js";

const GENERATION_CREDIT_COST = 5;
const MAX_ATTEMPTS = 3;

const isHtmlResponse = (value: string) => {
    return value.includes("<html") || value.includes("<!DOCTYPE") || value.includes("<head");
};

const getCompletionText = (response: unknown) => {
    const completion = response as { choices?: Array<{ message?: { content?: string | null } }> };
    return completion.choices?.[0]?.message?.content || "";
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const enhanceInitialPrompt = async (initialPrompt: string) => {
    try {
        const response = await openai.chat.completions.create({
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

        return getCompletionText(response) || initialPrompt;
    } catch (error) {
        console.warn("Prompt enhancement failed, using original prompt:", error);
        return initialPrompt;
    }
};

const enhanceRevisionPrompt = async (message: string) => {
    try {
        const response = await openai.chat.completions.create({
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

        return getCompletionText(response) || message;
    } catch (error) {
        console.warn("Prompt enhancement failed, using original message:", error);
        return message;
    }
};

const generateInitialWebsiteCode = async (prompt: string) => {
    let code = "";

    for (let attempts = 1; attempts <= MAX_ATTEMPTS && !code; attempts++) {
        const model = AI_MODELS[(attempts - 1) % AI_MODELS.length];

        try {
            console.log(`Generating website code with ${model}... Attempt ${attempts}/${MAX_ATTEMPTS}`);
            const response = await openai.chat.completions.create({
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
3. Features/About: 3 cards in a grid with emoji icons (rocket, lightning, target, bulb, star, phone) — NO SVGs
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
                        content: prompt
                    }
                ]
            });

            const result = getCompletionText(response);
            if (isHtmlResponse(result)) {
                code = result;
                break;
            }

            console.warn(`Attempt ${attempts}: Response did not contain valid HTML, retrying...`);
        } catch (error) {
            console.error(`Attempt ${attempts} with ${model} failed:`, error);
            if (attempts === MAX_ATTEMPTS) throw error;
            await wait(1500);
        }
    }

    return code;
};

const generateRevisionWebsiteCode = async (currentCode: string, prompt: string) => {
    let code = "";

    for (let attempts = 1; attempts <= MAX_ATTEMPTS && !code; attempts++) {
        const model = AI_MODELS[(attempts - 1) % AI_MODELS.length];

        try {
            console.log(`Generating revision with ${model}... Attempt ${attempts}/${MAX_ATTEMPTS}`);
            const response = await openai.chat.completions.create({
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
- Icons: emoji only. NO SVGs, NO iframes
- JS: Only hamburger menu toggle with getElementById. No complex JS
- Keep the result concise and fast-loading
- Output ONLY the complete HTML. Nothing else.`
                    },
                    {
                        role: "user",
                        content: `Current website code:\n${currentCode}\n\nRequested changes: ${prompt}`
                    }
                ]
            });

            const result = getCompletionText(response);
            if (isHtmlResponse(result)) {
                code = result;
                break;
            }

            console.warn(`Attempt ${attempts}: Response did not contain valid HTML, retrying...`);
        } catch (error) {
            console.error(`Attempt ${attempts} with ${model} failed:`, error);
            if (attempts === MAX_ATTEMPTS) throw error;
            await wait(1500);
        }
    }

    return code;
};

export const markGenerationJobFailed = async (jobId: string, error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : "Unable to generate your website.";
    const job = await prisma.generationJob.findUnique({
        where: { id: jobId },
        select: { userId: true, projectId: true, status: true }
    });

    if (!job) {
        return;
    }

    await prisma.$transaction(async (tx) => {
        await tx.generationJob.update({
            where: { id: jobId },
            data: {
                status: "failed",
                error: errorMessage,
                completedAt: new Date()
            }
        });

        await tx.websiteProject.update({
            where: { id: job.projectId },
            data: {
                generationStatus: "failed",
                generationError: errorMessage
            }
        });

        await tx.conversation.create({
            data: {
                role: "assistant",
                content: "An error occurred while generating your website. Your credits were restored so you can try again.",
                projectId: job.projectId
            }
        });

        if (job.status !== "failed") {
            await refundCredits(tx, {
                userId: job.userId,
                amount: GENERATION_CREDIT_COST,
                reason: "generation failure refund",
                projectId: job.projectId,
                jobId
            });
        }
    });
};

export const runGenerationJob = async (jobId: string) => {
    const claim = await prisma.generationJob.updateMany({
        where: {
            id: jobId,
            status: "queued"
        },
        data: {
            status: "running",
            attempts: {
                increment: 1
            },
            error: null,
            startedAt: new Date()
        }
    });

    if (claim.count === 0) {
        const existingJob = await prisma.generationJob.findUnique({
            where: { id: jobId },
            select: {
                projectId: true,
                status: true
            }
        });

        if (!existingJob) {
            throw new Error(`Generation job ${jobId} was not found.`);
        }

        console.log(`Generation job ${jobId} is already ${existingJob.status}; skipping duplicate execution.`);
        return { projectId: existingJob.projectId, status: existingJob.status };
    }

    const job = await prisma.generationJob.findUnique({
        where: { id: jobId },
        include: {
            project: true
        }
    });

    if (!job) {
        throw new Error(`Generation job ${jobId} was not found.`);
    }

    await prisma.$transaction(async (tx) => {
        await tx.websiteProject.update({
            where: { id: job.projectId },
            data: {
                generationStatus: "running",
                generationError: null
            }
        });
    });

    try {
        const enhancedPrompt = job.type === "initial"
            ? await enhanceInitialPrompt(job.prompt)
            : await enhanceRevisionPrompt(job.prompt);

        await prisma.generationJob.update({
            where: { id: jobId },
            data: { enhancedPrompt }
        });

        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: `I have enhanced your prompt to : "${enhancedPrompt}"`,
                projectId: job.projectId
            }
        });

        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: job.type === "initial" ? "Now generating your website..." : "Now making changes to your website...",
                projectId: job.projectId
            }
        });

        const generatedCode = job.type === "initial"
            ? await generateInitialWebsiteCode(enhancedPrompt || job.prompt)
            : await generateRevisionWebsiteCode(job.project.current_code || "", enhancedPrompt || job.prompt);

        if (!generatedCode) {
            throw new Error("The AI model did not return valid HTML.");
        }

        const cleanedCode = sanitizeAndFixHtml(generatedCode);
        const versionDescription = job.type === "initial" ? "Initial version" : "Changes made by user";

        await prisma.$transaction(async (tx) => {
            const version = await tx.version.create({
                data: {
                    code: cleanedCode,
                    description: versionDescription,
                    projectId: job.projectId
                }
            });

            await tx.conversation.create({
                data: {
                    role: "assistant",
                    content: "I've created your website! You can now preview it and request any changes.",
                    projectId: job.projectId
                }
            });

            await tx.websiteProject.update({
                where: { id: job.projectId },
                data: {
                    current_code: cleanedCode,
                    current_version_index: version.id,
                    currentVersionId: version.id,
                    generationStatus: "completed",
                    generationError: null
                }
            });

            await tx.generationJob.update({
                where: { id: jobId },
                data: {
                    status: "completed",
                    error: null,
                    completedAt: new Date()
                }
            });
        });

        console.log(`Generation job completed: ${jobId}`);
        return { projectId: job.projectId, status: "completed" };
    } catch (error) {
        console.error(`Generation job failed: ${jobId}`, error);
        await markGenerationJobFailed(jobId, error);
        throw error;
    }
};
