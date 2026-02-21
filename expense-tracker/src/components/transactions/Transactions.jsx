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


  const token = localStorage.getItem("token");


  // ✅ FETCH TRANSACTIONS
  const fetchTransactions = async () => {

    const res = await fetch(
      "http://localhost:5000/api/expenses",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (data.success) {
      setTransactions(data.data);
    }

  };


  useEffect(() => {

    fetchTransactions();

  }, []);




  // ✅ ADD TRANSACTION
  const handleAdd = async (e) => {

    e.preventDefault();

    const res = await fetch(
      "http://localhost:5000/api/expenses/add",
      {
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

      }
    );

    const data = await res.json();

    if (data.success) {

      setTitle("");
      setAmount("");

      fetchTransactions();

    }

  };



  // ✅ DELETE
  const handleDelete = async (id) => {

    await fetch(
      `http://localhost:5000/api/expenses/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    fetchTransactions();

  };



  return (

    <div className="transactions-page">


      <div className="top-bar">

        <button
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

        <h1>Transactions</h1>

      </div>



      {/* ADD CARD */}

      <form className="add-card" onSubmit={handleAdd}>

        <h2>Add Transaction</h2>


        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />


        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />


        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
        >

          <option value="expense">Expense</option>
          <option value="income">Income</option>

        </select>



        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />



        <button type="submit">

          Add

        </button>

      </form>




      {/* LIST */}

      <div className="list">

        {

          transactions.map((item) => (

            <div
              key={item.id}
              className="transaction-card"
            >


              <div>

                <h3>{item.title}</h3>

                <p>{item.category}</p>

                <small>

                  {
                    new Date(
                      item.created_at
                    ).toLocaleString()
                  }

                </small>

              </div>



              <div className="right">

                <h3
                  className={
                    item.type === "income"
                      ? "income"
                      : "expense"
                  }
                >

                  Rs {item.amount}

                </h3>



                <button
                  onClick={() =>
                    handleDelete(item.id)
                  }
                >

                  Delete

                </button>


              </div>


            </div>

          ))

        }

      </div>


    </div>

  );

};


export default Transactions;