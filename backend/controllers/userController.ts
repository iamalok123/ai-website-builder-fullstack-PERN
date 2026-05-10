import dotenv from 'dotenv';
dotenv.config();
import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { InsufficientCreditsError } from "../services/creditService.js";
import { createProjectWithGenerationJob } from "../services/projectService.js";
import { createCreditCheckoutSession, getCreditPlan } from "../services/paymentService.js";


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




// Controller function to create a new project
export const createNewProject = async (req: Request, res: Response) => { // createUserProject
    const userId = req.userId;
    try {
        const { initial_prompt } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        const project = await createProjectWithGenerationJob(userId, initial_prompt);
        console.log('✅ createNewProject queued - projectId:', project.projectId);
        return res.status(202).json({ projectId: project.projectId, jobId: project.jobId, generationStatus: 'queued' });

    } catch (error: any) {
        if (error instanceof InsufficientCreditsError) {
            return res.status(403).json({ message: 'Add credits to create more projects.' });
        }

        console.error(error);
        return res.status(500).json({ message: error.message });
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
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized User.' });
        }

        const { planId } = req.body as { planId: string };

        if (!planId) {
            return res.status(400).json({ message: 'Plan ID is required.' });
        }

        const origin = req.headers.origin as string;

        const plan = getCreditPlan(planId);

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

        const session = await createCreditCheckoutSession({
            origin,
            transactionId: transaction.id,
            credits: plan.credits,
            amount: transaction.amount,
        });

        console.log('✅ purchaseCredits completed - session:', session.url);
        return res.status(200).json({ payment_link: session.url });
    } catch (error: any) {
        console.error(error.code || error.message);
        return res.status(500).json({ message: error.message });
    }
}


