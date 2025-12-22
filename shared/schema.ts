import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth and Chat models
export * from "./models/auth";
export * from "./models/chat";

// Import them for relations
import { users } from "./models/auth";
import { conversations } from "./models/chat";

// Quizzes Table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id), // Auth uses varchar/string for ID
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(), // 'Beginner', 'Intermediate', 'Advanced'
  score: integer("score"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => quizzes.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of strings
  correctAnswer: text("correct_answer").notNull(),
  userAnswer: text("user_answer"),
  isCorrect: boolean("is_correct"),
});

// Schemas
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true });
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ id: true });

// Types
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;

// Relations
export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  user: one(users, {
    fields: [quizzes.userId],
    references: [users.id],
  }),
  questions: many(quizQuestions),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one }) => ({
  // We might want to link conversations to users if we extend the chat model
  // But the default chat model doesn't have userId. We can add it if we want persistent history per user.
  // For MVP, we can keep it simple or assume the integration handles it (it doesn't by default).
  // We'll stick to the provided model for now to avoid breaking the integration code.
}));
