import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';

// LAYOUT
import Layout from "./components/Layout/Layout";

// ROUTE GUARDS
import RequireAuth from "./auth/RequireAuth";
import RequireGuest from "./auth/RequireGuest";

// AUTH
import Login from "./components/Login/Login";
import Signup from "./components/Signup/Signup";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import ResetPassword from "./components/ResetPassword/ResetPassword";

// DASHBOARD
import Dashboard from "./components/Dashboard/Dashboard";

// TRANSACTIONS ✅ FIXED PATH
import Transactions from "./components/Transactions/Transactions";

// OTHER PAGES
import Analytics from "./pages/Analytics/Analytics";
import Settings from "./pages/Setting/Settings";
import Wallet from "./pages/Wallet/Wallet";
import Budgets from "./pages/Budgets/Budgets";

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <Routes>

          {/* AUTH (guest-only) */}
          <Route element={<RequireGuest />}>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* AUTH (public, for recovery) */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* MAIN (auth-only) */}
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/budgets" element={<Budgets />} />
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;