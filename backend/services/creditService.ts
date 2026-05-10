import { Prisma } from "../generated/prisma/client.js";

type Tx = Prisma.TransactionClient;

type CreditLedgerInput = {
    userId: string;
    amount: number;
    reason: string;
    projectId?: string;
    transactionId?: string;
    jobId?: string;
};

export class InsufficientCreditsError extends Error {
    constructor() {
        super("Add credits to continue.");
        this.name = "InsufficientCreditsError";
    }
}

export const debitCredits = async (tx: Tx, input: CreditLedgerInput) => {
    const user = await tx.user.findUnique({
        where: { id: input.userId },
        select: { credits: true }
    });

    if (!user || user.credits < input.amount) {
        throw new InsufficientCreditsError();
    }

    const updatedUser = await tx.user.update({
        where: { id: input.userId },
        data: {
            credits: {
                decrement: input.amount
            }
        },
        select: { credits: true }
    });

    await tx.creditLedger.create({
        data: {
            type: "debit",
            amount: -input.amount,
            reason: input.reason,
            balanceAfter: updatedUser.credits,
            userId: input.userId,
            projectId: input.projectId,
            transactionId: input.transactionId,
            jobId: input.jobId
        }
    });

    return updatedUser;
};

export const refundCredits = async (tx: Tx, input: CreditLedgerInput) => {
    const updatedUser = await tx.user.update({
        where: { id: input.userId },
        data: {
            credits: {
                increment: input.amount
            }
        },
        select: { credits: true }
    });

    await tx.creditLedger.create({
        data: {
            type: "refund",
            amount: input.amount,
            reason: input.reason,
            balanceAfter: updatedUser.credits,
            userId: input.userId,
            projectId: input.projectId,
            transactionId: input.transactionId,
            jobId: input.jobId
        }
    });

    return updatedUser;
};

export const recordCreditPurchase = async (tx: Tx, input: CreditLedgerInput) => {
    const updatedUser = await tx.user.update({
        where: { id: input.userId },
        data: {
            credits: {
                increment: input.amount
            }
        },
        select: { credits: true }
    });

    await tx.creditLedger.create({
        data: {
            type: "purchase",
            amount: input.amount,
            reason: input.reason,
            balanceAfter: updatedUser.credits,
            userId: input.userId,
            projectId: input.projectId,
            transactionId: input.transactionId,
            jobId: input.jobId
        }
    });

    return updatedUser;
};
