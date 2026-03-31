import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { connectDb } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import directMessageRoutes from "./routes/directMessageRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dm", directMessageRoutes);

const port = process.env.PORT || 3001;

if (process.env.MONGO_URI) {
  await connectDb();
} else {
  // eslint-disable-next-line no-console
  console.warn("MONGO_URI is not set. Skipping MongoDB connection.");
}

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
});
