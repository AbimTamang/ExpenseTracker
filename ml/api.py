from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import joblib
import os
import re
import pdfplumber
import io
from typing import List
from sklearn.ensemble import IsolationForest
import datetime
import pandas as pd

# Get the absolute path to the directory containing this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "expense_model.pkl")

app = FastAPI()

class ExpenseInput(BaseModel):
    text: str

class TransactionItem(BaseModel):
    amount: float
    category: str
    date: str
    title: str

class InsightsInput(BaseModel):
    transactions: List[TransactionItem]

# Hard keyword rules — always override the ML model
KEYWORD_RULES = [
    (["purchased", "buy ", "bought", "purchase of"], "Shopping"),
    (["rent", "housing", "apartment", "landlord"], "Housing/Rent"),
    (["pathao", "indrive", "uber", "bus ticket", "taxi", "fuel", "petrol", "ride", "bike", "maintenance", "repair", "car", "scooter", "flight"], "Transportation"),
    (["momo", "pizza", "burger", "coffee", "restaurant", "tea", "dal bhat", "chowmein", "food", "bakery", "cafe", "canteen", "khaja", "chiya"], "Food & Drinks"),
    (["medicine", "hospital", "doctor", "pharmacy", "clinic", "medical"], "Healthcare"),
    (["salary", "freelance", "freelancing", "bonus", "client payment", "office", "income", "commission", "profit", "wage", "stipend", "payroll"], "Salary/Income"),
    (["netflix", "spotify", "movie ticket", "games", "cinema", "entertainment", "youtube premium"], "Entertainment"),
    (["topup", "recharge", "ntc", "ncell", "namaste", "smart cell", "bill", "utility", "electricity", "water", "internet", "wifi", "nea", "khanepani", "worldlink", "vianet", "subisu"], "Utilities"),
    (["insurance", "premium"], "Insurance"),
    (["atm", "cash withdrawal"], "Cash Withdrawal"),
    (["fund transfer", "money transfer", "bank transfer", "direct debit", "remittance", "transferred to", "transferred from", "transferred by"], "Bank Transfer"),
    (["paid for", "payment to", "merchant"], "Shopping"),
    (["deposit", "load fund", "cash in", "load money", "money from"], "Deposit/Load"),
]

def keyword_match(text: str):
    t = text.lower()
    for keywords, category in KEYWORD_RULES:
        if any(kw in t for kw in keywords):
            return category
    return None

@app.get("/")
def home():
    return {"message": "AI API running"}

@app.post("/predict")
def predict(data: ExpenseInput):
    # 1. Try hard keyword rules first (100% reliable)
    result = keyword_match(data.text)
    if result:
        return {"category": result}

    # 2. Fall back to ML model for anything not matched by rules
    model = joblib.load(model_path)
    prediction = model.predict([data.text])[0]
    return {"category": prediction}

