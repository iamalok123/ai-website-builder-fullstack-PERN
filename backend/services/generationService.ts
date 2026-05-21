import openai from "../configs/openai.js";
import prisma from "../lib/prisma.js";
import { AI_MODELS, sanitizeAndFixHtml } from "../lib/sanitizeHtml.js";
import { refundCredits } from "./creditService.js";

const GENERATION_CREDIT_COST = 5;
const MAX_ATTEMPTS = 3;
const DEFAULT_GENERATION_TIMEOUT_MS = 8 * 60 * 1000;
const DEFAULT_REVISION_TIMEOUT_MS = 4 * 60 * 1000;
const DEFAULT_AI_REQUEST_TIMEOUT_MS = 2 * 60 * 1000;
const DEFAULT_PRISMA_TRANSACTION_TIMEOUT_MS = 30 * 1000;

export const GENERATION_TIMEOUT_MS = Number(process.env.GENERATION_TIMEOUT_MS || DEFAULT_GENERATION_TIMEOUT_MS);
export const REVISION_TIMEOUT_MS = Number(process.env.REVISION_TIMEOUT_MS || DEFAULT_REVISION_TIMEOUT_MS);
const AI_REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS || DEFAULT_AI_REQUEST_TIMEOUT_MS);
const PRISMA_TRANSACTION_TIMEOUT_MS = Number(process.env.PRISMA_TRANSACTION_TIMEOUT_MS || DEFAULT_PRISMA_TRANSACTION_TIMEOUT_MS);

const getJobTimeoutMs = (type?: "initial" | "revision") => {
    return type === "revision" ? REVISION_TIMEOUT_MS : GENERATION_TIMEOUT_MS;
};

const transactionOptions = {
    timeout: PRISMA_TRANSACTION_TIMEOUT_MS,
    maxWait: 10_000
};

const getStaleGenerationCutoff = () => new Date(Date.now() - Math.max(GENERATION_TIMEOUT_MS, REVISION_TIMEOUT_MS));
const getRequestTimeout = (deadline: number) => {
    const remaining = deadline - Date.now();
    return Math.max(1_000, Math.min(AI_REQUEST_TIMEOUT_MS, remaining));
};

const assertGenerationDeadline = (deadline: number) => {
    if (Date.now() >= deadline) {
        throw new Error("Generation timed out before it completed. Your credits were restored, so you can try again.");
    }
};

const isHtmlResponse = (value: string) => {
    return value.includes("<html") || value.includes("<!DOCTYPE") || value.includes("<head");
};

const getCompletionText = (response: unknown) => {
    const completion = response as { choices?: Array<{ message?: { content?: string | null } }> };
    return completion.choices?.[0]?.message?.content || "";
};

const getProviderStatus = (error: unknown) => {
    const providerError = error as {
        status?: number;
        code?: number | string;
        error?: { code?: number | string };
    };

    if (typeof providerError.status === "number") return providerError.status;
    if (providerError.code === 401 || providerError.code === "401") return 401;
    if (providerError.code === 403 || providerError.code === "403") return 403;
    if (providerError.error?.code === 401 || providerError.error?.code === "401") return 401;
    if (providerError.error?.code === 403 || providerError.error?.code === "403") return 403;
    return undefined;
};

const isProviderAuthError = (error: unknown) => {
    const status = getProviderStatus(error);
    return status === 401 || status === 403;
};

const providerAuthError = () => new Error(
    "AI provider authentication failed. Check backend AI_API_KEY and make sure it is a valid OpenRouter API key with access enabled."
);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizePrompt = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

const hasUsefulEnhancement = (original: string, enhanced: string) => {
    const normalizedOriginal = normalizePrompt(original);
    const normalizedEnhanced = normalizePrompt(enhanced);

    return Boolean(normalizedEnhanced)
        && normalizedEnhanced !== normalizedOriginal
        && normalizedEnhanced.length >= normalizedOriginal.length + 80;
};

