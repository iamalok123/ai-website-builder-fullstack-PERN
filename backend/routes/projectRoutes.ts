import express from "express";
import { protect } from "../middlewares/auth.js";
import { makeRevision, saveProjectCode, rollbackToVersion, deleteProject, getProjectPreview, getPublishedProjects, getProjectById } from "../controllers/ProjectController.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { aiGenerationRateLimit, projectMutationRateLimit, publicReadRateLimit } from "../middlewares/rateLimit.js";
import { projectIdParamSchema, revisionBodySchema, rollbackParamSchema, saveProjectCodeBodySchema } from "../lib/validationSchemas.js";


const projectRoutes = express.Router();

projectRoutes.post('/revision/:projectId', protect, aiGenerationRateLimit, validateRequest({ params: projectIdParamSchema, body: revisionBodySchema }), makeRevision);
projectRoutes.put('/save/:projectId', protect, projectMutationRateLimit, validateRequest({ params: projectIdParamSchema, body: saveProjectCodeBodySchema }), saveProjectCode);
projectRoutes.get('/rollback/:projectId/:versionId', protect, projectMutationRateLimit, validateRequest({ params: rollbackParamSchema }), rollbackToVersion);
projectRoutes.delete('/:projectId', protect, projectMutationRateLimit, validateRequest({ params: projectIdParamSchema }), deleteProject);
projectRoutes.get('/preview/:projectId', protect, validateRequest({ params: projectIdParamSchema }), getProjectPreview);
projectRoutes.get('/published', publicReadRateLimit, getPublishedProjects);
projectRoutes.get('/published/:projectId', publicReadRateLimit, validateRequest({ params: projectIdParamSchema }), getProjectById);


export default projectRoutes;
