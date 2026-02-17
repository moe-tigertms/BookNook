import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

import express from "express";
import cors from "cors";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { booksRouter } from "./routes/books.js";
import { checkoutsRouter } from "./routes/checkouts.js";
import { searchRouter } from "./routes/search.js";
import { authRouter } from "./routes/auth.js";
import { aiRouter } from "./routes/ai.js";
import { syncUser } from "./middleware/syncUser.js";
import { requireRole } from "./middleware/requireRole.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use(clerkMiddleware());

// Health check first (no auth) – use this to confirm the BookNook backend is running
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/books", requireAuth(), syncUser, booksRouter);
app.use("/api/checkouts", requireAuth(), syncUser, checkoutsRouter);
app.use("/api/search", requireAuth(), syncUser, searchRouter);
app.use("/api/ai", requireAuth(), syncUser, aiRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${_req.method} ${_req.path}`,
    statusCode: 404,
  });
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
