import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL || process.env.FRONTEND_URL || "",
    "X-Title": "AI Website Builder",
  },
});

export default openai;
