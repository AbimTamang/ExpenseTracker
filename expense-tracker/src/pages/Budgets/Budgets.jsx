import React, { useState, useEffect } from "react";
import { FiTarget, FiPlus, FiEdit2, FiCheck, FiX, FiPieChart } from "react-icons/fi";
import "./Budgets.css";

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [stats, setStats] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newBudget, setNewBudget] = useState({ category: "", amount: "" });
    const token = localStorage.getItem("token");

    const categories = ["Food", "Transport", "Shopping", "Entertainment", "Health", "Utilities", "General"];

    const fetchBudgets = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/budgets/stats", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, []);

    const handleUpsert = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:5000/api/budgets/upsert", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    category: newBudget.category,
                    amount: parseFloat(newBudget.amount)
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsAdding(false);
                setNewBudget({ category: "", amount: "" });
                fetchBudgets();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getProgressColor = (percent) => {
        if (percent >= 100) return "#ef4444"; // Red
        if (percent >= 80) return "#f97316";  // Orange
        return "#22c55e"; // Green
    };

    return (
        <div className="budgets-container">
            <header className="budgets-header">
                <div>
                    <h1>Category Budgets 🎯</h1>
                    <p>Set monthly limits to keep your spending in check.</p>
                </div>
                {!isAdding && (
                    <button className="add-budget-btn" onClick={() => setIsAdding(true)}>
                        <FiPlus /> Set Budget
                    </button>
                )}
            </header>

            {isAdding && (
                <div className="budget-form-card">
                    <h3>{newBudget.id ? 'Edit Budget' : 'Add Strategic Budget'}</h3>
                    <form onSubmit={handleUpsert}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Category</label>
                                <select 
                                    value={newBudget.category} 
                                    onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Monthly Limit (Rs)</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 5000" 
                                    value={newBudget.amount}
                                    onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="cancel-btn" onClick={() => setIsAdding(false)}>
                                <FiX /> Cancel
                            </button>
                            <button type="submit" className="save-btn">
                                <FiCheck /> Save Budget
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="budgets-grid">
                {stats.length > 0 ? (
                    stats.map((item, idx) => {
                        const percent = Math.min((item.current_spent / item.budget_limit) * 100, 100);
                        const isOver = item.current_spent > item.budget_limit;

                        return (
                            <div key={idx} className="budget-progress-card">
                                <div className="budget-card-header">
                                    <div className="budget-cat-info">
                                        <span className="cat-icon"><FiPieChart /></span>
                                        <h3>{item.category}</h3>
                                    </div>
                                    <button 
                                        className="edit-mini-btn"
                                        onClick={() => {
                                            setNewBudget({ category: item.category, amount: item.budget_limit });
                                            setIsAdding(true);
                                        }}
                                    >
                                        <FiEdit2 />
                                    </button>
                                </div>

                                <div className="budget-status">
                                    <span className={`status-label ${isOver ? 'danger' : ''}`}>
                                        {isOver ? 'Over Budget!' : 'On Track'}
                                    </span>
                                    <span className="spent-text">
                                        Rs {item.current_spent.toLocaleString()} / Rs {item.budget_limit.toLocaleString()}
                                    </span>
                                </div>

                                <div className="progress-bar-container">
                                    <div 
                                        className="progress-bar-fill" 
                                        style={{ 
                                            width: `${percent}%`, 
                                            backgroundColor: getProgressColor(percent)
                                        }}
                                    ></div>
                                </div>

                                <div className="budget-remaining">
                                    {isOver ? (
                                        <span className="rem-text-danger">Exceeded by Rs {(item.current_spent - item.budget_limit).toLocaleString()}</span>
                                    ) : (
                                        <span className="rem-text">Rs {(item.budget_limit - item.current_spent).toLocaleString()} remaining</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-budgets">
                        <FiTarget />
                        <p>No budgets set yet. Start by setting a limit for your favorite categories!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Budgets;
