import express from "express";

import { deleteAccount } from "../controllers/accountController.js";

const router = express.Router();

router.delete("/", deleteAccount);

export default router;

