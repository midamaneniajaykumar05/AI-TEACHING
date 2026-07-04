import { Router } from "express";
import { db } from "@workspace/db";
import { quizResultsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

// GET /quiz-results
router.get("/", async (req, res) => {
  try {
    const results = await db
      .select()
      .from(quizResultsTable)
      .orderBy(desc(quizResultsTable.createdAt))
      .limit(50);
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Failed to list quiz results");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /quiz-results
router.post("/", async (req, res) => {
  try {
    const { topic, score, totalQuestions } = req.body;
    if (!topic || score == null || totalQuestions == null) {
      res.status(400).json({ error: "topic, score, totalQuestions are required" });
      return;
    }
    const [result] = await db
      .insert(quizResultsTable)
      .values({ topic, score, totalQuestions })
      .returning();
    res.status(201).json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to record quiz result");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
