import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useLocation } from "wouter";

// Specific hook for starting a new learning session
export function useStartSimplification() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: { topic?: string; level: "Beginner" | "Intermediate" | "Advanced" }) => {
      const res = await fetch(api.simplify.start.path, {
        method: api.simplify.start.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to start session");
      }

      // We expect { conversationId: number }
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidate conversations list so it shows up in dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      // Redirect to the chat
      setLocation(`/chat/${data.conversationId}`);
    },
  });
}
