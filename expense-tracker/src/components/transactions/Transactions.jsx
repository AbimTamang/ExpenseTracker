import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiTrash2,
  FiFilter,
  FiShoppingBag,
  FiFileText,
  FiCalendar
} from "react-icons/fi";
import "./Transactions.css";

const Transactions = () => {
  const navigate = useNavigate();
  const toLocalDateString = (dateInput) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [transactions, setTransactions] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => toLocalDateString(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");
  const [showFilter, setShowFilter] = useState(false);

  const CATEGORIES = ["All", "Food & Drinks", "Housing/Rent", "Transportation", "Entertainment", "Salary/Income", "Healthcare", "Shopping", "Technology", "Other"];

  const token = localStorage.getItem("token");
  const currency = localStorage.getItem("currency") || "Rs";

  const fetchTransactions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/expenses/list", {
        headers: { Authorization: `Bearer ${token} ` },
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

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title || !amount) return;

    if (parseFloat(amount) <= 0) {
      alert("Amount must be a positive number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:5000/api/expenses/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
        body: JSON.stringify({ title, amount, type, category, date }),
      });

      const data = await res.json();
      if (data.success) {
        setTitle("");
        setAmount("");
        fetchTransactions();
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await fetch(`http://localhost:5000/api/expenses/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  return (
    <div className="transactions-page">
      <header className="page-header">
        <div className="header-info">
          <h1>Transaction History</h1>
          <p>Detailed overview of your cash flow and financial activities.</p>
        </div>
      </header>

      <div className="transactions-grid">
        {/* ADD TRANSACTION FORM */}
        <section className="add-entry-section">
          <div className="form-card">
            <div className="card-header-icon">
              <FiPlus />
            </div>
            <h2>New Entry</h2>
            <form onSubmit={handleAdd}>
              <div className="input-group">
                <label>Title</label>
                <div className="input-wrapper">
                  <FiFileText className="input-icon" />
                  <input
                    type="text"
                    placeholder="Rent, Grocery, Side project..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Amount ({currency})</label>
                <div className="input-wrapper">
                  <span className="currency-prefix">{currency}</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="any"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Auto</option>
                    <option value="Food">Food & Drinks</option>
                    <option value="Rent">Housing/Rent</option>
                    <option value="Transport">Transportation</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Salary">Salary/Income</option>
                    <option value="Health">Healthcare</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Technology">Technology</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Date</label>
                <div className="input-wrapper">
                  <FiCalendar className="input-icon" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="submit-entry-btn" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Add Transaction"}
              </button>
            </form>
          </div>
        </section>

        {/* TRANSACTIONS LIST */}
        <section className="history-section">
          <div className="history-header">
            <h3>Recent Activity
              {filterCategory !== "All" && (
                <span className="filter-active-badge">{filterCategory}</span>
              )}
            </h3>
            <div className="filter-wrapper">
              <button className="filter-btn" onClick={() => setShowFilter(p => !p)}>
                <FiFilter /> <span>Filter</span>
              </button>
              {showFilter && (
                <div className="filter-dropdown">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      className={`filter-option ${filterCategory === cat ? "active" : ""}`}
                      onClick={() => { setFilterCategory(cat); setShowFilter(false); }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="history-list">
            {(() => {
              const filtered = filterCategory === "All"
                ? transactions
                : transactions.filter(t => t.category === filterCategory);
              if (filtered.length === 0) return (
                <div className="no-transactions">
                  <div className="empty-icon"><FiShoppingBag /></div>
                  <p>{filterCategory === "All" ? "No transactions recorded yet." : `No "${filterCategory}" transactions found.`}</p>
                </div>
              );
              return filtered.map((item) => (
                <div key={item.id} className={`history-item-card ${item.type}`}>
                  <div className="item-icon-box">
                    {item.type === 'income' ? <FiArrowUpRight /> : <FiArrowDownLeft />}
                  </div>
                  <div className="item-details">
                    <span className="item-title">{item.title}</span>
                    <div className="item-meta">
                      <span className="item-category">{item.category}</span>
                      <span className="meta-sep">•</span>
                      <span className="item-date">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="item-amount-group">
                    <span className={`item-price ${item.type}`}>
                      {item.type === 'income' ? '+' : '-'} {currency} {Number(item.amount).toLocaleString()}
                    </span>
                    <button className="item-delete-btn" onClick={() => handleDelete(item.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Transactions;