const buildEnhancedInitialPromptFallback = (initialPrompt: string) => {
    const prompt = initialPrompt.trim();

    return `Create a polished, production-quality, fully responsive one-page website based on this user request: "${prompt}". Infer the likely business, audience, and goal from the request, then expand it into a clear website brief with a strong brand direction, professional copy, and practical sections. Use a tasteful modern visual style with high contrast, a restrained 4-color palette, polished Google Fonts, clear CTA hierarchy, generous whitespace, balanced cards, subtle borders, and consistent spacing. Include 4-6 useful sections such as nav, hero, proof/about, features or services, CTA/contact, and footer. The design must be mobile-first and work cleanly on phone, tablet, laptop, and desktop: no horizontal scroll, responsive grids, readable text, properly wrapping buttons, balanced columns, and sections that stack naturally on small screens. Use only helpful picsum.photos images if images improve the design; otherwise rely on typography, layout, chips, stats, and cards. Avoid SVGs, iframes, carousels, complex animations, clutter, random colors, low contrast text, and fabricated asset URLs.`;
};

const buildEnhancedRevisionPromptFallback = (message: string) => {
    const prompt = message.trim();

    return `Apply this requested website change: "${prompt}". Preserve the existing design system while improving spacing, alignment, typography, contrast, CTA hierarchy, and responsive behavior. Ensure the updated page remains polished on phone, tablet, laptop, and desktop with no horizontal overflow, readable text, balanced cards, and clean mobile stacking.`;
};

const enhanceInitialPrompt = async (initialPrompt: string, deadline: number) => {
    try {
        assertGenerationDeadline(deadline);
        const response = await openai.chat.completions.create({
            model: AI_MODELS[0],
            temperature: 0.7,
            max_tokens: 900,
            messages: [
                {
                    role: "system",
                    content: `You are a senior product designer writing a build brief for an AI web developer. Transform the user's request into a specific, tasteful one-page website brief.

Your brief must include:
- Brand direction: choose one clear visual mood, such as premium SaaS, editorial portfolio, wellness, fintech, creative studio, restaurant, education, or local service.
- Palette: choose exactly 4 hex colors with roles: background, surface, primary accent, secondary accent. Avoid random rainbow colors and avoid low contrast.
- Typography: choose a polished Google Font pairing from Inter, Manrope, Plus Jakarta Sans, Playfair Display, Space Grotesk, DM Sans, or Merriweather. Explain heading/body usage.
- Layout: 5 sections max: Nav, Hero, Proof/Stats or About, Features/Services, CTA/Contact, Footer. Give each section a clear visual purpose.
- Composition rules: strong hero, generous whitespace, consistent 8/12/16/24/32/48px spacing rhythm, max width, responsive grid, visible CTA, professional cards, no clutter.
- Asset rules: use only picsum image URLs if images help; otherwise use elegant type, borders, chips, stats, and layout instead of weak decorative icons.

Keep it concise but detailed. No markdown headings. No SVGs, iframes, carousels, complex animations, or fabricated asset URLs. Output ONLY the enhanced brief.`
                },
                {
                    role: "user",
                    content: initialPrompt
                }
            ]
        }, { timeout: getRequestTimeout(deadline) });

        const enhancedPrompt = getCompletionText(response).trim();
        return hasUsefulEnhancement(initialPrompt, enhancedPrompt)
            ? enhancedPrompt
            : buildEnhancedInitialPromptFallback(initialPrompt);
    } catch (error) {
        if (isProviderAuthError(error)) {
            throw providerAuthError();
        }

        console.warn("Prompt enhancement failed, using deterministic enhanced prompt:", error);
        return buildEnhancedInitialPromptFallback(initialPrompt);
    }
};

