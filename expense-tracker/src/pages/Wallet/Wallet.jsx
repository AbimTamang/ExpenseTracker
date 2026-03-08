import React, { useState, useEffect } from "react";
import "./Wallet.css";
import { useNavigate } from "react-router-dom";

const Wallet = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("investments");
  const token = localStorage.getItem("token");

  // Investments state
  const [investments, setInvestments] = useState([]);
  const [invTitle, setInvTitle] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invCategory, setInvCategory] = useState("Stocks");

  // Goals state
  const [goals, setGoals] = useState([]);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [fundAmount, setFundAmount] = useState({});

  useEffect(() => {
    fetchInvestments();
    fetchGoals();
  }, []);

  const fetchInvestments = async () => {
    const res = await fetch("http://localhost:5000/api/investments/list", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setInvestments(data.data);
  };

  const fetchGoals = async () => {
    const res = await fetch("http://localhost:5000/api/goals/list", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setGoals(data.data);
  };

  const addInvestment = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/investments/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: invTitle, amount: invAmount, category: invCategory })
    });
    if ((await res.json()).success) {
      setInvTitle(""); setInvAmount(""); fetchInvestments();
      alert("Investment recorded successfully!");
    } else {
      alert("Failed to record investment. Please try again.");
    }
  };

  const deleteInvestment = async (id) => {
    await fetch(`http://localhost:5000/api/investments/delete/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchInvestments();
  };

  const addGoal = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/goals/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: goalTitle, target_amount: goalTargetAmount, deadline: goalDeadline })
    });
    if ((await res.json()).success) {
      setGoalTitle(""); setGoalTargetAmount(""); setGoalDeadline(""); fetchGoals();
      alert("Saving goal created successfully!");
    } else {
      alert("Failed to create saving goal. Please try again.");
    }
  };

  const addFunds = async (id) => {
    const amount = fundAmount[id];
    if (!amount) return;
    const res = await fetch(`http://localhost:5000/api/goals/add-funds/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount })
    });
    if ((await res.json()).success) {
      setFundAmount({ ...fundAmount, [id]: "" });
      fetchGoals();
      alert("Funds deposited successfully!");
    } else {
      alert("Failed to deposit funds. Please try again.");
    }
  };

  const deleteGoal = async (id) => {
    await fetch(`http://localhost:5000/api/goals/delete/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchGoals();
  };

  return (
    <div className="wallet-page">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>
        <h1>My Wealth Hub</h1>
      </div>

      <div className="tab-container">
        <button className={`tab-btn ${activeTab === "investments" ? "active" : ""}`} onClick={() => setActiveTab("investments")}>
          📈 Investments Portfolio
        </button>
        <button className={`tab-btn ${activeTab === "goals" ? "active" : ""}`} onClick={() => setActiveTab("goals")}>
          🎯 Saving Goals
        </button>
      </div>

      <div className="content">
        {activeTab === "investments" ? (
          <div className="tab-content fade-in">
            <form className="add-card" onSubmit={addInvestment}>
              <h2>Add New Investment</h2>
              <input placeholder="Investment Name (e.g., Apple Stock, BTC)" value={invTitle} onChange={(e) => setInvTitle(e.target.value)} required />
              <input type="number" placeholder="Amount Invested (Rs)" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} required />
              <select value={invCategory} onChange={(e) => setInvCategory(e.target.value)}>
                <option value="Stocks">Stocks</option>
                <option value="Crypto">Crypto</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Mutual Funds">Mutual Funds</option>
                <option value="Fixed Deposit">Fixed Deposit</option>
                <option value="Other">Other</option>
              </select>
              <button type="submit">Record Investment</button>
            </form>

            <div className="list">
              {investments.map(item => (
                <div key={item.id} className="transaction-card">
                  <div>
                    <h3>{item.title}</h3>
                    <p className="category-badge">{item.category}</p>
                    <small>Purchased: {new Date(item.created_at).toLocaleDateString()}</small>
                  </div>
                  <div className="right">
                    <h3 className="income">Rs {item.amount}</h3>
                    <button onClick={() => deleteInvestment(item.id)}>Sell / Remove</button>
                  </div>
                </div>
              ))}
              {investments.length === 0 && <p className="empty-state">No investments yet. Start building your portfolio today!</p>}
            </div>
          </div>
        ) : (
          <div className="tab-content fade-in">
            <form className="add-card" onSubmit={addGoal}>
              <h2>Create Saving Goal</h2>
              <input placeholder="Goal Title (e.g., Dream Car, Vacation)" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} required />
              <input type="number" placeholder="Target Amount (Rs)" value={goalTargetAmount} onChange={(e) => setGoalTargetAmount(e.target.value)} required />
              <input type="date" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} required />
              <button type="submit">Set My Goal</button>
            </form>

            <div className="goals-grid">
              {goals.map(item => {
                const progress = Math.min((item.current_amount / item.target_amount) * 100, 100).toFixed(1);
                return (
                  <div key={item.id} className="goal-card">
                    <div className="goal-header">
                      <h3>{item.title}</h3>
                      <button className="delete-icon" onClick={() => deleteGoal(item.id)}>✕</button>
                    </div>
                    <p className="goal-deadline">⏱️ Target Date: {new Date(item.deadline).toLocaleDateString()}</p>

                    <div className="progress-container">
                      <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                    </div>

                    <div className="goal-amounts">
                      <span>Saved <strong>Rs {item.current_amount}</strong></span>
                      <span>Target <strong>Rs {item.target_amount}</strong></span>
                    </div>

                    <div className="fund-section">
                      <input
                        type="number"
                        placeholder="Amount to add..."
                        value={fundAmount[item.id] || ""}
                        onChange={(e) => setFundAmount({ ...fundAmount, [item.id]: e.target.value })}
                      />
                      <button onClick={() => addFunds(item.id)}>Deposit</button>
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && <p className="empty-state">No saving goals yet. Define your future now!</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Wallet;