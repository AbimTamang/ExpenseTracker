import React from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
    FiHome,
    FiDollarSign,
    FiTrendingUp,
    FiPieChart,
    FiCreditCard,
    FiSettings,
    FiLogOut,
    FiSun,
    FiMoon,
    FiTarget
} from "react-icons/fi";
import { useState, useEffect } from "react";
import "./Layout.css";

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === "light" ? "dark" : "light");
    };

    const logout = () => {
        localStorage.clear();
        navigate("/");
    };

    const navItems = [
        { label: "Dashboard", icon: <FiHome />, path: "/dashboard" },
        { label: "Transactions", icon: <FiDollarSign />, path: "/transactions" },
        { label: "Analytics", icon: <FiPieChart />, path: "/analytics" },
        { label: "Wallet", icon: <FiCreditCard />, path: "/wallet" },
        { label: "Budgets", icon: <FiTarget />, path: "/budgets" },
        { label: "Settings", icon: <FiSettings />, path: "/settings" }
    ];

    return (
        <div className="layout-container">
            <div className="sidebar">
                <div className="sidebar-top">
                    <div className="brand" onClick={() => navigate("/dashboard")}>
                        <div className="brand-icon"><FiTrendingUp /></div>
                        <h2>Fintrack</h2>
                    </div>

                    <nav>
                        {navItems.map((item) => (
                            <div
                                key={item.label}
                                className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
                                onClick={() => navigate(item.path)}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="sidebar-bottom">
                    <button className="theme-toggle" onClick={toggleTheme}>
                        {theme === "light" ? <FiMoon /> : <FiSun />}
                        <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                    </button>

                    <button className="logout-btn" onClick={logout}>
                        <FiLogOut />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
