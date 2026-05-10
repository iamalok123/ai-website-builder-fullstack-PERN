import prisma from "../lib/prisma.js";
import { inngest, INNGEST_EVENTS } from "../lib/inngest.js";
import { InsufficientCreditsError, debitCredits } from "./creditService.js";
import { markGenerationJobFailed, runGenerationJob } from "./generationService.js";

const GENERATION_CREDIT_COST = 5;

const getProjectName = (prompt: string) => {
    return prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt;
};

export const enqueueGenerationJob = async (jobId: string) => {
    const useInlineFallback = process.env.ENABLE_INLINE_GENERATION_FALLBACK === "true";

    try {
        await inngest.send({
            name: INNGEST_EVENTS.websiteGenerationRequested,
            data: { jobId }
        });
    } catch (error) {
        if (!useInlineFallback) {
            throw error;
        }

        console.warn("Inngest enqueue failed; running inline fallback for job:", jobId, error);
        void runGenerationJob(jobId);
        return;
    }

    return;
};

export const createProjectWithGenerationJob = async (userId: string, initialPrompt: string) => {
    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { credits: true }
        });

        if (!user) {
            throw new Error("User not found.");
        }

        if (user.credits < GENERATION_CREDIT_COST) {
            throw new InsufficientCreditsError();
        }

        const project = await tx.websiteProject.create({
            data: {
                name: getProjectName(initialPrompt),
                initial_prompt: initialPrompt,
                userId,
                generationStatus: "queued",
                generationError: null
            },
            select: { id: true }
        });

        const job = await tx.generationJob.create({
            data: {
                type: "initial",
                status: "queued",
                prompt: initialPrompt,
                userId,
                projectId: project.id
            },
            select: { id: true }
        });

        await tx.user.update({
            where: { id: userId },
            data: {
                totalCreation: {
                    increment: 1
                }
            }
        });

        await tx.conversation.create({
            data: {
                role: "user",
                content: initialPrompt,
                projectId: project.id
            }
        });

        await debitCredits(tx, {
            userId,
            amount: GENERATION_CREDIT_COST,
            reason: "project creation",
            projectId: project.id,
            jobId: job.id
        });

        return { projectId: project.id, jobId: job.id };
    });

    try {
        await enqueueGenerationJob(result.jobId);
    } catch (error) {
        await markGenerationJobFailed(result.jobId, error);
        throw new Error("Unable to queue website generation. Your credits were restored.");
    }

    return result;
};

export const createRevisionGenerationJob = async (userId: string, projectId: string, message: string) => {
    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { credits: true }
        });

        if (!user) {
            throw new Error("User not found.");
        }

        if (user.credits < GENERATION_CREDIT_COST) {
            throw new InsufficientCreditsError();
        }

        const project = await tx.websiteProject.findUnique({
            where: { id: projectId, userId },
            select: {
                id: true,
                current_code: true,
                generationStatus: true
            }
        });

        if (!project) {
            throw new Error("Project not found.");
        }

        if (!project.current_code) {
            throw new Error("Please wait until the first generation is complete before requesting changes.");
        }

        if (project.generationStatus === "queued" || project.generationStatus === "running") {
            throw new Error("A generation is already in progress for this project.");
        }

        const job = await tx.generationJob.create({
            data: {
                type: "revision",
                status: "queued",
                prompt: message,
                userId,
                projectId
            },
            select: { id: true }
        });

        await tx.conversation.create({
            data: {
                role: "user",
                content: message,
                projectId
            }
        });

        await tx.websiteProject.update({
            where: { id: projectId },
            data: {
                generationStatus: "queued",
                generationError: null
            }
        });

        await debitCredits(tx, {
            userId,
            amount: GENERATION_CREDIT_COST,
            reason: "project revision",
            projectId,
            jobId: job.id
        });

        return { projectId, jobId: job.id };
    });

    try {
        await enqueueGenerationJob(result.jobId);
    } catch (error) {
        await markGenerationJobFailed(result.jobId, error);
        throw new Error("Unable to queue website revision. Your credits were restored.");
    }

    return result;
};
