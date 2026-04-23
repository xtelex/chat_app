import express from "express";

import { requireAuth } from "../middleware/authMiddleware.js";
import { getDirectMessages, postDirectMessage, markMessagesAsRead } from "../controllers/directMessageController.js";

const router = express.Router();

router.get("/:contactId", requireAuth, getDirectMessages);
router.post("/:contactId", requireAuth, postDirectMessage);
router.patch("/:contactId/read", requireAuth, markMessagesAsRead);

export default router;

