import express from "express";
import { createNewProject, getUserCredits, getUserProject, getUserProjects, purchaseCredits, togglePublish } from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { aiGenerationRateLimit, paymentRateLimit, projectMutationRateLimit } from "../middlewares/rateLimit.js";
import { createProjectBodySchema, projectIdParamSchema, purchaseCreditsBodySchema } from "../lib/validationSchemas.js";

const userRouter = express.Router();

userRouter.get('/credits', protect, getUserCredits);
userRouter.post('/project', protect, aiGenerationRateLimit, validateRequest({ body: createProjectBodySchema }), createNewProject);
userRouter.get('/project/:projectId', protect, validateRequest({ params: projectIdParamSchema }), getUserProject);
userRouter.get('/projects', protect, getUserProjects);
userRouter.get('/publish-toggle/:projectId', protect, projectMutationRateLimit, validateRequest({ params: projectIdParamSchema }), togglePublish);
userRouter.post('/purchase-credits', protect, paymentRateLimit, validateRequest({ body: purchaseCreditsBodySchema }), purchaseCredits);


export default userRouter;
