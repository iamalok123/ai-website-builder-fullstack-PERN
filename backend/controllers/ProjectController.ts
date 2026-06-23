import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { sanitizeAndFixHtml, sanitizeForPublicPreview } from "../lib/sanitizeHtml.js";
import { InsufficientCreditsError } from "../services/creditService.js";
import { createRevisionGenerationJob, retryFailedGenerationJob } from "../services/projectService.js";
import { failStaleGenerationForProject } from "../services/generationService.js";



// Controller function to make revision
export const makeRevision = async (req: Request, res: Response) => {
    const userId = req.userId;
    try {
        const projectId = req.params.projectId as string;
        const { message } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        if (!message || message.trim() === "") {
            return res.status(400).json({ message: 'Please enter a valid prompt.' });
        }

        const job = await createRevisionGenerationJob(userId, projectId, message);
        console.log('✅ makeRevision queued - projectId:', projectId, 'jobId:', job.jobId);
        return res.status(202).json({ message: "Revision queued successfully.", jobId: job.jobId, generationStatus: "queued" });

    } catch (error: any) {
        if (error instanceof InsufficientCreditsError) {
            return res.status(403).json({ message: 'Add more credits to make changes.' });
        }

        if (error.message === "Project not found.") {
            return res.status(404).json({ message: error.message });
        }

        if (
            error.message === "Please wait until the first generation is complete before requesting changes." ||
            error.message === "A generation is already in progress for this project."
        ) {
            return res.status(409).json({ message: error.message });
        }

        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}

export const retryGeneration = async (req: Request, res: Response) => {
    const userId = req.userId;

    try {
        const projectId = req.params.projectId as string;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        const job = await retryFailedGenerationJob(userId, projectId);
        console.log('✅ retryGeneration queued - projectId:', projectId, 'jobId:', job.jobId);
        return res.status(202).json({ message: "Generation retry queued successfully.", jobId: job.jobId, generationStatus: "queued" });
    } catch (error: any) {
        if (error instanceof InsufficientCreditsError) {
            return res.status(403).json({ message: 'Add credits to retry generation.' });
        }

        if (error.message === "Project not found.") {
            return res.status(404).json({ message: error.message });
        }

        if (
            error.message === "A generation is already in progress for this project." ||
            error.message === "There is no failed generation to retry." ||
            error.message === "Please wait until the first generation is complete before retrying a revision."
        ) {
            return res.status(409).json({ message: error.message });
        }

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
                generationStatus: true,
                versions: true
            }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        if (project.generationStatus === "queued" || project.generationStatus === "running") {
            return res.status(409).json({ message: 'Please wait until generation is complete before rolling back.' });
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
                current_version_index: versionId,
                currentVersionId: versionId,
                generationStatus: "completed",
                generationError: null
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
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }
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

        await failStaleGenerationForProject(userId, projectId);

        const project = await prisma.websiteProject.findFirst({
            where: {
                id: projectId,
                userId
            },
            select: {
                versions: true,
                current_code: true,
                generationStatus: true,
                generationError: true
            }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        if (project.generationStatus === "queued" || project.generationStatus === "running") {
            return res.status(409).json({
                message: 'Website generation is still in progress. Preview will be available after generation completes.',
                generationStatus: project.generationStatus
            });
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
                isPublished: true,
                generationStatus: "completed"
            },
            select: {
                id: true,
                name: true,
                initial_prompt: true,
                current_code: true,
                createdAt: true,
                user: {
                    select: {
                        name: true
                    }
                }
            }
        })

        console.log('✅ getPublishedProjects completed - found', projects.length, 'published projects');
        return res.status(200).json({
            projects: projects.map((project) => ({
                ...project,
                current_code: project.current_code ? sanitizeForPublicPreview(project.current_code) : '',
            }))
        });

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
                isPublished: true,
                generationStatus: "completed",
            },
            select: {
                current_code: true
            },
        })

        if (!project || !project.current_code) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        console.log('✅ getProjectById completed - projectId:', projectId);
        return res.status(200).json({ code: sanitizeForPublicPreview(project.current_code) });

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

        if (project.generationStatus === "queued" || project.generationStatus === "running") {
            return res.status(409).json({ message: 'Please wait until generation is complete before saving this project.' });
        }

        if (!project.current_code) {
            return res.status(409).json({ message: 'There is no generated website to save yet.' });
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
                    current_version_index: version.id,
                    currentVersionId: version.id,
                    generationStatus: "completed",
                    generationError: null
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
