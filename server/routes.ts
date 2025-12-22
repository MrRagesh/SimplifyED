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
      Generate exactly 5 multiple choice questions. 
      Return ONLY a valid JSON array, no markdown, no extra text:
      [
        {
          "question": "Question text?",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": "option1"
        }
      ]
      Ensure each question has exactly 4 options. The correctAnswer must be exactly one of the options.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 2048,
      });

      let content = response.choices[0]?.message?.content || "[]";
      
      // Clean up response if it has markdown code blocks
      if (content.includes("```json")) {
        content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      } else if (content.includes("```")) {
        content = content.replace(/```\n?/g, "").trim();
      }

      let questionsData = JSON.parse(content);
      
      // Ensure it's an array
      if (!Array.isArray(questionsData)) {
        questionsData = [];
      }

      if (questionsData.length === 0) {
        return res.status(500).json({ error: "Failed to generate valid quiz questions" });
      }

      // Save quiz to database
      const [quiz] = await db
        .insert(quizzes)
        .values({ topic, difficulty })
        .returning();

      // Save questions with validation
      const savedQuestions = [];
      for (const q of questionsData) {
        if (q.question && Array.isArray(q.options) && q.correctAnswer) {
          const [savedQ] = await db
            .insert(quizQuestions)
            .values({
              quizId: quiz.id,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
            })
            .returning();
          savedQuestions.push(savedQ);
        }
      }

      res.status(201).json({ ...quiz, questions: savedQuestions });
    } catch (err) {
      console.error("Quiz generation error:", err);
      res.status(500).json({ error: "Failed to generate quiz. Please try again." });
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

      // Fetch quiz details for congratulations message
      const [quizData] = await db.select().from(quizzes).where(eq(quizzes.id, id));
      
      if (!quizData) {
        return res.status(404).json({ error: "Quiz not found" });
      }

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

      const percentage = Math.round((score / questions.length) * 100);

      // Update quiz score
      await db
        .update(quizzes)
        .set({ score })
        .where(eq(quizzes.id, id));

      // Generate personalized congratulations message
      let congratulations = "";
      if (percentage === 100) {
        congratulations = `🎉 Perfect Score! You've mastered "${quizData.topic}" at ${quizData.difficulty} level! Outstanding work!`;
      } else if (percentage >= 80) {
        congratulations = `🌟 Excellent! You scored ${percentage}% on "${quizData.topic}". You have a strong grasp of this topic!`;
      } else if (percentage >= 60) {
        congratulations = `👍 Good job! You scored ${percentage}% on "${quizData.topic}". Review the incorrect answers and try again!`;
      } else if (percentage >= 40) {
        congratulations = `💪 Keep practicing! You scored ${percentage}% on "${quizData.topic}". Review the concepts and attempt again!`;
      } else {
        congratulations = `📚 Don't worry! You scored ${percentage}% on "${quizData.topic}". Let's learn more about this topic!`;
      }

      res.json({
        score,
        total: questions.length,
        percentage,
        congratulations,
        topic: quizData.topic,
        difficulty: quizData.difficulty,
        results,
      });
    } catch (err) {
      console.error("Error submitting quiz:", err);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  return httpServer;
}
