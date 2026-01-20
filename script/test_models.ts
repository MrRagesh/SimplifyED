import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "not-set");
    try {
        // There isn't a direct listModels method on the client instance in some versions?
        // Wait, the SDK documentation usually has one. 
        // If not, I'll just try to use a known model that usually works or try to interpret the error better.
        // But let's check if we can.
        // Actually, looking at the error stack, it seems like `makeRequest` is used.
        // I'll try to use a REST call instead if SDK doesn't expose it easily.
        // But let's try a direct simple generation with "gemini-1.0-pro" just in case.
        console.log("Testing gemini-1.0-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.0-pro:", result.response.text());
    } catch (e: any) {
        console.error("Failed with gemini-1.0-pro:", e.message);
    }

    try {
        console.log("Testing gemini-1.5-flash-001...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash-001:", result.response.text());
    } catch (e: any) {
        console.error("Failed with gemini-1.5-flash-001:", e.message);
    }
}

listModels();
