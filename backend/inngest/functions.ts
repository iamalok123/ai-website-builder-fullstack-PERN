import { inngest, INNGEST_EVENTS } from "../lib/inngest.js";
import { runGenerationJob } from "../services/generationService.js";

export const processWebsiteGeneration = inngest.createFunction(
    {
        id: "process-website-generation",
        triggers: [{ event: INNGEST_EVENTS.websiteGenerationRequested }]
    },
    async ({ event, step }) => {
        const jobId = event.data.jobId as string;

        return step.run("run-generation-job", async () => {
            return runGenerationJob(jobId);
        });
    }
);

export const inngestFunctions = [processWebsiteGeneration];
