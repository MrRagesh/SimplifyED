import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Quiz {
  id: number;
  topic: string;
  difficulty: string;
  score?: number;
  questions?: QuizQuestion[];
}

interface QuizQuestion {
  id: number;
  quizId: number;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export function useCreateQuiz() {
  return useMutation({
    mutationFn: async (data: { topic: string; difficulty: string }) => {
      const response = await apiRequest("/api/quizzes", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response as Quiz;
    },
  });
}

export function useQuiz(quizId: number) {
  return useQuery<Quiz>({
    queryKey: ["/api/quizzes", quizId],
    queryFn: async () => {
      const response = await apiRequest(`/api/quizzes/${quizId}`);
      return response as Quiz;
    },
    enabled: !!quizId,
  });
}

export function useSubmitQuiz() {
  return useMutation({
    mutationFn: async (data: { quizId: number; answers: Record<number, string> }) => {
      const response = await apiRequest(`/api/quizzes/${data.quizId}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: data.answers }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
    },
  });
}
