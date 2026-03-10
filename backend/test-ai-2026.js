const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testCurrentModel() {
    const apiKey = (process.env.GEMINI_API_KEY || "").replace(/['"]/g, "").trim();
    const genAI = new GoogleGenerativeAI(apiKey);
    const mName = "gemini-2.0-flash";

    try {
        console.log(`Testing model: ${mName}...`);
        const model = genAI.getGenerativeModel({ model: mName });
        const result = await model.generateContent("Hello! Give me a short financial tip.");
        const response = await result.response;
        console.log(`✅ Success with ${mName}:`, response.text());
    } catch (err) {
        console.error(`❌ Error with ${mName}:`, err.message);
    }
}

testCurrentModel();
