import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import { FiCalendar, FiArrowDownLeft, FiArrowUpRight, FiFilter } from "react-icons/fi";
import "react-calendar/dist/Calendar.css";
import "./CalendarApp.css";

const CalendarApp = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [filterType, setFilterType] = useState("all");

    const token = localStorage.getItem("token");
    const currency = localStorage.getItem("currency") || "Rs";

    const fetchTransactions = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/expenses/list`, {
                headers: { Authorization: `Bearer ${token}` },
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

    // Get date string helper: YYYY-MM-DD
    const getDateString = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Group transactions by date string
    const transactionsByDate = transactions.reduce((acc, curr) => {
        // Use 'date' if available, otherwise fallback to 'created_at'
        const dateStr = getDateString(curr.date || curr.created_at);
        if (!acc[dateStr]) acc[dateStr] = { expense: 0, income: 0, items: [] };
        
        acc[dateStr].items.push(curr);
        if (curr.type === 'expense') acc[dateStr].expense += parseFloat(curr.amount);
        if (curr.type === 'income') acc[dateStr].income += parseFloat(curr.amount);
        
        return acc;
    }, {});

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = getDateString(date);
            const dayData = transactionsByDate[dateStr];
            
            if (dayData) {
                return (
                    <div className="calendar-tile-content">
                        {dayData.expense > 0 && filterType !== 'income' && (
                            <div className="tile-badge expense">
                                -{currency}{dayData.expense.toLocaleString()}
                            </div>
                        )}
                        {dayData.income > 0 && filterType !== 'expense' && (
                            <div className="tile-badge income">
                                +{currency}{dayData.income.toLocaleString()}
                            </div>
                        )}
                    </div>
                );
            }
        }
        return null;
    };

    // Get selected day transactions
    const selectedDateStr = getDateString(selectedDate);
    const selectedDayData = transactionsByDate[selectedDateStr] || { items: [], expense: 0, income: 0 };
    
    // Filter items based on filterType
    const displayedItems = filterType === 'all' 
        ? selectedDayData.items 
        : selectedDayData.items.filter(item => item.type === filterType);

    return (
        <div className="calendar-page">
            <header className="page-header">
                <div className="header-info">
                    <h1><FiCalendar style={{marginRight: '10px'}}/> Calendar View</h1>
                    <p>Track your daily spending and income patterns over time.</p>
                </div>
            </header>

            <div className="calendar-container">
                <div className="calendar-wrapper-card">
                    <div className="calendar-controls">
                        <div className="filter-group">
                            <button 
                                className={`cal-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                                onClick={() => setFilterType('all')}
                            >
                                All
                            </button>
                            <button 
                                className={`cal-filter-btn ${filterType === 'expense' ? 'active' : ''}`}
                                onClick={() => setFilterType('expense')}
                            >
                                Expenses
                            </button>
                            <button 
                                className={`cal-filter-btn ${filterType === 'income' ? 'active' : ''}`}
                                onClick={() => setFilterType('income')}
                            >
                                Income
                            </button>
                        </div>
                    </div>
                    <div className="actual-calendar">
                        <Calendar 
                            onChange={setSelectedDate} 
                            value={selectedDate} 
                            tileContent={tileContent}
                            className="glass-calendar"
                        />
                    </div>
                </div>

                <div className="day-details-card">
                    <div className="day-details-header">
                        <h2>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                        <div className="day-summary">
                            <span className="summary-item expense">
                                <FiArrowDownLeft /> {currency} {selectedDayData.expense.toLocaleString()}
                            </span>
                            <span className="summary-item income">
                                <FiArrowUpRight /> {currency} {selectedDayData.income.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="day-transactions-list">
                        {displayedItems.length === 0 ? (
                            <div className="no-events">
                                <p>No transactions on this day.</p>
                            </div>
                        ) : (
                            displayedItems.map(item => (
                                <div key={item.id} className={`cal-item-card ${item.type}`}>
                                    <div className="cal-item-icon">
                                        {item.type === 'income' ? <FiArrowUpRight /> : <FiArrowDownLeft />}
                                    </div>
                                    <div className="cal-item-info">
                                        <h4>{item.title}</h4>
                                        <span>{item.category}</span>
                                    </div>
                                    <div className={`cal-item-amount ${item.type}`}>
                                        {item.type === 'income' ? '+' : '-'}{currency}{Number(item.amount).toLocaleString()}
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

export default CalendarApp;
