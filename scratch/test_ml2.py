KEYWORD_RULES = [
    (["purchased", "buy ", "bought", "purchase of"], "Shopping"),
    (["rent", "housing", "apartment", "landlord"], "Housing/Rent"),
    (["pathao", "indrive", "uber", "bus ticket", "taxi", "fuel", "petrol", "ride", "bike", "maintenance", "repair", "car", "scooter", "flight"], "Transportation"),
    (["momo", "pizza", "burger", "coffee", "restaurant", "tea", "dal bhat", "chowmein", "food"], "Food & Drinks"),
    (["medicine", "hospital", "doctor", "pharmacy", "clinic", "medical"], "Healthcare"),
    (["salary", "freelance", "bonus", "client payment", "office", "payment", "income", "commission", "profit", "wage", "stipend", "deposit", "payroll"], "Salary/Income"),
    (["netflix", "spotify", "movie ticket", "games", "cinema", "entertainment"], "Entertainment"),
    (["bill", "utility", "electricity", "water", "internet", "wifi"], "Utilities"),
    (["insurance", "premium"], "Insurance"),
    (["atm", "cash withdrawal"], "Cash Withdrawal"),
    (["direct debit", "transfer", "remittance"], "Bank Transfer")
]

def keyword_match(text: str):
    t = text.lower()
    for keywords, category in KEYWORD_RULES:
        for kw in keywords:
            if kw in t:
                print(f"Matched '{kw}' in '{t}' -> {category}")
                return category
    return None

print(keyword_match("Freelancing"))