const enhanceRevisionPrompt = async (message: string, deadline: number) => {
    try {
        assertGenerationDeadline(deadline);
        const response = await openai.chat.completions.create({
            model: AI_MODELS[0],
            temperature: 0.7,
            max_tokens: 450,
            messages: [
                {
                    role: "system",
                    content: `You are a senior product designer improving a website edit request. Rewrite the user's request as a precise implementation instruction that preserves the existing site's design system.

Include only what should change, and mention how to keep typography, spacing, contrast, responsive layout, and CTA hierarchy polished. If colors are involved, specify tasteful Tailwind-compatible color choices. Avoid SVGs, iframes, carousels, and complex JavaScript. Return ONLY 1-3 concise sentences.`
                },
                {
                    role: "user",
                    content: `User's request: "${message}"`
                }
            ]
        }, { timeout: getRequestTimeout(deadline) });

        const enhancedPrompt = getCompletionText(response).trim();
        return hasUsefulEnhancement(message, enhancedPrompt)
            ? enhancedPrompt
            : buildEnhancedRevisionPromptFallback(message);
    } catch (error) {
        if (isProviderAuthError(error)) {
            throw providerAuthError();
        }

        console.warn("Prompt enhancement failed, using deterministic enhanced revision:", error);
        return buildEnhancedRevisionPromptFallback(message);
    }
};

