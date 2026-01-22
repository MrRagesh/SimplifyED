import OpenAI from "openai";

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "not-set",
});

/**
 * Generates a response using OpenRouter (nvidia/nemotron-3-nano-30b-a3b:free).
 */
export async function generateHybridResponse(messages: { role: string; content: string }[]): Promise<string> {
    const lastMessage = messages[messages.length - 1].content;
    const history = messages.slice(0, -1);

    console.log("[OpenRouter] Querying model for:", lastMessage.substring(0, 50) + "...");

    try {
        const stream = await openai.chat.completions.create({
            model: "nvidia/nemotron-3-nano-30b-a3b:free",
            messages: [
                ...history.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
                { role: "user", content: lastMessage }
            ],
            stream: true,
        });

        let response = "";
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                response += content;
            }
        }

        return response;
    } catch (err: any) {
        console.error("[OpenRouter] Error:", err.message);
        return `### AI Error
The OpenRouter AI service encountered an error.

**Error Details:**
> ${err.message}

**Troubleshooting:**
1. Check your internet connection.
2. Verify the OPENROUTER_API_KEY in .env is correct.`;
    }
}

/**
 * Generates a quiz using OpenRouter (nvidia/nemotron-3-nano-30b-a3b:free).
 */
export async function generateHybridQuiz(prompt: string): Promise<string> {
    console.log("[OpenRouter] Generating Quiz...");

    try {
        const response = await openai.chat.completions.create({
            model: "nvidia/nemotron-3-nano-30b-a3b:free",
            messages: [
                { role: "user", content: prompt }
            ],
            stream: false,
        });

        let text = response.choices[0]?.message?.content || "";

        // Clean up markdown code blocks if present
        if (text.includes("```json")) {
            text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        } else if (text.includes("```")) {
            text = text.replace(/```\n?/g, "").trim();
        }

        return text;
    } catch (err: any) {
        console.error("[OpenRouter] Quiz Error:", err.message);
        return "[]";
    }
}
