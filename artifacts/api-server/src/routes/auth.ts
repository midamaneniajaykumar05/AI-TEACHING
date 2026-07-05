import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signJwt } from "../lib/auth.js";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod/v4";

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const { username, email, password } = parsed.data;

  // Check uniqueness
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const usernameExists = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (usernameExists.length > 0) {
    res.status(409).json({ error: "Username is already taken" });
    return;
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(usersTable)
    .values({ username, email: email.toLowerCase(), passwordHash })
    .returning({ id: usersTable.id, username: usersTable.username, email: usersTable.email });

  if (!user) {
    res.status(500).json({ error: "Failed to create account" });
    return;
  }

  const token = signJwt({ sub: user.id, username: user.username });

  res.status(201).json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signJwt({ sub: user.id, username: user.username });

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

// GET /api/auth/me — returns current user info
router.get("/me", requireAuth, (req, res) => {
  res.json({ id: req.user!.sub, username: req.user!.username });
});

export default router;
