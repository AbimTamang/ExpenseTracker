require("dotenv").config();

async function testFetch() {
    const apiKey = (process.env.GEMINI_API_KEY || "").replace(/['"]/g, "").trim();
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const body = {
        contents: [{ parts: [{ text: "Hello" }] }]
    };

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch Error:", err.message);
    }
}

testFetch();
