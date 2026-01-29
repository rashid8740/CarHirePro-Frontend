import app from '../app.js';

// Vercel serverless function entry point.
// The Express `app` is a valid request handler (req, res) => void,
// so we can export it directly as the default handler.
export default app;

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();

/* Middleware */
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);

/* MongoDB */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

/* Test Route */
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "API is running" });
});

export default app;

/* ❌ DO NOT use app.listen() */
