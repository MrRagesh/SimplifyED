import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, chatStorage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { db } from "./db";
import { quizzes, quizQuestions } from "@shared/schema";
import { eq } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SIMPLIFY_SYSTEM_PROMPT = `
You are SimplifyED, an AI-powered adaptive concept explainer.
Your goal is to explain concepts clearly, simply, and adaptively based on the user's level.

Follow these rules:
1.  **Assess Level**: If the user doesn't specify, assume Beginner or ask.
    *   **Beginner**: Simple language, everyday analogies, no jargon.
    *   **Intermediate**: Technical accuracy, formula introduction, standard examples.
    *   **Advanced**: Detailed derivations, edge cases, research context.
2.  **Visual Aids**: ALWAYS include ASCII diagrams or clear step-by-step flows for processes.
3.  **Real-World Examples**: Use concrete examples from everyday life (sports, cooking, nature, etc.)
4.  **Analogies**: Always use relatable real-world analogies to explain abstract concepts.
5.  **Misconceptions**: Actively identify and gently correct common misconceptions.
6.  **Follow-up**: Encourage questions and offer quiz opportunities.

Example Format:
**Topic**: [Topic Name]
**Level**: [Level]
**Explanation**: [Explanation text]
**Real-World Example**: [Concrete example from everyday life]
**Analogy**: [Real world comparison]
**Visual**:
\`\`\`
[ASCII Art or Diagram]
\`\`\`
`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Setup Chat & Image Integrations
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Custom Route: Start SimplifyED Session
  app.post(api.simplify.start.path, async (req, res) => {
    try {
      const { topic, level } = api.simplify.start.input.parse(req.body);
      
      const title = topic ? `Explain: ${topic}` : "New Session";
      const conversation = await chatStorage.createConversation(title);

      // Inject System Prompt
      await chatStorage.createMessage(conversation.id, "system", SIMPLIFY_SYSTEM_PROMPT);

      // If topic provided, inject user prompt
      if (topic) {
        const userPrompt = `Explain "${topic}" at a ${level} level. Include real-world examples, ASCII diagrams, and an analogy to help me understand.`;
        await chatStorage.createMessage(conversation.id, "user", userPrompt);
      }

      res.status(201).json({ conversationId: conversation.id });
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Quiz Endpoints
  app.post("/api/quizzes", async (req, res) => {
    try {
      const { topic, difficulty } = req.body;
      
      if (!topic || !difficulty) {
        return res.status(400).json({ error: "Topic and difficulty required" });
      }

      // Generate quiz questions using AI
      const prompt = `Create a ${difficulty} level quiz about "${topic}". 
      Generate 5 multiple choice questions. 
      Return as JSON array with this format:
      [
        {
          "question": "Question text?",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": "option1"
        }
      ]
      Only return the JSON array, no other text.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content || "[]";
      const questionsData = JSON.parse(content);

      // Save quiz to database
      const [quiz] = await db
        .insert(quizzes)
        .values({ topic, difficulty })
        .returning();

      // Save questions
      for (const q of questionsData) {
        await db.insert(quizQuestions).values({
          quizId: quiz.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
        });
      }

      // Fetch the complete quiz with questions
      const completeQuiz = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.id, quiz.id));

      const questions = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, quiz.id));

      res.status(201).json({ ...completeQuiz[0], questions });
    } catch (err) {
      console.error("Quiz generation error:", err);
      res.status(500).json({ error: "Failed to generate quiz" });
    }
  });

  // Get quiz with questions
  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quiz = await db.select().from(quizzes).where(eq(quizzes.id, id));
      
      if (!quiz.length) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const questions = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, id));

      res.json({ ...quiz[0], questions });
    } catch (err) {
      console.error("Error fetching quiz:", err);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  // Submit quiz answers
  app.post("/api/quizzes/:id/submit", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { answers } = req.body; // answers: { [questionId]: userAnswer }

      const questions = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, id));

      let score = 0;
      const results = [];

      for (const q of questions) {
        const userAnswer = answers[q.id];
        const isCorrect = userAnswer === q.correctAnswer;
        if (isCorrect) score++;

        // Update question with user answer
        await db
          .update(quizQuestions)
          .set({ userAnswer, isCorrect })
          .where(eq(quizQuestions.id, q.id));

        results.push({
          questionId: q.id,
          question: q.question,
          userAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect,
        });
      }

      // Update quiz score
      await db
        .update(quizzes)
        .set({ score })
        .where(eq(quizzes.id, id));

      res.json({
        score,
        total: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        results,
      });
    } catch (err) {
      console.error("Error submitting quiz:", err);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  return httpServer;
}
