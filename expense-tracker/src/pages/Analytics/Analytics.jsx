import React, { useEffect, useState } from "react";
import "./Analytics.css";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend as PieLegend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as AreaTooltip, Legend as AreaLegend
} from "recharts";

const Analytics = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // State
  const [transactions, setTransactions] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [period, setPeriod] = useState("month"); // 'month', 'year', 'all'
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!token) return;
    fetch("http://localhost:5000/api/expenses/list", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setTransactions(result.transactions || []);
        }
      });
  }, [token]);

  // Process data for charts
  useEffect(() => {
    if (!transactions.length) return;

    // Filter by period
    const now = new Date();
    let filteredTransactions = transactions;

    if (period === "month") {
      filteredTransactions = transactions.filter(t => {
        const d = new Date(t.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (period === "year") {
      filteredTransactions = transactions.filter(t => {
        const d = new Date(t.created_at);
        return d.getFullYear() === now.getFullYear();
      });
    }

    // Process Pie Data (Income vs Expense)
    const income = filteredTransactions.filter(i => i.type === "income").reduce((a, b) => a + Number(b.amount), 0);
    const expense = filteredTransactions.filter(i => i.type === "expense").reduce((a, b) => a + Number(b.amount), 0);

    setPieData([
      { name: "Income", value: income },
      { name: "Expense", value: expense }
    ]);

    // Process Area Data (Live Time Series)
    const grouped = {};
    const sorted = [...filteredTransactions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    sorted.forEach(t => {
      const d = new Date(t.created_at);
      let key = "";
      if (period === "year") {
        key = d.toLocaleString('default', { month: 'short' });
      } else {
        key = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
      }
      if (!grouped[key]) grouped[key] = { name: key, income: 0, expense: 0 };
      if (t.type === "income") grouped[key].income += Number(t.amount);
      if (t.type === "expense") grouped[key].expense += Number(t.amount);
    });

    setAreaData(Object.values(grouped));
  }, [transactions, period]);

  const COLORS = ["#10b981", "#ef4444"];

  return (
    <div className="analytics-page">
      <div className="header-section">
        <h1>Financial Analytics</h1>
        <p>Insights into your financial activities.</p>

        <div className="period-filters">
          <button className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>This Month</button>
          <button className={period === "year" ? "active" : ""} onClick={() => setPeriod("year")}>This Year</button>
          <button className={period === "all" ? "active" : ""} onClick={() => setPeriod("all")}>All Time</button>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card wide">
          <h3>Cash Flow Trends</h3>
          <p className="subtitle">Visualizing trends over time</p>

          <div className="chart-wrapper">
            {areaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `Rs ${value}`} />
                  <AreaTooltip
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                  />
                  <AreaLegend />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">Not enough data to display trend</div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Distribution Ratio</h3>
          <p className="subtitle">Income vs Expense ratio</p>

          <div className="chart-wrapper flex-center">
            {pieData[0]?.value > 0 || pieData[1]?.value > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <PieTooltip
                    formatter={(value) => `Rs ${value}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                  />
                  <PieLegend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">No transactions in this period</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;