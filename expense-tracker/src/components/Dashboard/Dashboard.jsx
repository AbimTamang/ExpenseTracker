import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import {
  FiPlus,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiTrash2,
  FiCreditCard,
  FiSearch,
  FiCalendar,
  FiZap,
  FiCpu,
  FiTarget
} from "react-icons/fi";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "User";
  const token = localStorage.getItem("token");

  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    balance: 0
  });

  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [budgetStats, setBudgetStats] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");

  const toLocalDateString = (dateInput) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [lookupDate, setLookupDate] = useState(() => toLocalDateString(new Date()));
  const [lookupResults, setLookupResults] = useState({ total: 0, items: [] });
  const [aiForecast, setAiForecast] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // FETCH SUMMARY
  const fetchSummary = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/expenses/summary", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setSummary(data.summary);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  // FETCH TRANSACTIONS
  const fetchTransactions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/expenses/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
        prepareChart(data.transactions);
      }
    } catch (err) {
      console.log(err);
    }
  };


  const fetchAIForecast = async () => {
    setLoadingForecast(true);
    try {
      const res = await fetch("http://localhost:5000/api/ai/predictions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAiForecast(data.forecast);
      } else {
        setAiForecast(data.message || "Forecast currently unavailable.");
      }
    } catch (err) {
      console.log("Forecast error:", err);
      setAiForecast("Server connection error.");
    } finally {
      setLoadingForecast(false);
    }
  };

  const fetchBudgetStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/budgets/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setBudgetStats(data.stats);
    } catch (err) {
      console.error("Error fetching budget stats:", err);
    }
  };

  const prepareChart = (data) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let result = months.map(month => ({
      month,
      income: 0,
      expense: 0
    }));

    // Start with the raw transaction list then filter by category if needed
    let filteredData = data;
    if (filterCategory !== "All") {
      filteredData = data.filter(item => item.category === filterCategory);
    }

    filteredData.forEach(item => {
      const date = new Date(item.created_at);
      const monthIndex = date.getMonth();
      if (item.type === "income") {
        result[monthIndex].income += Number(item.amount);
      } else {
        result[monthIndex].expense += Number(item.amount);
      }
    });

    setChartData(result);
  };

  const getTodaySummary = () => {
    const today = toLocalDateString(new Date());
    let income = 0;
    let expense = 0;

    transactions.forEach(item => {
      const itemDate = toLocalDateString(item.created_at);
      if (itemDate === today) {
        if (item.type === "income") income += Number(item.amount);
        else expense += Number(item.amount);
      }
    });

    return { income, expense, balance: income - expense };
  };

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchSummary();
    fetchTransactions();
    fetchAIForecast();
    fetchBudgetStats();
  }, []);

  useEffect(() => {
    prepareChart(transactions);
  }, [transactions, filterCategory]);

  useEffect(() => {
    const expensesOnDate = transactions.filter(t => {
      const tDate = toLocalDateString(t.created_at);
      return tDate === lookupDate && t.type === 'expense';
    });

    const total = expensesOnDate.reduce((sum, item) => sum + Number(item.amount), 0);
    setLookupResults({ total, items: expensesOnDate });
  }, [lookupDate, transactions]);

  const deleteTransaction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await fetch(`http://localhost:5000/api/expenses/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSummary();
      fetchTransactions();
    } catch (err) {
      console.error("Error deleting transaction:", err);
    }
  };

  const todayData = getTodaySummary();

  return (
    <div className="dashboard-content">
      <header className="header">
        <div className="greeting">
          <h1>Hello, {name} 👋</h1>
          <p>Welcome back to your financial dashboard.</p>
        </div>
        <button className="add-btn" onClick={() => navigate("/transactions")}>
          <FiPlus />
          <span>New Transaction</span>
        </button>
      </header>

      <section className="dashboard-grid">
        <div className="summary-section">
          <h2 className="section-title">Snapshot</h2>
          <div className="cards-grid">
            <div className="card balance">
              <div className="card-header">
                <span className="card-label">Total Balance</span>
                <div className="card-icon"><FiCreditCard /></div>
              </div>
              <div className="card-value">Rs {summary.balance.toLocaleString()}</div>
              <div className="card-footer positive">
                <FiArrowUpRight /> <span>+2.5% from last month</span>
              </div>
            </div>

            <div className="card income">
              <div className="card-header">
                <span className="card-label">Overall Income</span>
                <div className="card-icon"><FiArrowUpRight /></div>
              </div>
              <div className="card-value">Rs {summary.income.toLocaleString()}</div>
            </div>

            <div className="card expense">
              <div className="card-header">
                <span className="card-label">Overall Expense</span>
                <div className="card-icon"><FiArrowDownLeft /></div>
              </div>
              <div className="card-value">Rs {summary.expense.toLocaleString()}</div>
            </div>
          </div>

          <div className="lookup-card">
            <div className="lookup-header">
              <div className="lookup-title">
                <FiSearch />
                <h3>Historical Spent Tracker</h3>
              </div>
              <div className="lookup-input-wrapper">
                <FiCalendar />
                <input
                  type="date"
                  value={lookupDate}
                  onChange={(e) => setLookupDate(e.target.value)}
                />
              </div>
            </div>
            <div className="lookup-body">
              <div className="lookup-summary">
                <span className="lookup-stat-label">
                  Total Spent on {(() => {
                    const [y, m, d] = lookupDate.split('-').map(Number);
                    return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  })()}
                </span>
                <span className="lookup-stat-value">Rs {lookupResults.total.toLocaleString()}</span>
              </div>

              <div className="lookup-items">
                {lookupResults.items.length > 0 ? (
                  lookupResults.items.map(item => (
                    <div key={item._id} className="lookup-item">
                      <span className="item-name">{item.title}</span>
                      <span className="item-price">Rs {Number(item.amount).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-lookup-data">No expenses on this date.</p>
                )}
              </div>
            </div>
          </div>

          {/* Moved All Activities here - original place of Today's activities */}
          <div className="recent-section">
            <div className="recent-header">
              <h2 className="section-title">All Activities</h2>
              <button className="view-all" onClick={() => navigate("/transactions")}>View All</button>
            </div>
            <div className="transaction-list">
              {transactions.length > 0 ? (
                transactions.slice(0, 8).map(item => (
                  <div key={item._id} className="transaction-item">
                    <div className={`transaction-icon-box ${item.type}`}>
                      {item.type === 'income' ? <FiArrowUpRight /> : <FiArrowDownLeft />}
                    </div>
                    <div className="transaction-info">
                      <span className="transaction-title">{item.title}</span>
                      <span className="transaction-date">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="transaction-amount-group">
                      <span className={`transaction-amount ${item.type}`}>
                        {item.type === 'income' ? '+' : '-'} Rs {item.amount}
                      </span>
                      <button
                        className="delete-btn-ghost"
                        onClick={() => deleteTransaction(item._id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No transactions yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="content-secondary">
          <div className="ai-forecast-card">
            <div className="forecast-header">
              <FiZap className="forecast-icon" />
              <h3>AI Spending Forecast</h3>
            </div>
            {loadingForecast ? (
              <div className="forecast-loading">Predicting next week...</div>
            ) : aiForecast && typeof aiForecast === 'object' ? (
              <div className="forecast-content">
                <div className="forecast-stat">
                  <span className="forecast-label">Estimated Next Week</span>
                  <span className="forecast-value">Rs {aiForecast.estimatedNextWeek}</span>
                </div>
                <div className="forecast-stat">
                  <span className="forecast-label">High Risk Category</span>
                  <span className="forecast-value risk">{aiForecast.riskCategory}</span>
                </div>
                <p className="forecast-warning">{aiForecast.warning}</p>
              </div>
            ) : (
              <p className="forecast-msg">{aiForecast || "Add more data for predictions."}</p>
            )}
          </div>

          <div className="today-box">
            <div className="today-header">
              <h3>Today's Activities</h3>
              <span className="today-date">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="today-stats">
              <div className="stat-item">
                <span className="stat-label">Income</span>
                <span className="stat-value plus">+Rs {todayData.income}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Spent</span>
                <span className="stat-value minus">-Rs {todayData.expense}</span>
              </div>
            </div>
          </div>

          <div className="budget-watch-card">
            <div className="budget-watch-header">
              <div className="budget-watch-title">
                <FiTarget className="target-icon" />
                <h3>Daily Budget Watch</h3>
              </div>
              <button className="manage-link" onClick={() => navigate("/budgets")}>Manage</button>
            </div>
            <div className="budget-watch-body">
              {budgetStats.length > 0 ? (
                budgetStats.slice(0, 3).map((item, idx) => {
                  const percent = Math.min((item.current_spent / item.budget_limit) * 100, 100);
                  return (
                    <div key={idx} className="mini-budget-item">
                      <div className="mini-budget-info">
                        <span>{item.category}</span>
                        <span>{Math.round(percent)}%</span>
                      </div>
                      <div className="mini-progress-bg">
                        <div
                          className="mini-progress-fill"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: percent > 90 ? '#ef4444' : percent > 70 ? '#f97316' : '#22c55e'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="no-budget-msg">No budgets set. Click manage to start!</p>
              )}
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-header-row">
              <h2 className="section-title">Monthly Analytics</h2>
              <div className="chart-controls">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="category-filter-select"
                >
                  <option value="All">All Categories</option>
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health">Health</option>
                  <option value="Utilities">Utilities</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="income" radius={[4, 4, 0, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-income-${index}`} fill="#6366f1" />
                    ))}
                  </Bar>
                  <Bar dataKey="expense" radius={[4, 4, 0, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-expense-${index}`} fill="#ef4444" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="daily-insights-section">
            <h2 className="section-title">Daily Spending Insights</h2>
            <div className="insights-card">
              {transactions.filter(t => t.type === 'expense').length > 0 ? (
                transactions
                  .filter(t => t.type === 'expense')
                  .slice(0, 3)
                  .map(item => {
                    const dateObj = new Date(item.created_at);
                    const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
                    const fullDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                    return (
                      <div key={item._id} className="insight-item">
                        <div className="insight-day-box">
                          <span className="day-name">{dayName}</span>
                          <span className="full-date">{fullDate}</span>
                        </div>
                        <div className="insight-divider"></div>
                        <div className="insight-details">
                          <span className="spent-on">Spent Rs {item.amount.toLocaleString()} on <strong>{item.title}</strong></span>
                          <span className="category-tag">{item.category || 'General'}</span>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="no-data">No expense data to analyze.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
