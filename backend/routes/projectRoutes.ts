import express from "express";
import { protect } from "../middlewares/auth.js";
import { makeRevision, saveProjectCode, rollbackToVersion, deleteProject, getProjectPreview, getPublishedProjects, getProjectById } from "../controllers/ProjectController.js";


const projectRoutes = express.Router();

projectRoutes.post('/revision/:projectId', protect, makeRevision);
projectRoutes.put('/save/:projectId', protect, saveProjectCode);
projectRoutes.get('/rollback/:projectId/:versionId', protect, rollbackToVersion);
projectRoutes.delete('/:projectId', protect, deleteProject);
projectRoutes.get('/preview/:projectId', protect, getProjectPreview);
projectRoutes.get('/published', getPublishedProjects);
projectRoutes.get('/published/:projectId', getProjectById);


export default projectRoutes;