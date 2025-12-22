import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Conversation, type Message } from "@shared/models/chat";

// === GET ALL CONVERSATIONS ===
export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return await res.json();
    },
  });
}

// === GET SINGLE CONVERSATION ===
export function useConversation(id: number) {
  return useQuery<Conversation & { messages: Message[] }>({
    queryKey: [`/api/conversations/${id}`],
    enabled: !!id && !isNaN(id),
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${id}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Conversation not found");
        throw new Error("Failed to fetch conversation");
      }
      return await res.json();
    },
  });
}

// === DELETE CONVERSATION ===
export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete conversation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}