@app.post("/parse_statement")
async def parse_statement(file: UploadFile = File(...)):
    filename = file.filename.lower()
    supported = filename.endswith(".pdf") or filename.endswith(".xls") or filename.endswith(".xlsx") or filename.endswith(".csv")
    
    if not supported:
        return {"success": False, "message": "Supported formats: PDF, XLS, XLSX, CSV"}
        
    try:
        content = await file.read()
        transactions = []
        
        # ===== EXCEL FILES (.xls / .xlsx) =====
        if filename.endswith(".xls") or filename.endswith(".xlsx"):
            import xlrd
            import openpyxl
            
            all_rows = []
            
            if filename.endswith(".xls"):
                workbook = xlrd.open_workbook(file_contents=content)
                sheet = workbook.sheet_by_index(0)
                for row_idx in range(sheet.nrows):
                    row = [str(sheet.cell_value(row_idx, col)).strip() for col in range(sheet.ncols)]
                    all_rows.append(row)
            else:
                wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True)
                ws = wb.active
                for row in ws.iter_rows(values_only=True):
                    row = [str(cell).strip() if cell is not None else "" for cell in row]
                    all_rows.append(row)
            
            # === AUTO-DETECT THE HEADER ROW ===
            # Scan rows to find the one that looks like column headers
            # eSewa puts metadata in rows 0-7 and headers in row 8
            header_row_idx = None
            HEADER_KEYWORDS = ["date", "description", "particular", "remark", "narration",
                               "dr.", "cr.", "debit", "credit", "amount", "status", "reference"]
            
            for idx, row in enumerate(all_rows):
                row_lower = [cell.lower().strip() for cell in row]
                # Count how many header keywords appear in this row
                matches = sum(1 for cell in row_lower for kw in HEADER_KEYWORDS if kw in cell)
                if matches >= 3:  # At least 3 header-like words = this is the header row
                    header_row_idx = idx
                    break
            
            if header_row_idx is None:
                # Fallback: assume row 0 is header
                header_row_idx = 0
            
            headers = [h.lower().strip() for h in all_rows[header_row_idx]]
            rows_data = all_rows[header_row_idx + 1:]  # Data starts AFTER headers
            
            print(f"[Parser] Header row detected at index: {header_row_idx}")
            print(f"[Parser] Headers: {headers}")
            
            # === DETECT COLUMN INDICES ===
            date_col = None
            desc_col = None
            debit_col = None
            credit_col = None
            amount_col = None
            status_col = None
            balance_col = None  # Track balance column to SKIP it
            
            for i, h in enumerate(headers):
                h = h.strip()
                # Balance column — must be detected FIRST to exclude from amount matching
                if any(k in h for k in ["balance"]):
                    balance_col = i
                elif any(k in h for k in ["date", "time", "created"]):
                    if date_col is None: date_col = i
                elif any(k in h for k in ["description", "particular", "remark", "detail", "narration", "purpose", "note"]):
                    desc_col = i
                elif h in ["dr.", "dr", "debit"] or any(k in h for k in ["debit", "paid", "sent"]):
                    debit_col = i
                elif h in ["cr.", "cr", "credit"] or any(k in h for k in ["credit", "received"]):
                    credit_col = i
                elif any(k in h for k in ["amount", "total"]):
                    amount_col = i
                elif any(k in h for k in ["status"]):
                    status_col = i
            
            print(f"[Parser] Cols -> date:{date_col}, desc:{desc_col}, debit:{debit_col}, credit:{credit_col}, amount:{amount_col}, balance:{balance_col}, status:{status_col}")
            
            for row in rows_data:
                try:
                    # Skip empty rows
                    if not any(cell.strip() for cell in row):
                        continue
                    
                    # Skip summary/total rows (eSewa puts a "Total" row at the bottom)
                    row_text = " ".join(cell.lower().strip() for cell in row)
                    if any(kw in row_text for kw in ["total", "grand total", "summary", "opening balance", "closing balance", "net amount"]):
                        continue
                    
                    # Skip rows that are too short
                    needed_cols = [c for c in [date_col, desc_col, debit_col, credit_col, amount_col] if c is not None]
                    if needed_cols and len(row) <= max(needed_cols):
                        continue
                    
                    # Skip failed/cancelled transactions
                    if status_col is not None and status_col < len(row):
                        status_val = row[status_col].lower().strip()
                        if any(s in status_val for s in ["fail", "cancel", "pending"]):
                            continue
                    
                    # Extract date
                    date_str = ""
                    if date_col is not None and date_col < len(row):
                        raw_date = row[date_col]
                        dm = re.search(r"(\d{4}[-/]\d{2}[-/]\d{2})", raw_date)
                        if dm:
                            date_str = dm.group(1).replace("/", "-")
                        else:
                            dm = re.search(r"(\d{2}[-/]\d{2}[-/]\d{4})", raw_date)
                            if dm:
                                parts = dm.group(1).replace("/", "-").split("-")
                                date_str = f"{parts[2]}-{parts[1]}-{parts[0]}"
                            else:
                                date_str = raw_date[:10]
                    
                    # Extract description
                    title = ""
                    if desc_col is not None and desc_col < len(row):
                        title = row[desc_col].strip()
                    
                    if not title or title.lower() in ["none", "", "nan", "0.0", "0"]:
                        # Try to build a title from non-numeric, non-metadata cells
                        skip = {date_col, debit_col, credit_col, amount_col, status_col, balance_col}
                        parts = [row[i] for i in range(len(row)) if i not in skip and row[i].strip() and not re.match(r'^[\d.,\s]+$', row[i])]
                        title = " ".join(parts) if parts else "Unknown Transaction"
                    
                    if not title or title.lower() in ["none", "", "nan"]:
                        title = "Unknown Transaction"
                    
                    # Extract amount & determine type
                    amount = 0.0
                    type_str = "expense"
                    
                    if debit_col is not None and credit_col is not None:
                        debit_val = row[debit_col] if debit_col < len(row) else ""
                        credit_val = row[credit_col] if credit_col < len(row) else ""
                        
                        debit_num = parse_amount(debit_val)
                        credit_num = parse_amount(credit_val)
                        
                        if debit_num > 0 and credit_num == 0:
                            amount = debit_num
                            type_str = "expense"
                        elif credit_num > 0 and debit_num == 0:
                            amount = credit_num
                            type_str = "income"
                        elif debit_num > 0 and credit_num > 0:
                            # Both have values — net it
                            if debit_num > credit_num:
                                amount = debit_num - credit_num
                                type_str = "expense"
                            else:
                                amount = credit_num - debit_num
                                type_str = "income"
                        else:
                            continue  # Both are 0, skip
                    elif amount_col is not None and amount_col < len(row):
                        amount = parse_amount(row[amount_col])
                        if any(kw in title.lower() for kw in ["receive", "deposit", "refund", "cash in", "load", "credit"]):
                            type_str = "income"
                    else:
                        continue  # No amount column found, skip row
                    
                    if amount <= 0:
                        continue
                    
                    # Categorize using AI
                    cat = keyword_match(title)
                    if not cat:
                        model = joblib.load(model_path)
                        cat = model.predict([title])[0]
                    
                    transactions.append({
                        "date": date_str,
                        "title": title[:80],
                        "amount": round(amount, 2),
                        "type": type_str,
                        "category": cat
                    })
                    
                except Exception as row_err:
                    print(f"[Parser] Skipping row: {row_err}")
                    continue
        
        # ===== CSV FILES =====
        elif filename.endswith(".csv"):
            import csv
            reader = csv.reader(io.StringIO(content.decode("utf-8", errors="ignore")))
            all_rows = list(reader)
            if len(all_rows) > 1:
                headers = [h.lower().strip() for h in all_rows[0]]
                # Reuse Excel logic by converting to same format
                # For now, treat CSV similarly
                for row in all_rows[1:]:
                    if len(row) < 2:
                        continue
                    # Simple heuristic: find date, description, amount
                    line = " | ".join(row)
                    date_match = re.search(r"(\d{4}[-/]\d{2}[-/]\d{2})", line)
                    amounts = re.findall(r"((?:\d+,)*\d+\.\d{2})", line)
                    
                    if amounts:
                        # Skip summary lines in CSV
                        if any(kw in line.lower() for kw in ["balance", "opening", "closing", "total", "summary"]):
                            continue
                            
                        amount = parse_amount(amounts[0])
                        if amount <= 0: continue
                        title = re.sub(r"[\d,./\-]+", "", line).replace("|", " ").strip()
                        title = re.sub(r"\s+", " ", title)[:80] or "Unknown"
                        
                        type_str = "expense"
                        if any(kw in title.lower() for kw in ["receive", "deposit", "refund", "cash in", "credit"]):
                            type_str = "income"
                        
                        cat = keyword_match(title)
                        if not cat:
                            model = joblib.load(model_path)
                            cat = model.predict([title])[0]
                        
                        transactions.append({
                            "date": date_match.group(1) if date_match else "",
                            "title": title,
                            "amount": round(amount, 2),
                            "type": type_str,
                            "category": cat
                        })
        
        # ===== PDF FILES =====
        elif filename.endswith(".pdf"):
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if not text:
                        continue
                    
                    lines = text.split("\n")
                    for line in lines:
                        date_match = re.search(r"(\d{2,4}[-/]\d{2}[-/]\d{2,4})", line)
                        amounts = re.findall(r"(?:Rs\.?\s*)?((?:\d+,)*\d+\.\d{2})", line)
                        
                        if date_match and amounts:
                            # Skip summary lines in PDF
                            if any(kw in line.lower() for kw in ["balance", "opening", "closing", "total", "summary"]):
                                continue
                                
                            date = date_match.group(1)
                            amount_str = amounts[0].replace(",", "")
                            amount = float(amount_str)
                            
                            if amount <= 0: continue
                            
                            title = line.replace(date, "").replace(amounts[0], "").strip()
                            title = re.sub(r"\s+", " ", title)
                            
                            type_str = "expense"
                            if "receive" in title.lower() or "deposit" in title.lower() or "refund" in title.lower() or "cash in" in title.lower():
                                type_str = "income"
                                
                            cat = keyword_match(title)
                            if not cat:
                                model = joblib.load(model_path)
                                cat = model.predict([title])[0]
                                
                            transactions.append({
                                "date": date,
                                "title": title[:80] or "Unknown Transaction",
                                "amount": round(amount, 2),
                                "type": type_str,
                                "category": cat
                            })
                        
        return {"success": True, "transactions": transactions}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "message": str(e)}


