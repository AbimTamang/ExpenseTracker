import { apiUrl } from "../../config/api";
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiUploadCloud,
    FiCheckCircle,
    FiXCircle,
    FiArrowDownLeft,
    FiArrowUpRight,
    FiTrash2,
    FiDownload,
    FiEdit3,
    FiLoader
} from "react-icons/fi";
import "./ImportStatement.css";

const ImportStatement = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [walletType, setWalletType] = useState("esewa");
    const [bankName, setBankName] = useState("");
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [parsedTransactions, setParsedTransactions] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [parseError, setParseError] = useState("");
    const [importSuccess, setImportSuccess] = useState(null);

    const token = localStorage.getItem("token");
    const currency = localStorage.getItem("currency") || "Rs";

    // Drag & drop handlers
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        const validTypes = ['.pdf', '.xls', '.xlsx', '.csv'];
        const ext = droppedFile?.name?.toLowerCase().match(/\.[^.]+$/)?.[0];
        if (droppedFile && validTypes.includes(ext)) {
            setFile(droppedFile);
            setParseError("");
            setParsedTransactions([]);
            setImportSuccess(null);
        } else {
            setParseError("Please drop a PDF, XLS, XLSX, or CSV file.");
        }
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setParseError("");
            setParsedTransactions([]);
            setImportSuccess(null);
        }
    };

    // Parse the uploaded PDF
    const handleParse = async () => {
        if (!file) return;
        setIsParsing(true);
        setParseError("");
        setImportSuccess(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(apiUrl(`/expenses/parse-wallet-statement`), {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();

            if (data.success && data.transactions.length > 0) {
                // Add a wallet source tag to each transaction title
                const tagged = data.transactions.map((t, i) => ({
                    ...t,
                    id: `parsed_${i}`,
                    title: t.title || "Unknown Transaction",
                    source: walletType === 'bank' ? (bankName.trim() || 'Bank') : walletType
                }));
                setParsedTransactions(tagged);
                setSelectedItems(new Set(tagged.map(t => t.id)));
            } else if (data.success && data.transactions.length === 0) {
                setParseError("No transactions found in this PDF. Make sure it's a valid eSewa/Khalti statement.");
            } else {
                setParseError(data.message || "Failed to parse statement.");
            }
        } catch (err) {
            console.error(err);
            setParseError("Could not connect to the server. Make sure both servers are running.");
        } finally {
            setIsParsing(false);
        }
    };

    // Toggle selection
    const toggleItem = (id) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const toggleAll = () => {
        if (selectedItems.size === parsedTransactions.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(parsedTransactions.map(t => t.id)));
        }
    };

    // Remove a parsed transaction from the list
    const removeItem = (id) => {
        setParsedTransactions(prev => prev.filter(t => t.id !== id));
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    // Import selected transactions into the database
    const handleImport = async () => {
        const toImport = parsedTransactions.filter(t => selectedItems.has(t.id));
        if (toImport.length === 0) return;

        setIsImporting(true);
        try {
            const res = await fetch(apiUrl(`/expenses/import-bulk`), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    transactions: toImport.map(t => {
                        let prefix = t.source === 'esewa' ? 'eSewa' : t.source === 'khalti' ? 'Khalti' : t.source;
                        return {
                            title: `[${prefix}] ${t.title}`,
                            amount: t.amount,
                            type: t.type,
                            category: t.category,
                            date: t.date
                        };
                    })
                })
            });

            const data = await res.json();
            if (data.success) {
                let successMsg = `Successfully imported ${data.imported} transactions!`;
                if (data.skipped && data.skipped > 0) {
                    successMsg += ` (${data.skipped} duplicates skipped)`;
                }
                setImportSuccess(successMsg);
                setParsedTransactions([]);
                setSelectedItems(new Set());
                setFile(null);
            }
        } catch (err) {
            console.error(err);
            setParseError("Failed to import transactions.");
        } finally {
            setIsImporting(false);
        }
    };

    const totalExpense = parsedTransactions
        .filter(t => selectedItems.has(t.id) && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
    const totalIncome = parsedTransactions
        .filter(t => selectedItems.has(t.id) && t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);

    return (
        <div className="import-page">
            <header className="page-header">
                <div className="header-info">
                    <h1><FiDownload style={{marginRight: '10px'}}/> Import Statement</h1>
                    <p>Upload your eSewa, Khalti, or Bank statement to auto-import transactions. (PDF, XLS, XLSX, CSV)</p>
                </div>
            </header>

            {/* Wallet Type Selector */}
            <div className="wallet-selector">
                <button
                    className={`wallet-option ${walletType === 'esewa' ? 'active esewa' : ''}`}
                    onClick={() => setWalletType('esewa')}
                >
                    <div className="wallet-logo esewa-logo">e</div>
                    <span>eSewa</span>
                </button>
                <button
                    className={`wallet-option ${walletType === 'khalti' ? 'active khalti' : ''}`}
                    onClick={() => setWalletType('khalti')}
                >
                    <div className="wallet-logo khalti-logo">K</div>
                    <span>Khalti</span>
                </button>
                <button
                    className={`wallet-option ${walletType === 'bank' ? 'active' : ''}`}
                    onClick={() => setWalletType('bank')}
                    style={walletType === 'bank' ? {backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.4)'} : {}}
                >
                    <div className="wallet-logo" style={{backgroundColor: '#555', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>B</div>
                    <span>Bank</span>
                </button>
            </div>

            {walletType === 'bank' && (
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <input 
                        type="text" 
                        placeholder="Enter Bank Name (e.g., Nabil Bank)" 
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        style={{ 
                            padding: '12px 20px', 
                            width: '300px', 
                            borderRadius: '12px', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            fontSize: '1rem',
                            outline: 'none',
                            backdropFilter: 'blur(10px)'
                        }}
                    />
                </div>
            )}

            {/* Drop Zone */}
            <div
                className={`drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.xls,.xlsx,.csv"
                    onChange={handleFileSelect}
                    hidden
                />
                {file ? (
                    <div className="file-preview">
                        <FiCheckCircle className="file-ok-icon" />
                        <p className="file-name">{file.name}</p>
                        <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
                        <button className="change-file-btn" onClick={(e) => { e.stopPropagation(); setFile(null); setParsedTransactions([]); }}>
                            Change File
                        </button>
                    </div>
                ) : (
                    <div className="drop-placeholder">
                        <FiUploadCloud className="upload-icon" />
                        <p>Drag & drop your <strong>{walletType === 'esewa' ? 'eSewa' : walletType === 'khalti' ? 'Khalti' : 'Bank'}</strong> statement here</p>
                        <span>Supports PDF, XLS, XLSX, CSV</span>
                    </div>
                )}
            </div>

            {/* Parse Button */}
            {file && parsedTransactions.length === 0 && (
                <button className="parse-btn" onClick={handleParse} disabled={isParsing}>
                    {isParsing ? (
                        <><FiLoader className="spin" /> Analyzing Statement...</>
                    ) : (
                        <><FiEdit3 /> Scan & Extract Transactions</>
                    )}
                </button>
            )}

            {/* Error */}
            {parseError && (
                <div className="parse-error">
                    <FiXCircle /> {parseError}
                </div>
            )}

            {/* Success */}
            {importSuccess && (
                <div className="import-success">
                    <FiCheckCircle /> {importSuccess}
                    <button onClick={() => navigate('/transactions')}>View Transactions →</button>
                </div>
            )}

            {/* Parsed Transactions Preview */}
            {parsedTransactions.length > 0 && (
                <div className="parsed-results">
                    <div className="parsed-header">
                        <h2>Extracted Transactions ({parsedTransactions.length})</h2>
                        <div className="parsed-actions">
                            <button className="select-all-btn" onClick={toggleAll}>
                                {selectedItems.size === parsedTransactions.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                    </div>

                    <div className="parsed-summary-bar">
                        <div className="summary-chip expense">
                            <FiArrowDownLeft /> Expenses: {currency} {totalExpense.toLocaleString()}
                        </div>
                        <div className="summary-chip income">
                            <FiArrowUpRight /> Income: {currency} {totalIncome.toLocaleString()}
                        </div>
                        <div className="summary-chip selected">
                            Selected: {selectedItems.size} / {parsedTransactions.length}
                        </div>
                    </div>

                    <div className="parsed-list">
                        {parsedTransactions.map(item => (
                            <div
                                key={item.id}
                                className={`parsed-item ${item.type} ${selectedItems.has(item.id) ? 'selected' : 'deselected'}`}
                                onClick={() => toggleItem(item.id)}
                            >
                                <div className="parsed-check">
                                    <input type="checkbox" checked={selectedItems.has(item.id)} readOnly />
                                </div>
                                <div className="parsed-icon">
                                    {item.type === 'income' ? <FiArrowUpRight /> : <FiArrowDownLeft />}
                                </div>
                                <div className="parsed-info">
                                    <h4>{item.title}</h4>
                                    <div className="parsed-meta">
                                        <span className="cat-badge">{item.category}</span>
                                        <span>{item.date}</span>
                                    </div>
                                </div>
                                <div className={`parsed-amount ${item.type}`}>
                                    {item.type === 'income' ? '+' : '-'}{currency} {item.amount.toLocaleString()}
                                </div>
                                <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}>
                                    <FiTrash2 />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        className="import-btn"
                        onClick={handleImport}
                        disabled={isImporting || selectedItems.size === 0}
                    >
                        {isImporting ? (
                            <><FiLoader className="spin" /> Importing...</>
                        ) : (
                            <><FiDownload /> Import {selectedItems.size} Transaction{selectedItems.size !== 1 ? 's' : ''} to Fintrack</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImportStatement;
