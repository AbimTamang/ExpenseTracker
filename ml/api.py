from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import os
import re

# Get the absolute path to the directory containing this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "expense_model.pkl")

app = FastAPI()

class ExpenseInput(BaseModel):
    text: str

# Hard keyword rules — always override the ML model
KEYWORD_RULES = [
    (["purchased", "buy ", "bought", "purchase of"], "Shopping"),
    (["rent", "housing", "apartment", "landlord"], "Housing/Rent"),
    (["pathao", "indrive", "uber", "bus ticket", "taxi", "fuel", "petrol", "ride", "bike", "maintenance", "repair", "car", "scooter", "flight"], "Transportation"),
    (["momo", "pizza", "burger", "coffee", "restaurant", "tea", "dal bhat", "chowmein", "food"], "Food & Drinks"),
    (["medicine", "hospital", "doctor", "pharmacy", "clinic", "medical"], "Healthcare"),
    (["salary", "freelance", "freelancing", "bonus", "client payment", "office", "payment", "income", "commission", "profit", "wage", "stipend", "deposit", "payroll"], "Salary/Income"),
    (["netflix", "spotify", "movie ticket", "games", "cinema", "entertainment"], "Entertainment"),
    (["bill", "utility", "electricity", "water", "internet", "wifi"], "Utilities"),
    (["insurance", "premium"], "Insurance"),
    (["atm", "cash withdrawal"], "Cash Withdrawal"),
    (["direct debit", "transfer", "remittance"], "Bank Transfer")
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