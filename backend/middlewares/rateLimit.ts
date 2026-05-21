import { NextFunction, Request, Response } from "express";

type Bucket = {
    count: number;
    resetAt: number;
}

type RateLimitOptions = {
    name: string;
    windowMs: number;
    max: number;
    message?: string;
}

const buckets = new Map<string, Bucket>();

const getClientKey = (req: Request) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor?.split(',')[0]?.trim();

    return req.userId || forwardedIp || req.ip || req.socket.remoteAddress || 'unknown';
}

const sweepExpiredBuckets = (now: number) => {
    for (const [key, bucket] of buckets.entries()) {
        if (bucket.resetAt <= now) {
            buckets.delete(key);
        }
    }
}

export const createRateLimit = ({ name, windowMs, max, message }: RateLimitOptions) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const now = Date.now();
        const key = `${name}:${getClientKey(req)}`;
        const existingBucket = buckets.get(key);
        const bucket = existingBucket && existingBucket.resetAt > now
            ? existingBucket
            : { count: 0, resetAt: now + windowMs };

        bucket.count += 1;
        buckets.set(key, bucket);

        const remaining = Math.max(max - bucket.count, 0);
        const retryAfterSeconds = Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1);

        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(remaining));
        res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

        if (Math.random() < 0.01) {
            sweepExpiredBuckets(now);
        }

        if (bucket.count > max) {
            res.setHeader('Retry-After', String(retryAfterSeconds));
            return res.status(429).json({
                message: message || 'Too many requests. Please try again later.',
            });
        }

        next();
    }
}

const authMutationRateLimit = createRateLimit({
    name: 'auth',
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many authentication attempts. Please try again later.',
});

const authSessionReadRateLimit = createRateLimit({
    name: 'auth-session-read',
    windowMs: 60 * 1000,
    max: 180,
    message: 'Too many session checks. Please try again later.',
});

const authSocialSignInRateLimit = createRateLimit({
    name: 'auth-social-sign-in',
    windowMs: 5 * 60 * 1000,
    max: 30,
    message: 'Too many sign-in attempts. Please try again later.',
});

const getAuthPath = (req: Request) => (req.path.replace(/\/+$/, '') || '/');

export const authRateLimit = (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
        return next();
    }

    const path = getAuthPath(req);

    if (req.method === 'GET' && path === '/get-session') {
        return authSessionReadRateLimit(req, res, next);
    }

    if (req.method === 'POST' && path === '/sign-in/social') {
        return authSocialSignInRateLimit(req, res, next);
    }

    return authMutationRateLimit(req, res, next);
}

export const aiGenerationRateLimit = createRateLimit({
    name: 'ai-generation',
    windowMs: 60 * 60 * 1000,
    max: 8,
    message: 'Too many AI generation requests. Please wait before trying again.',
});

export const paymentRateLimit = createRateLimit({
    name: 'payment',
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many payment attempts. Please try again later.',
});

export const projectMutationRateLimit = createRateLimit({
    name: 'project-mutation',
    windowMs: 15 * 60 * 1000,
    max: 60,
});

export const publicReadRateLimit = createRateLimit({
    name: 'public-read',
    windowMs: 60 * 1000,
    max: 120,
});

