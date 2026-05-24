import { apiUrl } from "../../config/api";
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
  FiTarget,
  FiAward,
  FiLock,
  FiUnlock,
  FiShield,
  FiDollarSign
} from "react-icons/fi";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "User";
  const token = localStorage.getItem("token");
  const currency = localStorage.getItem("currency") || "Rs";

  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    balance: 0
  });

  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [budgetStats, setBudgetStats] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");
  const [aiInsights, setAiInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

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

  // FETCH SUMMARY
  const fetchSummary = async () => {
    try {
      const res = await fetch(apiUrl(`/expenses/summary`), {
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
      const res = await fetch(apiUrl(`/expenses/list`), {
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



  const fetchBudgetStats = async () => {
    try {
      const res = await fetch(apiUrl(`/budgets/stats`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setBudgetStats(data.stats);
    } catch (err) {
      console.error("Error fetching budget stats:", err);
    }
  };

  const fetchInsights = async () => {
    try {
      setLoadingInsights(true);
      const res = await fetch(apiUrl(`/expenses/insights`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAiInsights(data.insights);
      }
    } catch (err) {
      console.error("Error fetching AI insights:", err);
    } finally {
      setLoadingInsights(false);
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
    fetchBudgetStats();
    fetchInsights();
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
      await fetch(apiUrl(`/expenses/delete/${id}`), {
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

  const calculateAchievements = () => {
    const allAchievements = [
      {
        id: "first_blood",
        title: "First Blood",
        desc: "Log your first transaction",
        icon: FiTarget,
        color: "#f43f5e",
        unlocked: false
      },
      {
        id: "centurion",
        title: "Active Tracker",
        desc: "Log 10+ transactions",
        icon: FiZap,
        color: "#f59e0b",
        unlocked: false
      },
      {
        id: "big_earner",
        title: "Big Earner",
        desc: "Log an income over 10,000",
        icon: FiDollarSign,
        color: "#10b981",
        unlocked: false
      },
      {
        id: "budget_master",
        title: "Budget Master",
        desc: "Stay under all active budgets",
        icon: FiShield,
        color: "#4f46e5",
        unlocked: false
      }
    ];

    if (transactions.length > 0) allAchievements[0].unlocked = true;
    if (transactions.length >= 10) allAchievements[1].unlocked = true;
    if (transactions.some(t => t.type === 'income' && t.amount >= 10000)) allAchievements[2].unlocked = true;
    if (budgetStats.length > 0 && budgetStats.every(b => (b.current_spent / b.budget_limit) < 1)) allAchievements[3].unlocked = true;

    return allAchievements;
  };

  const achievements = calculateAchievements();
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="dashboard-content">
      <header className="header">
        <div className="greeting">
          <h1>Hello, {name}</h1>
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
              <div className="card-value">{currency} {Number(summary.balance).toLocaleString()}</div>
              <div className="card-footer positive">
                <FiArrowUpRight /> <span>+2.5% from last month</span>
              </div>
            </div>

            <div className="card income">
              <div className="card-header">
                <span className="card-label">Overall Income</span>
                <div className="card-icon"><FiArrowUpRight /></div>
              </div>
              <div className="card-value">{currency} {Number(summary.income).toLocaleString()}</div>
            </div>

            <div className="card expense">
              <div className="card-header">
                <span className="card-label">Overall Expense</span>
                <div className="card-icon"><FiArrowDownLeft /></div>
              </div>
              <div className="card-value">{currency} {Number(summary.expense).toLocaleString()}</div>
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
                <span className="lookup-stat-value">{currency} {lookupResults.total.toLocaleString()}</span>
              </div>

              <div className="lookup-items">
                {lookupResults.items.length > 0 ? (
                  lookupResults.items.map(item => (
                    <div key={item._id} className="lookup-item">
                      <span className="item-name">{item.title}</span>
                      <span className="item-price">{currency} {Number(item.amount).toLocaleString()}</span>
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
                        {item.type === 'income' ? '+' : '-'} {currency} {Number(item.amount).toLocaleString()}
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

          <div className="achievements-card glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            <div className="achievements-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiAward style={{ fontSize: '22px', color: '#eab308' }} /> Your Achievements
              </h3>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{unlockedCount}/{achievements.length} Unlocked</span>
            </div>
            <div className="achievements-list" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {achievements.map(ach => (
                <div key={ach.id} className="achievement-badge" style={{ 
                    background: ach.unlocked ? 'var(--input-bg)' : 'rgba(15, 23, 42, 0.05)', 
                    padding: '12px 16px', 
                    borderRadius: '16px', 
                    display: 'flex', 
                    gap: '14px', 
                    alignItems: 'center', 
                    border: ach.unlocked ? '1px solid var(--border-color)' : '1px dashed var(--border-color)', 
                    opacity: ach.unlocked ? 1 : 0.6,
                    transition: 'all 0.3s' 
                }}>
                  <div className="ach-icon" style={{ 
                      fontSize: '22px', 
                      background: ach.unlocked ? 'var(--bg-card)' : 'transparent', 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      boxShadow: ach.unlocked ? `0 4px 10px ${ach.color}33` : 'none', 
                      flexShrink: 0, 
                      filter: ach.unlocked ? 'none' : 'grayscale(100%)' 
                  }}>
                    {ach.unlocked ? <ach.icon size={22} style={{ color: ach.color }} /> : <FiLock size={22} />}
                  </div>
                  <div className="ach-info">
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: ach.unlocked ? 'var(--text-main)' : 'var(--text-muted)', marginBottom: '2px' }}>{ach.title}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="today-box glass-card">
            <div className="today-header">
              <h3>Today's Activities</h3>
              <span className="today-date">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="today-stats">
              <div className="stat-item">
                <span className="stat-label">Income</span>
                <span className="stat-value plus">+{currency} {Number(todayData.income).toLocaleString()}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Spent</span>
                <span className="stat-value minus">-{currency} {Number(todayData.expense).toLocaleString()}</span>
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

          <div className="ai-advisor-card glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px', background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div className="ai-advisor-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiCpu style={{ fontSize: '24px', color: '#6366f1' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', background: 'linear-gradient(90deg, #6366f1, #10b981)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                AI Financial Advisor
              </h3>
            </div>
            <div className="ai-advisor-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingInsights ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Analyzing your spending patterns...</p>
              ) : aiInsights.length > 0 ? (
                aiInsights.map((insight, idx) => (
                  <div key={idx} className="insight-bubble" style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    color: 'var(--text-main)',
                    lineHeight: '1.5',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}>
                    {insight}
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No insights available yet.</p>
              )}
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
                          <span className="spent-on">Spent {currency} {item.amount.toLocaleString()} on <strong>{item.title}</strong></span>
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