def parse_amount(val: str) -> float:
    """Safely parse a string into a float amount."""
    if not val or not isinstance(val, str):
        return 0.0
    # Remove currency symbols, spaces, "Rs", "NPR" etc.
    cleaned = re.sub(r"[^\d.,\-]", "", val.strip())
    cleaned = cleaned.replace(",", "")
    try:
        return abs(float(cleaned))
    except (ValueError, TypeError):
        return 0.0

@app.post("/insights")
def generate_insights(data: InsightsInput):
    if not data.transactions:
        return {"success": True, "insights": ["Not enough data to generate insights. Add more expenses!"]}

    df = pd.DataFrame([t.dict() for t in data.transactions])
    
    # Filter for expenses only (since we only want to analyze spending)
    # The frontend will just send all transactions, or we just rely on what is passed.
    df['amount'] = df['amount'].astype(float)
    
    insights = []
    
    # 1. Anomaly Detection (Find unusually high single purchases)
    if len(df) >= 10:
        iso_forest = IsolationForest(contamination=0.05, random_state=42)
        df['anomaly'] = iso_forest.fit_predict(df[['amount']])
        
        anomalies = df[df['anomaly'] == -1]
        for _, row in anomalies.iterrows():
            if row['amount'] > df['amount'].mean(): # Only warn on unusually high anomalies
                insights.append(f"🚨 Unusual Spending Detected: Rs {row['amount']:,.2f} on '{row['title']}' is much higher than your normal spending patterns.")

    # 2. Category Analysis (What's draining the wallet?)
    if len(df) > 0:
        cat_sums = df.groupby('category')['amount'].sum()
        top_category = cat_sums.idxmax()
        top_amount = cat_sums.max()
        total_spending = df['amount'].sum()
        pct = (top_amount / total_spending) * 100 if total_spending > 0 else 0
        insights.append(f"📊 {top_category} is your biggest expense category, taking up {pct:.1f}% of your total spending (Rs {top_amount:,.2f}).")

    # 3. Budget Forecasting (Projections based on daily run-rate)
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df_valid_dates = df.dropna(subset=['date'])
    
    if len(df_valid_dates) > 0:
        # Assuming data is for the current month. Let's calculate based on current date.
        current_date = datetime.datetime.now()
        days_in_month = pd.Period(current_date.strftime('%Y-%m-01')).days_in_month
        days_passed = current_date.day
        
        if 0 < days_passed <= days_in_month:
            daily_avg = total_spending / days_passed
            projected_total = daily_avg * days_in_month
            insights.append(f"📈 Projection: At your current rate of Rs {daily_avg:,.0f}/day, you are on track to spend Rs {projected_total:,.0f} by the end of the month.")
    
    if len(insights) <= 1:
        insights.append("✅ Your spending patterns look stable. Keep logging your daily expenses to get more personalized insights!")
        
    return {"success": True, "insights": insights}