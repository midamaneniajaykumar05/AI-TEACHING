import OpenAI from "openai";

// Support both Replit AI Integrations env vars and a direct OPENAI_API_KEY
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1";

if (!apiKey) {
  // Don't throw at module load time — routes will check and return a friendly error
  console.warn("Warning: No OpenAI API key found. Set OPENAI_API_KEY in Replit Secrets.");
}

export const openai = new OpenAI({
  apiKey: apiKey || "not-configured",
  baseURL,
});

export const isConfigured = () => !!apiKey;
