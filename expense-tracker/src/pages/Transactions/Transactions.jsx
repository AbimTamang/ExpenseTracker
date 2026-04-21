import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Transactions.css";

const Transactions = () => {

  const navigate = useNavigate();

  const name = localStorage.getItem("name");

  const token = localStorage.getItem("token");

  const today = new Date().toISOString().split("T")[0];

  const [transactions, setTransactions] = useState([]);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "",
    date: today
  });


  useEffect(() => {

    fetchTransactions();

  }, []);



  const fetchTransactions = async () => {

    try {

      const res = await fetch("http://localhost:5000/api/transactions", {

        headers: {
          Authorization: `Bearer ${token}`
        }

      });

      const data = await res.json();

      setTransactions(data);

    }

    catch {

      console.log("Error loading transactions");

    }

  };



  const handleChange = (e) => {

    setForm({

      ...form,

      [e.target.name]: e.target.value

    });

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    if (parseFloat(form.amount) <= 0) {
      alert("Amount must be a positive number.");
      return;
    }

    await fetch("http://localhost:5000/api/transactions", {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`

      },

      body: JSON.stringify(form)

    });


    setForm({

      title: "",

      amount: "",

      type: "expense",

      category: "",

      date: today

    });


    fetchTransactions();

  };



  return (

    <div className="app">


      {/* SIDEBAR */}


      <aside className="sidebar">

        <h2 className="logo">ExpenseTracker</h2>


        <nav>

          <p onClick={() => navigate("/dashboard")}>Dashboard</p>

          <p className="active">Transactions</p>

          <p onClick={() => navigate("/analytics")}>Analytics</p>

          <p onClick={() => navigate("/wallet")}>Wallet</p>

          <p onClick={() => navigate("/settings")}>Settings</p>

        </nav>


        <div className="profile">

          {name}

        </div>


      </aside>



      {/* MAIN */}


      <main className="main">


        <div className="main-container">


          <div className="card">


            <div className="card-header">

              <h2>Transactions</h2>

              <span>{new Date().toDateString()}</span>

            </div>



            {/* FORM */}


            <form className="form" onSubmit={handleSubmit}>


              <input
                name="title"
                placeholder="Title"
                value={form.title}
                onChange={handleChange}
                required
              />


              <input
                name="amount"
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={handleChange}
                min="0"
                step="any"
                required
              />


              <select
                name="type"
                value={form.type}
                onChange={handleChange}
              >

                <option value="expense">Expense</option>

                <option value="income">Income</option>

              </select>


              <input
                name="category"
                placeholder="Category"
                value={form.category}
                onChange={handleChange}
                required
              />


              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
              />


              <button>Add Transaction</button>


            </form>



            {/* TABLE */}


            <table>


              <thead>

                <tr>

                  <th>Title</th>

                  <th>Amount</th>

                  <th>Type</th>

                  <th>Category</th>

                  <th>Date</th>

                </tr>

              </thead>


              <tbody>

                {transactions.map((t) => (

                  <tr key={t.id}>

                    <td>{t.title}</td>

                    <td className={t.type}>
                      ₹{t.amount}
                    </td>

                    <td>{t.type}</td>

                    <td>{t.category}</td>

                    <td>{t.date?.slice(0,10)}</td>

                  </tr>

                ))}

              </tbody>


            </table>


          </div>


        </div>


      </main>


    </div>

  );

};

export default Transactions;