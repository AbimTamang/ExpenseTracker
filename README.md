# 💸 Expense Tracker — AI Integrated

A full-stack personal finance web app that helps you track expenses, understand your spending habits, and manage budgets — powered by AI.

---

## 🌟 Features

- 📊 **Dashboard** — Visual overview of income, expenses, and balance
- 🤖 **AI-Powered Categorization** — Automatically categorizes your expenses
- 💡 **AI Spending Insights** — Get personalized tips based on your spending patterns
- 🎯 **Auto Budget Suggestions** — AI recommends budgets based on your history
- 🔐 **Secure Authentication** — JWT-based auth with bcrypt password hashing
- 👤 **User Accounts** — Full signup, login, and protected routes

---

## 🛠 Tech Stack

**Frontend**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

**Backend**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

**Database**

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

**Security**

![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
- JWT Authentication
- Role-based Authorization
- bcrypt Password Hashing

---

## 🏗 Architecture

```
expense-tracker/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Dashboard, Login, Signup
│   │   ├── context/         # Auth context
│   │   └── utils/           # API helpers
│
├── server/                  # Node.js + Express backend
│   ├── controllers/         # Route handlers
│   ├── middleware/          # JWT auth middleware
│   ├── models/              # PostgreSQL models
│   ├── routes/              # API routes
│   └── services/            # AI integration logic
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL
- npm or yarn

### 1. Clone the repo

```bash
git clone https://github.com/AbimTamang/Fyp-frontend.git
cd expense-tracker
```

### 2. Setup the backend

```bash
cd server
npm install
```

Create a `.env` file in the `server` folder:

```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/expense_tracker
JWT_SECRET=your_jwt_secret_key
AI_API_KEY=your_ai_api_key
```

Start the server:

```bash
npm run dev
```

### 3. Setup the frontend

```bash
cd client
npm install
npm start
```

App runs on `http://localhost:3000`

---

## 🔐 Authentication Flow

1. User signs up → password hashed with **bcrypt** before storing
2. On login → server verifies password and returns a **JWT token**
3. Token stored on client → sent in headers for protected routes
4. Server **middleware** verifies token on every protected API call

---

## 🤖 AI Features

| Feature | Description |
|--------|-------------|
| Smart Categorization | Automatically tags expenses (Food, Transport, Bills, etc.) |
| Spending Insights | Analyzes patterns and gives personalized saving tips |
| Budget Suggestions | Recommends monthly budgets based on your spending history |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT token |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses |
| POST | `/api/expenses` | Add new expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/insights` | Get AI spending insights |
| GET | `/api/ai/budget` | Get AI budget suggestions |

---

## 👨‍💻 Author

**Abim Tamang**
- GitHub: [@AbimTamang](https://github.com/AbimTamang)
- 📍 Kathmandu, Nepal

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
