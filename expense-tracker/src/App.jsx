import { BrowserRouter, Routes, Route } from "react-router-dom";

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


function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* AUTH */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* MAIN */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/wallet" element={<Wallet />} />

      </Routes>

    </BrowserRouter>

  );

}

export default App;