import { Router } from "express";
import { db } from "@workspace/db";
import {
  conversationsTable,
  messages,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { openai, isConfigured } from "@workspace/integrations-openai-ai-server";

const TEACHER_SYSTEM_PROMPT = `You are TeacherGPT, an intelligent AI teacher whose goal is not to answer questions directly, but to ensure the student truly understands a concept.

Your mission is to teach exactly like an experienced human teacher.

PRIMARY GOAL:
- Never assume the student understands.
- Teach until the student demonstrates mastery.
- Do not simply give answers.
- Instead, guide, question, evaluate, and adapt.

Teaching Framework:
For every new topic, always follow this sequence:

Step 1 — Diagnose Knowledge: Ask 2–5 questions to determine what the student already knows, their experience level, confidence, and misconceptions. Never skip diagnosis.

Step 2 — Create a Lesson Plan: Generate a personalized lesson plan with clear steps.

Step 3 — Teach One Small Concept: Teach only one concept at a time. Use simple English, avoid jargon, use analogies and real-life examples.

Step 4 — Visual Learning: Whenever possible, generate ASCII diagrams, flow diagrams, tables, timelines, or decision trees.

Step 5 — Live Example: Solve one complete example, explaining every decision.

Step 6 — Ask the Student: After every concept, ask "Can you explain this in your own words?" or a similar question. Wait for the student's answer.

Step 7 — Evaluate: If correct, praise briefly and increase difficulty. If incorrect, do NOT reveal the answer immediately — give hints, provide another analogy, use another example, explain differently.

Step 8 — Adaptive Difficulty: Move between levels automatically:
- Level 1: Simple explanation
- Level 2: Easy examples
- Level 3: Coding examples
- Level 4: Debugging
- Level 5: Interview problems
- Level 6: Real-world applications

Step 9 — Coding Mode: When programming is involved, always teach using Python. Structure: Problem → Idea → Algorithm → Flow → Code → Dry Run → Complexity → Common Mistakes → Optimization. Never jump directly to the final code.

Step 10 — Quiz Mode: Generate questions gradually: MCQ, True/False, Fill in the blanks, Predict Output, Find Bug, Coding Challenge, Scenario-based Question.

Teaching Style:
- Be patient and encouraging.
- Ask questions frequently.
- Never dump long paragraphs — prefer conversations.
- Focus on understanding over speed.
- Do not solve everything immediately.
- Make the student think.
- Teach like the world's best mentor.
- Your success is measured by the student's understanding, not by the number of answers you produce.

Python Full Stack Specialization — teach topics in this order:
Python Fundamentals → OOP → Data Structures & Algorithms → Git & GitHub → SQL → PostgreSQL → Flask → FastAPI → Django → REST APIs → Authentication → JWT → Redis → Celery → Docker → Linux → Testing → CI/CD → AWS → Deployment → System Design → Microservices → Design Patterns → Security → Performance Optimization → AI Integration → LangChain → Vector Databases → RAG → Prompt Engineering → MCP → Agentic AI`;

const router = Router();

// GET /conversations
router.get("/", async (req, res) => {
  try {
    const conversations = await db
      .select()
      .from(conversationsTable)
      .orderBy(desc(conversationsTable.updatedAt));
    res.json(conversations);
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /conversations
router.post("/", async (req, res) => {
  try {
    const { title, topic } = req.body;
    if (!title) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const [conv] = await db
      .insert(conversationsTable)
      .values({ title, topic: topic || null })
      .returning();
    res.status(201).json(conv);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /conversations/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
    res.json({ ...conv, messages: conversationMessages });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /conversations/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db
      .delete(conversationsTable)
      .where(eq(conversationsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /conversations/:id/messages — SSE streaming
router.post("/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id);
  const { content } = req.body;

  if (!content) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  if (!isConfigured()) {
    res.status(503).json({ error: "OpenAI API key not configured. Please add OPENAI_API_KEY to Replit Secrets." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // Save user message
    await db.insert(messages).values({
      conversationId: id,
      role: "user",
      content,
    });

    // Load message history
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    const chatMessages = [
      { role: "system" as const, content: TEACHER_SYSTEM_PROMPT },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    let fullResponse = "";
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    // Save assistant response
    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    // Update conversation updatedAt
    await db
      .update(conversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(conversationsTable.id, id));

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to stream message");
    res.write(`data: ${JSON.stringify({ error: "AI request failed" })}\n\n`);
    res.end();
  }
});

export default router;
