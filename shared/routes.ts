import { z } from 'zod';
import { insertQuizSchema, quizzes, quizQuestions } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  simplify: {
    start: {
      method: 'POST' as const,
      path: '/api/simplify/start',
      input: z.object({
        topic: z.string().optional(), // If provided, starts directly with topic
        level: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Beginner'),
      }),
      responses: {
        201: z.object({ conversationId: z.number() }), // Returns the ID of the created conversation
      },
    },
  },
  quizzes: {
    list: {
      method: 'GET' as const,
      path: '/api/quizzes',
      responses: {
        200: z.array(z.custom<typeof quizzes.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/quizzes',
      input: z.object({
        topic: z.string(),
        difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
      }),
      responses: {
        201: z.custom<typeof quizzes.$inferSelect>(),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/quizzes/:id',
      responses: {
        200: z.custom<typeof quizzes.$inferSelect & { questions: typeof quizQuestions.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
