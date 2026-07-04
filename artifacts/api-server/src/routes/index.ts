import { Router, type IRouter } from "express";
import healthRouter from "./health";
import conversationsRouter from "./conversations";
import progressRouter from "./progress";
import quizResultsRouter from "./quiz-results";
import { isConfigured } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/conversations", conversationsRouter);
router.use("/progress", progressRouter);
router.use("/quiz-results", quizResultsRouter);

// AI status check
router.get("/ai-status", (_req, res) => {
  const configured = isConfigured();
  res.json({
    configured,
    message: configured
      ? "OpenAI API is configured and ready."
      : "OpenAI API key is not configured. Add OPENAI_API_KEY to Replit Secrets to enable TeacherGPT.",
  });
});

export default router;
