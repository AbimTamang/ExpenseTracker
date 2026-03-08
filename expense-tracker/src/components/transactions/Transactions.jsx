import React, { useState, useEffect } from "react";
import "./Transactions.css";
import { useNavigate } from "react-router-dom";

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("food");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  // ✅ FETCH TRANSACTIONS (Fixed route to /list)
  const fetchTransactions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/expenses/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchTransactions();
  }, []);

  // ✅ ADD TRANSACTION
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title || !amount || !category) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:5000/api/expenses/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          amount,
          type,
          category,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTitle("");
        setAmount("");
        setCategory("");
        fetchTransactions();
        // Optional alert or toast
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await fetch(`http://localhost:5000/api/expenses/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  return (
    <div className="transactions-page fade-in">

      {/* HEADER */}
      <div className="top-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <div className="header-titles">
          <h1>Transactions History</h1>
          <p>Record, manage, and track your ongoing expenses and income.</p>
        </div>
      </div>

      <div className="transactions-content">

        {/* LEFT COLUMN: ADD CARD */}
        <div className="add-transaction-container">
          <form className="add-card" onSubmit={handleAdd}>
            <h2>Add New Entry</h2>

            <div className="form-group">
              <label>Transaction Title</label>
              <input
                placeholder="e.g., Groceries, Salary, Freelance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Amount (Rs)</label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0"
                step="any"
              />
            </div>

            <div className="form-group">
              <label>Transaction Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="expense">📉 Expense</option>
                <option value="income">📈 Income</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <input
                placeholder="e.g., Food, Transport, Utilities"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Log Transaction"}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: LIST */}
        <div className="transactions-list-container">
          <div className="list-header">
            <h3>Recent Activity ({transactions.length})</h3>
          </div>

          <div className="list">
            {transactions.length === 0 ? (
              <div className="empty-state">
                <p>No transactions found. Start by adding one!</p>
              </div>
            ) : (
              transactions.map((item) => (
                <div key={item.id} className="transaction-card">
                  <div className="card-left">
                    <div className={`icon-circle ${item.type === 'income' ? 'bg-green' : 'bg-red'}`}>
                      {item.type === 'income' ? '+$' : '-$'}
                    </div>
                    <div className="transaction-info">
                      <h3>{item.title}</h3>
                      <div className="meta-info">
                        <span className="category-tag">{item.category}</span>
                        <span className="dot">•</span>
                        <small>{new Date(item.created_at).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}</small>
                      </div>
                    </div>
                  </div>

                  <div className="card-right">
                    <h3 className={item.type === "income" ? "income-text" : "expense-text"}>
                      {item.type === "income" ? "+" : "-"} Rs {Number(item.amount).toLocaleString()}
                    </h3>
                    <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Transactions;