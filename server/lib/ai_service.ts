import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "not-set",
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "not-set");
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Generates a response by querying both OpenAI and Gemini, then synthesizing the results.
 * This is a non-streaming operation because we need both full responses to synthesize.
 */
export async function generateHybridResponse(messages: { role: string; content: string }[]): Promise<string> {
    const lastMessage = messages[messages.length - 1].content;
    const history = messages.slice(0, -1); // Context, if we want to pass it (Gemini handles history differently)

    console.log("[HybridAI] Querying models...");

    // 1. Query OpenAI
    const openaiPromise = openai.chat.completions.create({
        model: "gpt-4o-mini", // Keeping original model name
        messages: messages as any,
        max_completion_tokens: 1000,
    }).then(res => ({ source: "OpenAI", content: res.choices[0]?.message?.content || "" }))
        .catch(err => ({ source: "OpenAI", content: `Error: ${err.message}` }));

    // 2. Query Gemini
    let geminiPromise;
    try {
        const chatHistory = history.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        const chat = geminiModel.startChat({
            history: chatHistory as any
        });
        geminiPromise = chat.sendMessage(lastMessage)
            .then(res => ({ source: "Gemini", content: res.response.text() }))
            .catch(err => {
                console.error("Gemini Error:", err);
                return { source: "Gemini", content: `Error: ${err.message}` };
            });
    } catch (err: any) {
        geminiPromise = Promise.resolve({ source: "Gemini", content: `Context Error: ${err.message}` });
    }

    // Wait for both
    const results = await Promise.all([openaiPromise, geminiPromise]);
    const openaiRes = results[0];
    const geminiRes = results[1];

    console.log("[HybridAI] Responses received. Synthesizing...");

    // 3. Fallback Logic / Synthesis
    // If one failed, just return the other.
    if (openaiRes.content.startsWith("Error:") && !geminiRes.content.startsWith("Error:")) {
        console.log("[HybridAI] OpenAI failed, returning Gemini response.");
        return geminiRes.content;
    }
    if (geminiRes.content.startsWith("Error:") && !openaiRes.content.startsWith("Error:")) {
        console.log("[HybridAI] Gemini failed, returning OpenAI response.");
        return openaiRes.content;
    }
    if (openaiRes.content.startsWith("Error:") && geminiRes.content.startsWith("Error:")) {
        return "Both AI services failed to respond. Please check your API keys.";
    }

    // Synthesis Prompt
    const synthesisPrompt = `
You are an expert educator and fact-checker. You have received two responses to a user's query: "${lastMessage}".

Response 1 (OpenAI):
${openaiRes.content}

Response 2 (Gemini):
${geminiRes.content}

Task:
Combine these responses into a single, highly accurate, and clean explanation. 
- Eliminate any contradictions by choosing the most factually correct information.
- Use the best analogies and examples from both.
- Maintain the requested "SimplifyED" style (simple, adaptive, visual, examples).
- If one response encountered an error, rely on the other.

Return ONLY the synthesized response.
`;

    try {
        const synthesis = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using OpenAI as the judge
            messages: [{ role: "system", content: "You are a helpful synthesizer." }, { role: "user", content: synthesisPrompt }],
            max_completion_tokens: 2000,
        });
        return synthesis.choices[0]?.message?.content || "Failed to synthesize response.";
    } catch (err) {
        console.error("[HybridAI] OpenAI Synthesis failed, trying Gemini...");
        // Fallback to Gemini for synthesis
        try {
            const geminiRes = await geminiModel.generateContent(synthesisPrompt);
            return geminiRes.response.text();
        } catch (geminiErr) {
            console.error("[HybridAI] Gemini Synthesis failed too.");
            // Fallback to just returning Gemini's original response since OpenAI likely failed first
            if (!geminiRes.content.startsWith("Error:")) return geminiRes.content;
            if (!openaiRes.content.startsWith("Error:")) return openaiRes.content;
            return "Failed to synthesize and both sources had issues.";
        }
    }
}

/**
 * Generates a quiz by querying both models and synthesizing a valid JSON response.
 */
export async function generateHybridQuiz(prompt: string): Promise<string> {
    console.log("[HybridAI] Generating Quiz...");

    // 1. Query OpenAI
    const openaiPromise = openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 2048,
    }).then(res => ({ source: "OpenAI", content: res.choices[0]?.message?.content || "" }))
        .catch(err => ({ source: "OpenAI", content: `Error: ${err.message}` }));

    // 2. Query Gemini
    const geminiPromise = geminiModel.generateContent(prompt)
        .then(res => ({ source: "Gemini", content: res.response.text() }))
        .catch(err => {
            console.error("Gemini Error:", err);
            return { source: "Gemini", content: `Error: ${err.message}` };
        });


    // Wait for both
    const results = await Promise.all([openaiPromise, geminiPromise]);
    const openaiRes = results[0];
    const geminiRes = results[1];

    console.log("[HybridAI] Quiz drafts received. Synthesizing JSON...");

    // Fallback Logic
    if (openaiRes.content.startsWith("Error:") && !geminiRes.content.startsWith("Error:")) {
        return geminiRes.content; // Hope Gemini output valid JSON
    }
    if (geminiRes.content.startsWith("Error:") && !openaiRes.content.startsWith("Error:")) {
        return openaiRes.content;
    }

    // 3. Synthesize / Judge to ensure valid JSON
    const synthesisPrompt = `
You are a quiz generator. I have two drafts for a quiz requests.
Prompt: "${prompt}"

Draft 1 (OpenAI):
${openaiRes.content}

Draft 2 (Gemini):
${geminiRes.content}

Task:
Combine the best unique questions from these drafts to satisfy the original request.
Ensure the output is strictly valid JSON as requested in the prompt.
No extra text, no markdown code blocks, just the JSON array.
`;

    try {
        const synthesis = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: "You output only valid JSON." }, { role: "user", content: synthesisPrompt }],
            max_completion_tokens: 2048,
        });

        return synthesis.choices[0]?.message?.content || "[]";
    } catch (err) {
        console.error("[HybridAI] OpenAI Quiz Synthesis failed, trying Gemini...");
        try {
            const geminiRes = await geminiModel.generateContent(synthesisPrompt);
            return geminiRes.response.text();
        } catch (geminiErr) {
            console.error("[HybridAI] Gemini Quiz Synthesis failed.");
            return geminiRes.content;
        }
    }
}
