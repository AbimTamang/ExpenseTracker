require("dotenv").config();

async function listModels() {
    const apiKey = (process.env.GEMINI_API_KEY || "").replace(/['"]/g, "").trim();
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Models:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch Error:", err.message);
    }
}

listModels();
