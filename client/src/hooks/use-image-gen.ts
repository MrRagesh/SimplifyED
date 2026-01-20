import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useGenerateImage() {
    return useMutation({
        mutationFn: async (prompt: string) => {
            const res = await apiRequest("POST", "/api/generate-image", { prompt });
            const data = await res.json();
            if (!data || !data.url) {
                throw new Error("Failed to generate image");
            }
            return data.url as string;
        }
    });
}
