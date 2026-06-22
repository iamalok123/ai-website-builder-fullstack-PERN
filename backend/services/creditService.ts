/**
It acts like a bank ledger for user credits. 
If credits are modified, it must be recorded precisely so users are never double-charged and balance figures remain accurate.

What it does:
- debitCredits: Deducts credits when a user starts generating or revising a website. 
If the user doesn't have enough, it throws an InsufficientCreditsError.

- refundCredits: Restores credits if an AI generation attempt fails or times out.

- recordCreditPurchase: Adds credits to the account when Stripe notifies the server of a successful purchase.

* Every operation runs inside a database transaction (tx). 
Once it updates the user's credit balance, 
it creates a receipt row in the CreditLedger table storing the type (debit, refund, or purchase), 
the amount, and the reason.
*/

import { Prisma } from "../generated/prisma/client.js";

/*
Normally, you query the database using the global prisma client (e.g., prisma.user.findUnique()).

However, inside a transaction block, you must not use the global prisma client. 
You must use the special temporary client provided by Prisma (traditionally named tx).

The type of this special client is Prisma.TransactionClient.
It has all the same methods as prisma (like .update(), .create()), 
but it guarantees that all database queries run inside that same transaction block.
*/

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
