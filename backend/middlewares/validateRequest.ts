import { NextFunction, Request, Response } from "express";
import { z, ZodType } from "zod";

type RequestSchemas = {
    body?: ZodType;
    params?: ZodType;
}

export const validateRequest = (schemas: RequestSchemas) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (schemas.params) {
            const paramsResult = schemas.params.safeParse(req.params);
            if (!paramsResult.success) {
                return res.status(400).json({
                    message: 'Invalid request parameters.',
                    errors: z.flattenError(paramsResult.error).fieldErrors,
                });
            }
            Object.assign(req.params, paramsResult.data);
        }

        if (schemas.body) {
            const bodyResult = schemas.body.safeParse(req.body);
            if (!bodyResult.success) {
                return res.status(400).json({
                    message: 'Invalid request body.',
                    errors: z.flattenError(bodyResult.error).fieldErrors,
                });
            }
            req.body = bodyResult.data;
        }

        next();
    }
}

