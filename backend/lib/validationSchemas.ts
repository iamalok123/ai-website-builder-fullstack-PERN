import { z } from "zod";

const htmlPayloadMaxLength = 2_000_000;

export const projectIdParamSchema = z.object({
    projectId: z.string().uuid('Invalid project id.'),
});

export const rollbackParamSchema = z.object({
    projectId: z.string().uuid('Invalid project id.'),
    versionId: z.string().uuid('Invalid version id.'),
});

export const createProjectBodySchema = z.object({
    initial_prompt: z
        .string()
        .trim()
        .min(10, 'Prompt must be at least 10 characters.')
        .max(2000, 'Prompt must be 2000 characters or less.'),
});

export const revisionBodySchema = z.object({
    message: z
        .string()
        .trim()
        .min(1, 'Revision message is required.')
        .max(2000, 'Revision message must be 2000 characters or less.'),
});

export const saveProjectCodeBodySchema = z.object({
    code: z
        .string()
        .trim()
        .min(1, 'Code is required.')
        .max(htmlPayloadMaxLength, 'Code payload is too large.'),
});

export const purchaseCreditsBodySchema = z.object({
    planId: z.enum(['basic', 'pro', 'enterprise'], {
        message: 'Plan ID must be basic, pro, or enterprise.',
    }),
});

