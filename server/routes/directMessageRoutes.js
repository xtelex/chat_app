import express from "express";

import { requireAuth } from "../middleware/authMiddleware.js";
import { getDirectMessages, postDirectMessage } from "../controllers/directMessageController.js";

const router = express.Router();

router.get("/:contactId", requireAuth, getDirectMessages);
router.post("/:contactId", requireAuth, postDirectMessage);

export default router;

