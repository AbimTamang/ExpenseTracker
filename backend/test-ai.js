const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
    const apiKey = (process.env.GEMINI_API_KEY || "").replace(/['"]/g, "").trim();
    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTest = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "models/gemini-1.5-flash",
        "models/gemini-pro"
    ];

    for (const m of modelsToTest) {
        try {
            console.log(`Testing model: ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("test");
            console.log(`✅ Success with ${m}`);
        } catch (err) {
            console.error(`❌ Error with ${m}:`, err.message);
        }
    }
}

listModels();
