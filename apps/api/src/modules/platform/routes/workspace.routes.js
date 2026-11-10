import express from "express";
const router = express.Router();
import { listWorkspaces, createWorkspace, getWorkspace, updateWorkspace, deleteWorkspace } from "../controllers/workspace.controller.js";
import authMiddleware from "../../../middleware/auth.middleware.js";

router.use(authMiddleware);

// List workspaces for user
router.get('/', listWorkspaces);
// Create workspace
router.post('/', createWorkspace);
// Get workspace by ID
router.get('/:id', getWorkspace);
// Update workspace
router.put('/:id', updateWorkspace);
// Delete workspace
router.delete('/:id', deleteWorkspace);

export default router;
