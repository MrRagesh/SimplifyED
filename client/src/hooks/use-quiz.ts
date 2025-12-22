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

interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  congratulations: string;
  topic: string;
  difficulty: string;
  results: Array<{
    questionId: number;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

export function useCreateQuiz() {
  return useMutation({
    mutationFn: async (data: { topic: string; difficulty: string }) => {
      const response = await apiRequest("/api/quizzes", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response || !response.id) {
        throw new Error("Failed to create quiz - invalid response");
      }
      return response as Quiz;
    },
    onError: (error) => {
      console.error("Create quiz error:", error);
    },
  });
}

export function useQuiz(quizId: number) {
  return useQuery<Quiz>({
    queryKey: ["/api/quizzes", quizId],
    queryFn: async () => {
      const response = await apiRequest(`/api/quizzes/${quizId}`);
      if (!response) {
        throw new Error("Failed to fetch quiz");
      }
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
      if (!response) {
        throw new Error("Failed to submit quiz");
      }
      return response as QuizResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
    },
  });
}
