import { Inngest } from "inngest";

export const inngest = new Inngest({
    id: "zephyr-ai-website-builder"
});

export const INNGEST_EVENTS = {
    websiteGenerationRequested: "website/generation.requested"
} as const;
