import express from"express";
const router = express.Router();
import { listMembers, addMember, updateMember, removeMember } from "../controllers/member.controller.js";
import authMiddleware from "../../../middleware/auth.middleware.js";

router.use(authMiddleware);

// List members in workspace
router.get('/', listMembers);
// Add member
router.post('/', addMember);
// Update member role
router.put('/:id', updateMember);
// Remove member
router.delete('/:id', removeMember);

export default router;
