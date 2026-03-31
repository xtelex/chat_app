import express from "express";

import { getMessages, postMessage } from "../controllers/messageController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, getMessages);
router.post("/", requireAuth, postMessage);

export default router;

