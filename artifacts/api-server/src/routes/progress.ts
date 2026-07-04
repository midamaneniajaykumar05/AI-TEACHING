import { Router } from "express";
import { db } from "@workspace/db";
import { topicProgressTable, quizResultsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();

// GET /progress — overview
router.get("/", async (req, res) => {
  try {
    const topics = await db.select().from(topicProgressTable);
    const quizzes = await db.select().from(quizResultsTable);

    const mastered = topics.filter((t) => t.mastery >= 80).length;
    const avg =
      topics.length > 0
        ? Math.round(topics.reduce((s, t) => s + t.mastery, 0) / topics.length)
        : 0;
    const totalLessons = topics.reduce((s, t) => s + t.lessonsCompleted, 0);
    const recent = [...topics]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);

    res.json({
      totalTopics: topics.length,
      masteredTopics: mastered,
      averageMastery: avg,
      totalLessons,
      totalQuizzes: quizzes.length,
      recentActivity: recent,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get progress overview");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /progress/topics
router.get("/topics", async (req, res) => {
  try {
    const topics = await db
      .select()
      .from(topicProgressTable)
      .orderBy(desc(topicProgressTable.updatedAt));
    res.json(topics);
  } catch (err) {
    req.log.error({ err }, "Failed to list topic progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /progress/topics — upsert
router.post("/topics", async (req, res) => {
  try {
    const { topic, mastery, status, lessonsCompleted, quizzesTaken } = req.body;
    if (!topic) {
      res.status(400).json({ error: "topic is required" });
      return;
    }

    const [existing] = await db
      .select()
      .from(topicProgressTable)
      .where(eq(topicProgressTable.topic, topic));

    if (existing) {
      const [updated] = await db
        .update(topicProgressTable)
        .set({
          mastery: mastery ?? existing.mastery,
          status: status ?? existing.status,
          lessonsCompleted: lessonsCompleted ?? existing.lessonsCompleted,
          quizzesTaken: quizzesTaken ?? existing.quizzesTaken,
          updatedAt: new Date(),
        })
        .where(eq(topicProgressTable.topic, topic))
        .returning();
      res.json(updated);
    } else {
      const [created] = await db
        .insert(topicProgressTable)
        .values({
          topic,
          mastery: mastery ?? 0,
          status: status ?? "in_progress",
          lessonsCompleted: lessonsCompleted ?? 0,
          quizzesTaken: quizzesTaken ?? 0,
        })
        .returning();
      res.json(created);
    }
  } catch (err) {
    req.log.error({ err }, "Failed to upsert topic progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
