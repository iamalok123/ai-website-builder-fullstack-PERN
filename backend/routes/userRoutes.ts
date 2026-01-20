import express from "express";
import { createNewProject, getUserCredits, getUserProject, getUserProjects, purchaseCredits, togglePublish } from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.get('/credits', protect, getUserCredits);
userRouter.post('/project', protect, createNewProject);
userRouter.get('/project/:projectId', protect, getUserProject);
userRouter.get('/projects', protect, getUserProjects);
userRouter.get('/publish-toggle/:projectId', protect, togglePublish);
userRouter.post('/purchase-credits', protect, purchaseCredits);


export default userRouter;