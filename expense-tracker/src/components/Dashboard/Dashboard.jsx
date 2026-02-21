import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

import "./Dashboard.css";

const Dashboard = () => {

  const navigate = useNavigate();

  const name = localStorage.getItem("name");
  const token = localStorage.getItem("token");


  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    balance: 0
  });

  const [transactions, setTransactions] = useState([]);

  const [chartData, setChartData] = useState([]);



  // FETCH SUMMARY

  const fetchSummary = async () => {

    const res = await fetch(
      "http://localhost:5000/api/expenses/summary",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (data.success) {

      setSummary(data.summary);

    }

  };



  // FETCH TRANSACTIONS

  const fetchTransactions = async () => {

    const res = await fetch(
      "http://localhost:5000/api/expenses/list",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (data.success) {

      setTransactions(data.transactions);

      prepareChart(data.transactions);

    }

  };



  // CHART DATA

  const prepareChart = (data) => {

    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    let result = months.map(month => ({
      month,
      income: 0,
      expense: 0
    }));


    data.forEach(item => {

      const date = new Date(item.created_at);

      const monthIndex = date.getMonth();

      if (item.type === "income") {

        result[monthIndex].income += Number(item.amount);

      }

      else {

        result[monthIndex].expense += Number(item.amount);

      }

    });

    setChartData(result);

  };




  useEffect(() => {

    if (!token) {

      navigate("/");
      return;

    }

    fetchSummary();
    fetchTransactions();

  }, []);




  // DELETE

  const deleteTransaction = async (id) => {

    await fetch(
      `http://localhost:5000/api/expenses/delete/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    fetchSummary();
    fetchTransactions();

  };



  // LOGOUT

  const logout = () => {

    localStorage.clear();

    navigate("/");

  };




  return (

    <div className="dashboard">



      {/* SIDEBAR */}

      <div className="sidebar">


        <div>

          <h2>ExpenseTracker</h2>

          <p onClick={() => navigate("/dashboard")}>
            Dashboard
          </p>

          <p onClick={() => navigate("/transactions")}>
            Transactions
          </p>

          <p onClick={() => navigate("/analytics")}>
            Analytics
          </p>

          <p onClick={() => navigate("/wallet")}>
            Wallet
          </p>

          <p onClick={() => navigate("/settings")}>
            Settings
          </p>

        </div>



        <button
          className="logout-btn"
          onClick={logout}
        >
          Logout
        </button>



      </div>





      {/* MAIN */}

      <div className="main">



        {/* HEADER */}

        <div className="header">

          <h1>Hello, {name}</h1>

          <button
            className="add-btn"
            onClick={() => navigate("/transactions")}
          >

            + Add Transaction

          </button>

        </div>




        {/* CARDS */}

        <div className="cards">


          <div className="card income">

            <h3>Income</h3>

            <p>₹ {summary.income}</p>

          </div>


          <div className="card expense">

            <h3>Expense</h3>

            <p>₹ {summary.expense}</p>

          </div>


          <div className="card balance">

            <h3>Balance</h3>

            <p>₹ {summary.balance}</p>

          </div>


        </div>




        {/* CHART */}

        <div className="chart">

          <h3>Monthly Overview</h3>


          <ResponsiveContainer width="100%" height={300}>


            <BarChart data={chartData}>


              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Legend />



              <Bar
                dataKey="income"
                fill="#00c896"
              />


              <Bar
                dataKey="expense"
                fill="#ff4d4d"
              />


            </BarChart>


          </ResponsiveContainer>


        </div>




        {/* RECENT */}

        <div className="recent">

          <h3>Recent Transactions</h3>


          {

            transactions.slice(0,5).map(item => (

              <div
                key={item.id}
                className="transaction"
              >

                <span>

                  {item.title}

                </span>


                <span>

                  ₹ {item.amount}

                </span>


                <button
                  onClick={() =>
                    deleteTransaction(item.id)
                  }
                >

                  Delete

                </button>


              </div>

            ))

          }


        </div>



      </div>


    </div>

  );

};

export default Dashboard;