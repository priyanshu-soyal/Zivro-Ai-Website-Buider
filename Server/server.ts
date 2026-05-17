// ── Imports ───────────────────────────────────────────────────
import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();

import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import cors from "cors";
import userRouter from "./routes/userRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import otpRouter from "./routes/otpRoutes.js";
import openai from "./Config/OpenAI.js";
import prisma from "./lib/prisma.js";

const app = express();

// ── CORS ──────────────────────────────────────────────────────
const trustedOrigins =
  process.env.TRUSTED_ORIGINS?.split(",") || ["http://localhost:5173"];

const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    if (!origin) return callback(null, true);
    if (trustedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// ── Body Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────
// ✅ HEALTH CHECK ROUTE
// Hit this URL after deploy to instantly diagnose what's broken:
// GET https://zivro-backend-0nwx.onrender.com/api/health
// ─────────────────────────────────────────────────────────────
app.get("/api/health", async (req: Request, res: Response) => {
  const results: Record<string, any> = {
    status: "checking",
    timestamp: new Date().toISOString(),
    env: {
      PORT:               !!process.env.PORT,
      DATABASE_URL:       !!process.env.DATABASE_URL,
      AI_API_KEY:         !!process.env.AI_API_KEY,
      BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL:    !!process.env.BETTER_AUTH_URL,
      TRUSTED_ORIGINS:    !!process.env.TRUSTED_ORIGINS,
    },
  };

  // ── Test 1: Database connection ──────────────────────────
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.database = "✅ Connected";
  } catch (e: any) {
    results.database = `❌ FAILED: ${e.message}`;
  }

  // ── Test 2: OpenRouter API key ───────────────────────────
  try {
    const testResponse = await openai.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: "Reply with only the word: OK" }],
      max_tokens: 5,
    });
    const reply = testResponse.choices[0]?.message?.content;
    results.openrouter = `✅ Working — model replied: "${reply}"`;
  } catch (e: any) {
    results.openrouter = `❌ FAILED: ${e.message}`;
  }

  const allGood =
    results.database.startsWith("✅") &&
    results.openrouter.startsWith("✅");

  results.status = allGood ? "✅ healthy" : "❌ unhealthy";

  res.status(allGood ? 200 : 500).json(results);
});

// ── App Routes ────────────────────────────────────────────────
app.use("/api/auth/otp", otpRouter);
// ── Better Auth ───────────────────────────────────────────────
app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use("/api/user", userRouter);
app.use("/api/project", projectRouter);

// ─────────────────────────────────────────────────────────────
// ✅ GLOBAL ERROR HANDLER
// Catches ALL unhandled errors from any route/controller
// These will now appear clearly in Render logs
// ─────────────────────────────────────────────────────────────
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Log full error details to Render logs
  console.error("[GLOBAL ERROR HANDLER]");
  console.error("Route  :", req.method, req.originalUrl);
  console.error("Message:", err.message);
  console.error("Code   :", err.code);
  console.error("Meta   :", JSON.stringify(err.meta));   // Prisma error details
  console.error("Stack  :", err.stack);

  // Don't expose stack trace in production
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Start Server ──────────────────────────────────────────────
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Server running at http://localhost:${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/api/health`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Log which env vars are missing at startup
  const required = [
    "DATABASE_URL",
    "AI_API_KEY",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "TRUSTED_ORIGINS",
  ];
  required.forEach((key) => {
    if (!process.env[key]) {
      console.warn(`⚠️  Missing env var: ${key}`);
    }
  });
});
