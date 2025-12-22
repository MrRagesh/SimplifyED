import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, chatStorage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { api } from "@shared/routes";
import { z } from "zod";

const SIMPLIFY_SYSTEM_PROMPT = `
You are SimplifyED, an AI-powered adaptive concept explainer.
Your goal is to explain concepts clearly, simply, and adaptively based on the user's level.

Follow these rules:
1.  **Assess Level**: If the user doesn't specify, assume Beginner or ask.
    *   **Beginner**: Simple language, everyday analogies, no jargon.
    *   **Intermediate**: Technical accuracy, formula introduction, standard examples.
    *   **Advanced**: Detailed derivations, edge cases, research context.
2.  **Visual Aids**: When explaining processes, use ASCII diagrams or clear step-by-step flows.
3.  **Analogies**: Always use real-world analogies to explain abstract concepts.
4.  **Misconceptions**: Actively identify and correct common misconceptions gently.
5.  **Follow-up**: Encourage questions.

Example Format:
**Topic**: [Topic Name]
**Level**: [Level]
**Explanation**: [Explanation text]
**Analogy**: [Real world analogy]
**Visual**:
[ASCII Art or Diagram]
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
        const userPrompt = `Explain "${topic}" at a ${level} level.`;
        await chatStorage.createMessage(conversation.id, "user", userPrompt);
        // Note: The actual AI response generation happens when the client calls /api/conversations/:id/messages
        // or we could trigger it here, but the chat integration is designed for client-driven turns.
        // We'll let the client see the conversation and then maybe auto-trigger the next step or just show the user message.
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

  return httpServer;
}
