import React, { useState, useEffect } from "react";
import "./Settings.css";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState(localStorage.getItem("currency") || "Rs");

  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    setFullName(localStorage.getItem("name") || "John Doe");
    setEmail("user@example.com"); // Placeholder for now
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    alert("Profile info saved locally (Database connection coming soon!)");
    localStorage.setItem("name", fullName);
  };

  const handleExportPDF = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/expenses/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success || !data.transactions || data.transactions.length === 0) {
        alert("No transactions found to export.");
        return;
      }

      const transactions = data.transactions;
      const doc = new jsPDF();

      // Add Title
      doc.setFontSize(22);
      doc.setTextColor(40);
      doc.text("Expense Tracker - Financial Report", 14, 22);

      // Add Generation Date
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Calculate Summary
      let totalIncome = 0;
      let totalExpense = 0;
      transactions.forEach(t => {
        if (t.type === 'income') totalIncome += Number(t.amount);
        else totalExpense += Number(t.amount);
      });
      const balance = totalIncome - totalExpense;

      // Summary Box
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Summary", 14, 45);
      
      doc.setFontSize(12);
      doc.text(`Total Income: ${currency} ${totalIncome.toFixed(2)}`, 14, 55);
      doc.text(`Total Expense: ${currency} ${totalExpense.toFixed(2)}`, 14, 63);
      doc.text(`Net Balance: ${currency} ${balance.toFixed(2)}`, 14, 71);

      // Table Data
      const tableColumn = ["Date", "Title", "Category", "Type", "Amount"];
      const tableRows = [];

      transactions.forEach(t => {
        const rowData = [
          new Date(t.created_at).toLocaleDateString(),
          t.title,
          t.category,
          t.type ? t.type.charAt(0).toUpperCase() + t.type.slice(1) : 'Unknown',
          `${currency} ${t.amount}`
        ];
        tableRows.push(rowData);
      });

      // Generate Table using the imported autoTable function
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 85,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10, cellPadding: 3 },
      });

      doc.save("Financial_Report.pdf");
    } catch (err) {
      console.error(err);
      alert("Error generating PDF.");
    }
  };


  const handleExportData = async () => {
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/expenses/export", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        alert("No transactions found to export.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ExpenseTracker_Data.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Error exporting data.");
    }
  };

  const handleResetAccount = async () => {
    if (!window.confirm("WARNING: This will erase all your transactions, investments, and goals. Your login will remain. Proceed?")) return;

    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-data", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        alert("Success: All data has been wiped clean.");
      } else {
        alert("Failed to reset account data.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error processing request.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("DANGER: This will permanently delete your entire account and all data. This cannot be undone. Proceed?")) return;

    try {
      const res = await fetch("http://localhost:5000/api/auth/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        alert("Account permanently deleted.");
        localStorage.clear();
        navigate("/");
      } else {
        alert("Failed to delete account.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error processing request.");
    }
  };

  return (
    <div className="settings-page fade-in">

      {/* HEADER */}
      <div className="page-header">
        <h1>Settings & Preferences</h1>
        <p>Manage your account, preferences, and data security.</p>
      </div>

      <div className="settings-container">

        {/* SIDEBAR NAVIGATION */}
        <div className="settings-sidebar">
          <button
            className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span className="icon">👤</span> Profile Information
          </button>
          <button
            className={`tab-btn ${activeTab === "preferences" ? "active" : ""}`}
            onClick={() => setActiveTab("preferences")}
          >
            <span className="icon">⚙️</span> App Preferences
          </button>
          <button
            className={`tab-btn ${activeTab === "data" ? "active" : ""}`}
            onClick={() => setActiveTab("data")}
          >
            <span className="icon">📊</span> Data Management
          </button>
          <button
            className={`tab-btn ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <span className="icon">🔔</span> Notifications
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="settings-content">

          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <div className="tab-pane slide-up">
              <h2>Profile Information</h2>
              <p className="tab-desc">Update your personal details and how we can reach you.</p>

              <form onSubmit={handleSaveProfile} className="settings-form">
                <div className="input-row">
                  <div className="input-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled // Email often disabled unless verified
                    />
                  </div>
                </div>

                <div className="security-section">
                  <h3>Security</h3>
                  <button type="button" className="btn-secondary">Change Password</button>
                  <p className="helper-text">If you logged in with Google, you cannot change your password here.</p>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: PREFERENCES */}
          {activeTab === "preferences" && (
            <div className="tab-pane slide-up">
              <h2>App Preferences</h2>
              <p className="tab-desc">Customize your Expense Tracker experience.</p>

              <div className="settings-form">
                <div className="input-group">
                  <label>Default Currency</label>
                  <select 
                    value={currency} 
                    onChange={(e) => {
                      const newCurr = e.target.value;
                      setCurrency(newCurr);
                      localStorage.setItem("currency", newCurr);
                      alert("Currency preference saved! Changes will reflect across the app.");
                    }}
                  >
                    <option value="Rs">₨ Rupee (NPR/INR)</option>
                    <option value="$">$ US Dollar (USD)</option>
                    <option value="€">€ Euro (EUR)</option>
                    <option value="£">£ British Pound (GBP)</option>
                  </select>
                  <p className="helper-text">This symbol will be shown across your dashboard and transactions.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATA MANAGEMENT */}
          {activeTab === "data" && (
            <div className="tab-pane slide-up">
              <h2>Data Management</h2>
              <p className="tab-desc">Control your financial data and account existence.</p>

              <div className="data-section">
                <div className="data-row">
                  <div>
                    <h4>Export PDF Report</h4>
                    <p>Download a beautiful, formatted PDF summary of your finances.</p>
                  </div>
                  <button onClick={handleExportPDF} className="btn-primary">Download PDF</button>
                </div>

                <div className="data-row" style={{ marginTop: '16px' }}>
                  <div>
                    <h4>Export CSV Data</h4>
                    <p>Download a raw spreadsheet of all your historical transactions.</p>
                  </div>
                  <button onClick={handleExportData} className="btn-secondary">Download CSV</button>
                </div>

                <div className="danger-zone">
                  <h4>Danger Zone</h4>
                  <div className="danger-row">
                    <div>
                      <h5>Reset Account</h5>
                      <p>Wipe all transactions and goals, but keep your login.</p>
                    </div>
                    <button onClick={handleResetAccount} className="btn-danger-outline">Erase Data</button>
                  </div>
                  <div className="danger-row">
                    <div>
                      <h5>Delete Account</h5>
                      <p>Permanently remove your account and all associated data.</p>
                    </div>
                    <button onClick={handleDeleteAccount} className="btn-danger">Delete Account</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="tab-pane slide-up">
              <h2>Notifications</h2>
              <p className="tab-desc">Choose what updates you want to receive.</p>

              <div className="toggle-list">
                <label className="toggle-row">
                  <div className="toggle-text">
                    <h4>Weekly Summaries</h4>
                    <p>Receive an email every Monday breaking down last week's spending.</p>
                  </div>
                  <input type="checkbox" className="toggle-switch" defaultChecked />
                </label>

                <label className="toggle-row">
                  <div className="toggle-text">
                    <h4>Goal Alerts</h4>
                    <p>Notify me when I hit 50% or 100% of my Saving Goals.</p>
                  </div>
                  <input type="checkbox" className="toggle-switch" defaultChecked />
                </label>

                <label className="toggle-row">
                  <div className="toggle-text">
                    <h4>New Login Alerts</h4>
                    <p>Send an email when my account is logged into from a new device.</p>
                  </div>
                  <input type="checkbox" className="toggle-switch" />
                </label>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;