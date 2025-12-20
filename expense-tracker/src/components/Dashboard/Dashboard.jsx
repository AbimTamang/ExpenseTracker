import React from "react";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">Expense Tracker</h2>
        <nav>
          <a className="active">Dashboard</a>
          <a>Transactions</a>
          <a>Wallet</a>
          <a>Analytics</a>
          <a>Settings</a>
        </nav>
        <div className="profile">
          <div className="avatar"></div>
          <span>Alex Magar</span>
        </div>
      </aside>

  {/* Main Content */}
<main className="main">
  <div className="main-container">

    <header className="header">
      <div>
        <h1>Hello, Alex</h1>
        <p>Here is your financial overview for Dec, 2025</p>
      </div>
      <button className="btn">Add Transaction</button>
    </header>

    {/* Cards */}
    <section className="cards">
      <div className="card green">
        <p>Total Income</p>
        <h3>Rs 4,250.00</h3>
        <span>+8.5%</span>
      </div>
      <div className="card red">
        <p>Total Expenses</p>
        <h3>Rs 1,200.50</h3>
        <span>-2.1%</span>
      </div>
      <div className="card blue">
        <p>Savings</p>
        <h3>Rs 12,500.00</h3>
        <span>+5.4%</span>
      </div>
    </section>

    {/* Content Row */}
    <section className="content">
      <div className="chart">
        <h3>Income vs Saving</h3>
        <div className="chart-box">Chart Placeholder</div>
      </div>

      <div className="transactions">
        <h3>Recent Transactions</h3>
        <ul>
          <li><span>Grocery Store</span><span className="neg">-Rs 120.50</span></li>
          <li><span>Freelance Payment</span><span className="pos">+Rs 850.00</span></li>
          <li><span>Netflix Sub</span><span className="neg">-Rs 15.99</span></li>
          <li><span>Gym Membership</span><span className="neg">-Rs 45.00</span></li>
        </ul>
      </div>
    </section>

  </div>
</main>
</div> 
);
};
export default Dashboard;