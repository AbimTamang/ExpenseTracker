# 🤖 Fintrack: AI Spending Advisor Implementation Guide

This document provides a technical overview of how the **AI Spending Advisor** (Smart Insights) feature was implemented in the Expense Tracker application.

---

## 🏗️ 1. Project Architecture Overview
The application follows a standard **PERN** architecture:
- **Frontend**: React (Vite) with a premium CSS-driven design system.
- **Backend**: Node.js & Express.
- **Database**: PostgreSQL (pg) for storing transactions and user data.
- **AI Engine**: Google Gemini API (`gemini-2.0-flash-lite-001`).

---

## 🧠 2. Backend Implementation (AI Logic)

### 📂 File: `backend/routes/ai.js`
The core AI logic resides in the backend to keep the API key secure and handle complex prompt engineering.

#### Key Features:
- **Model Selection**: Uses `gemini-2.0-flash-lite-001` for the best balance of speed and free-tier quota limits in 2026.
- **Prompt Engineering**: Instructs the AI to act as a "wise and friendly financial advisor" and return a strictly formatted JSON array of 3 insights.
- **Context Injection**: Fetches the **last 50 transactions** from the database to give the AI enough data to detect patterns.
- **Resilient Parsing**: Cleans up AI responses (handling accidental markdown backticks) to ensure the frontend never crashes.

#### ⚡ Smart Caching Logic:
To prevent "Too Many Requests" (429) errors from Google, we implemented an in-memory cache:
```javascript
const aiCache = new Map();
// ...
const cacheKey = `${req.userId}_${transactions.length}`;
if (aiCache.has(cacheKey)) {
    return res.json({ success: true, insights: aiCache.get(cacheKey) });
}
```
*This ensures that if a user refreshes the page but hasn't added new data, we don't waste an API call.*

---

## 🎨 3. Frontend Implementation (UI/UX)

### 📂 File: `src/components/Dashboard/Dashboard.jsx`
The AI insights are displayed in a dedicated, premium-styled card in the dashboard.

#### Key Features:
- **Visual Feedback**: A pulsing "Analyzing..." state when the AI is working.
- **Responsive Bubbles**: Insights are rendered as separate "bubbles" with entrance animations.
- **Error Handling**: Gracefully handles missing API keys, low transaction counts (<10), and quota limits.

---

## 🕒 4. Timezone & Data Synchronization
A critical challenge was a "Timezone Shift" where transactions appeared on the wrong day (e.g., March 9th appearing as March 8th).

### The Fix: `toLocalDateString`
We implemented a helper function on both the Dashboard and Transactions pages to ignore UTC shifts and strictly use the user's local clock:
```javascript
const toLocalDateString = (dateInput) => {
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
```

---

## 🚀 5. How to Run & Configure
1. **API Key**: Ensure `GEMINI_API_KEY` is set in `backend/.env`.
2. **Backend**: Run `npm run dev` in the `backend` folder.
3. **Frontend**: Run `npm run dev` in the `expense-tracker` folder.
4. **Usage**: Add at least 10 transactions to unlock the advisor.

---

### 📄 How to convert this to PDF:
1. Open this file in **VS Code**.
2. If you have the **"Markdown PDF"** extension installed, just right-click and select **"Markdown PDF: Export (pdf)"**.
3. Alternatively, open this file in a browser or markdown editor and use **Ctrl + P** (Print) and select **"Save as PDF"**.
