# 🚀 Fintrack: Comprehensive Project Documentation & Architecture Overview

Welcome to the full documentation of **Fintrack**, a premium, AI-powered personal finance management system. This guide covers everything from the core infrastructure to the specific AI algorithms and UI design patterns used in the project.

---

## 🏗️ 1. Core Technology Stack
Fintrack is built using a modern **PERN** stack, optimized for performance, security, and a premium user experience.

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | High-performance, components-based UI development. |
| **Backend** | Node.js & Express | Robust API development and business logic. |
| **Database** | PostgreSQL | Relational data storage for transactions and users. |
| **Auth** | JWT & Google OAuth | Secure local and social authentication. |
| **AI** | Google Gemini 2.0 | Intelligent financial insights and spending analysis. |
| **Styling** | Vanilla CSS + Variables | Premium aesthetics with seamless Dark Mode. |

---

## 📂 2. Project Structure & Directory Mapping

### 🌐 Backend (`/backend`)
- **`server.js`**: The main entry point. Initializes the Express server, connects routes, and handles core middleware (CORS, JSON).
- **`/routes`**:
    - `auth.js`: Handles Signup, Login, Password Resets, and Google OAuth flow.
    - `expenses.js`: Core CRUD operations for transactions (Add, List, Delete, Summary).
    - `ai.js`: The "brain" of the app. Handles Gemini integration and caching.
    - `investments.js` & `goals.js`: Modules for tracking financial growth.
- **`db.js`**: PostgreSQL connection pool configuration.
- **`.env`**: Stores sensitive keys (DB credentials, JWT secret, Gemini API key).

### 🎨 Frontend (`/expense-tracker`)
- **`src/App.jsx`**: Central routing hub using `react-router-dom`. Defines protected and public routes.
- **`src/components/Layout`**: The persistent Sidebar and Header. Controls the theme (Light/Dark mode) globally.
- **`src/components/Dashboard`**: The primary "Snapshot" page. Orchestrates data from multiple API endpoints to show stats and AI insights.
- **`src/components/Transactions`**: Dedicated page for entering and managing historical financial data.
- **`src/index.css`**: Defines the global **Design System** (CSS variables for colors, spacing, and animations).

---

## 🔐 3. Authentication Flow
Fintrack uses a hybrid authentication system:
1.  **Local Auth**: Users can create an account using email/password. Passwords are encrypted using `bcrypt` before storage.
2.  **Google OAuth**: Integrated via `@react-oauth/google`. The backend validates the Google token and automatically creates a user record if it's their first time logging in.
3.  **JWT (JSON Web Tokens)**: Upon login, the server issues a JWT. The frontend stores this token in `localStorage` and includes it in the `Authorization` header for all protected API calls.

---

## 🤖 4. AI Spending Advisor (Smart Insights)
This is the standout feature of Fintrack. It acts as a digital financial coach.

- **How it works**:
    1. The frontend requests insights from `/api/ai/insights`.
    2. The backend fetches the user's **last 50 transactions**.
    3. It builds a detailed financial prompt for the **Gemini 2.0 Flash-Lite** model.
    4. The AI analyzes the data and provides 3 concise, actionable tips.
- **Efficiency (Caching)**: To protect your API quota, the backend remembers (caches) the AI's advice. It only re-runs the AI analysis if you add or delete a transaction.
- **Resilience**: If the AI model hits a quota limit, the app displays a graceful "Take a break" message instead of crashing.

---

## 🕒 5. The "Nepal Time" (Local Date) Engine
Many finance apps struggle with dates due to UTC offsets. Fintrack implements a custom date handling system:
- **`toLocalDateString`**: A specialized helper function used across the app to ensure that "Today's Activities" strictly uses your computer's local clock. 
- **Effect**: If you add an expense at 11:30 PM in Nepal, it stays on the correct day and doesn't "jump" to the next day due to global time shifts.

---

## 🎨 6. Premium UI & Design System
Fintrack doesn't just work well; it looks professional.
- **Glassmorphism**: Subtle translucent backgrounds and borders for a modern feel.
- **Theme Engine**: The app uses a "Variables-first" approach. Switching between Light and Dark mode just changes the value of `--bg-card` and `--text-primary` instantly without a page reload.
- **Animations**: Uses CSS keyframes for `pulse` effects on AI icons and `slideUp` animations for list items.

---

## 🛠️ 7. Maintenance & Setup
- **Environment**: Always keep your `GEMINI_API_KEY` and `DB_PASSWORD` in the `backend/.env` file.
- **Scaling**: The project is modular. You can add new features (like Budgeting or Stocks) by simply creating a new route file in `backend/routes` and a new component in the frontend.

---

> [!IMPORTANT]
> **Summary**: Fintrack is a high-availability application designed for accuracy and user engagement. By combining real-time database tracking with state-of-the-art AI, it provides more than just a list of numbers—it provides financial intelligence.