const generateInitialWebsiteCode = async (prompt: string, deadline: number) => {
    let code = "";

    for (let attempts = 1; attempts <= MAX_ATTEMPTS && !code; attempts++) {
        assertGenerationDeadline(deadline);
        const model = AI_MODELS[(attempts - 1) % AI_MODELS.length];

        try {
            console.log(`Generating website code with ${model}... Attempt ${attempts}/${MAX_ATTEMPTS}`);
            const response = await openai.chat.completions.create({
                model,
                temperature: 0.65,
                max_tokens: 7000,
                messages: [
                    {
                        role: "system",
                        content: `You are a senior frontend designer and developer. Generate a polished, production-quality, single-page HTML website. Output ONLY valid HTML starting with <!DOCTYPE html>. No markdown, no explanations, no code fences.

INCLUDE IN <head>:
- <meta charset="UTF-8">
- <meta name="viewport" content="width=device-width, initial-scale=1.0">
- <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
- A Google Fonts link matching the design brief. Prefer Inter, Manrope, Plus Jakarta Sans, DM Sans, Space Grotesk, Playfair Display, or Merriweather.
- <style> with body font-family, scroll-behavior:smooth, overflow-x:hidden, antialiased rendering, and a few tasteful custom utility styles if needed.

DESIGN QUALITY BAR:
- Create a beautiful, cohesive visual system, not a plain template.
- Pick a restrained palette: background, surface, primary accent, secondary accent, and neutral text. Use them consistently.
- Use high contrast text. Never put gray text on low-contrast colored backgrounds.
- Use strong hierarchy: nav small, hero heading large, section headings clear, body readable.
- Use whitespace intentionally: sections py-16 md:py-24, containers max-w-6xl or max-w-7xl, cards p-6 or p-8.
- Use rounded-xl/2xl, subtle borders, soft shadows, badges/chips, stats, and alternating section backgrounds.
- Do not make all sections the same color. Each section should feel related but visually distinct.
- Align content carefully. Avoid awkward empty spaces, cramped cards, centered everything, or uneven grids.
- Use tasteful imagery only when useful: picsum.photos URLs with fixed dimensions and object-cover.
- Buttons must look premium: clear primary CTA, optional secondary CTA, hover state, focus-visible outline.

STRUCTURE (4-6 sections, keep HTML under 320 lines):
1. Nav: brand name, 3-4 links, primary action. Mobile hamburger using getElementById.
2. Hero: memorable headline, supporting copy, 1-2 CTAs, optional visual/image/stat panel.
3. Proof/About/Stats: credibility numbers, short story, or client-style proof.
4. Features/Services: 3-6 cards with clear titles, useful copy, and consistent spacing.
5. CTA/Contact/Pricing teaser: strong next action.
6. Footer: compact links and brand line.

MOBILE-FIRST RESPONSIVE:
- Start with mobile layout, add md: and lg: breakpoints for larger screens
- Grids: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
- Flex: flex-col md:flex-row
- Padding: px-4 md:px-8 lg:px-12, Section spacing: py-12 md:py-20
- Container: max-w-7xl mx-auto overflow-hidden
- Text: body text-base md:text-lg, hero headings text-4xl md:text-6xl, section headings text-2xl md:text-4xl

STRICT RULES:
- NO SVGs, NO iframes, NO complex animations, NO carousels, NO animated counters
- Avoid emojis unless the user explicitly asks for a playful style
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
            }, { timeout: getRequestTimeout(deadline) });

            const result = getCompletionText(response);
            if (isHtmlResponse(result)) {
                code = result;
                break;
            }

            console.warn(`Attempt ${attempts}: Response did not contain valid HTML, retrying...`);
        } catch (error) {
            console.error(`Attempt ${attempts} with ${model} failed:`, error);
            if (isProviderAuthError(error)) {
                throw providerAuthError();
            }
            if (attempts === MAX_ATTEMPTS) throw error;
            assertGenerationDeadline(deadline);
            await wait(1500);
        }
    }

    return code;
};

const generateRevisionWebsiteCode = async (currentCode: string, prompt: string, deadline: number) => {
    let code = "";

    for (let attempts = 1; attempts <= MAX_ATTEMPTS && !code; attempts++) {
        assertGenerationDeadline(deadline);
        const model = AI_MODELS[(attempts - 1) % AI_MODELS.length];

        try {
            console.log(`Generating revision with ${model}... Attempt ${attempts}/${MAX_ATTEMPTS}`);
            const response = await openai.chat.completions.create({
                model,
                temperature: 0.6,
                max_tokens: 7000,
                messages: [
                    {
                        role: "system",
                        content: `You are a senior frontend designer and developer. Apply the user's requested changes to the existing HTML website and return a polished complete HTML document. Output ONLY the complete updated HTML starting with <!DOCTYPE html>. No markdown, no explanations, no code fences.

RULES:
- Preserve the existing brand direction unless the user asks for a redesign.
- Improve visual quality while editing: spacing, alignment, typography, contrast, CTA hierarchy, card balance, and responsive behavior must remain professional.
- Use Tailwind CSS for all styling
- Keep <meta name="viewport" content="width=device-width, initial-scale=1.0"> in <head>
- Keep Tailwind CDN: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
- Keep or add polished Google Fonts if missing. Prefer Inter, Manrope, Plus Jakarta Sans, DM Sans, Space Grotesk, Playfair Display, or Merriweather.
- Maintain mobile-first responsive design: grid-cols-1 on mobile, md: breakpoints for larger screens
- Flex layouts: flex-col md:flex-row
- Add overflow-hidden on containers to prevent horizontal scroll
- Use getElementById for DOM selection — never querySelector with Tailwind classes
- High contrast: dark bg = light text, light bg = dark text
- Keep sections visually cohesive but distinct using a controlled palette, subtle borders, shadows, and alternating surfaces.
- Avoid awkward placement, cramped spacing, unbalanced columns, unreadable text, and random colors.
- Images: https://picsum.photos/{w}/{h}?random=N only. No fabricated URLs
- Avoid emojis unless already used intentionally. NO SVGs, NO iframes
- JS: Only hamburger menu toggle with getElementById. No complex JS
- Keep the result concise and fast-loading
- Output ONLY the complete HTML. Nothing else.`
                    },
                    {
                        role: "user",
                        content: `Current website code:\n${currentCode}\n\nRequested changes: ${prompt}`
                    }
                ]
            }, { timeout: getRequestTimeout(deadline) });

            const result = getCompletionText(response);
            if (isHtmlResponse(result)) {
                code = result;
                break;
            }

            console.warn(`Attempt ${attempts}: Response did not contain valid HTML, retrying...`);
        } catch (error) {
            console.error(`Attempt ${attempts} with ${model} failed:`, error);
            if (isProviderAuthError(error)) {
                throw providerAuthError();
            }
            if (attempts === MAX_ATTEMPTS) throw error;
            assertGenerationDeadline(deadline);
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

    if (job.status === "completed" || job.status === "failed") {
        return;
    }

    await prisma.$transaction(async (tx) => {
        const failedJob = await tx.generationJob.updateMany({
            where: {
                id: jobId,
                status: {
                    not: "completed"
                }
            },
            data: {
                status: "failed",
                error: errorMessage,
                completedAt: new Date()
            }
        });

        if (failedJob.count === 0) {
            return;
        }

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
    }, transactionOptions);
};

export const runGenerationJob = async (jobId: string) => {
    const staleCutoff = getStaleGenerationCutoff();
    const claim = await prisma.generationJob.updateMany({
        where: {
            id: jobId,
            OR: [
                { status: "queued" },
                {
                    status: "running",
                    OR: [
                        { startedAt: { lt: staleCutoff } },
                        {
                            startedAt: null,
                            updatedAt: { lt: staleCutoff }
                        }
                    ]
                }
            ]
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

    const deadline = Date.now() + getJobTimeoutMs(job.type);

    await prisma.websiteProject.update({
        where: { id: job.projectId },
        data: {
            generationStatus: "running",
            generationError: null
        }
    });

    try {
        const enhancedPrompt = job.type === "initial"
            ? await enhanceInitialPrompt(job.prompt, deadline)
            : await enhanceRevisionPrompt(job.prompt, deadline);

        const promptForGeneration = enhancedPrompt;

        await prisma.generationJob.update({
            where: { id: jobId },
            data: { enhancedPrompt: promptForGeneration }
        });

        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: `I have enhanced your prompt to : "${promptForGeneration}"`,
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

        assertGenerationDeadline(deadline);
        const generatedCode = job.type === "initial"
            ? await generateInitialWebsiteCode(promptForGeneration, deadline)
            : await generateRevisionWebsiteCode(job.project.current_code || "", promptForGeneration, deadline);

        if (!generatedCode) {
            throw new Error("The AI model did not return valid HTML.");
        }

        const cleanedCode = sanitizeAndFixHtml(generatedCode);
        const versionDescription = job.type === "initial" ? "Initial version" : "Changes made by user";

        await prisma.$transaction(async (tx) => {
            const completedJob = await tx.generationJob.updateMany({
                where: {
                    id: jobId,
                    status: "running"
                },
                data: {
                    status: "completed",
                    error: null,
                    completedAt: new Date()
                }
            });

            if (completedJob.count === 0) {
                throw new Error("Generation job is no longer active.");
            }

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
        }, transactionOptions);

        console.log(`Generation job completed: ${jobId}`);
        return { projectId: job.projectId, status: "completed" };
    } catch (error) {
        console.error(`Generation job failed: ${jobId}`, error);
        await markGenerationJobFailed(jobId, error);
        return { projectId: job.projectId, status: "failed" };
    }
};

export const failStaleGenerationForProject = async (userId: string, projectId: string) => {
    const activeJob = await prisma.generationJob.findFirst({
        where: {
            userId,
            projectId,
            OR: [
                { status: "queued" },
                { status: "running" }
            ]
        },
        orderBy: {
            createdAt: "desc"
        },
        select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
            startedAt: true,
            updatedAt: true
        }
    });

    if (!activeJob) {
        return;
    }

    const timeoutMs = getJobTimeoutMs(activeJob.type);
    const referenceDate = activeJob.status === "running"
        ? activeJob.startedAt || activeJob.updatedAt
        : activeJob.createdAt;

    if (Date.now() - referenceDate.getTime() < timeoutMs) {
        return;
    }

    await markGenerationJobFailed(
        activeJob.id,
        new Error("Generation timed out before it completed. Your credits were restored, so you can try again.")
    );
};
