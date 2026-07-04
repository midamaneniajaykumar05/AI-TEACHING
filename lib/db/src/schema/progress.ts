import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const topicProgressTable = pgTable("topic_progress", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull().unique(),
  mastery: integer("mastery").notNull().default(0), // 0-100
  status: text("status").notNull().default("not_started"), // "not_started" | "in_progress" | "mastered"
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  quizzesTaken: integer("quizzes_taken").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizResultsTable = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTopicProgressSchema = createInsertSchema(topicProgressTable).omit({ id: true, updatedAt: true });
export type InsertTopicProgress = z.infer<typeof insertTopicProgressSchema>;
export type TopicProgress = typeof topicProgressTable.$inferSelect;

export const insertQuizResultSchema = createInsertSchema(quizResultsTable).omit({ id: true, createdAt: true });
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResultsTable.$inferSelect;
