import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score

# Get the absolute path to the directory containing this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.join(BASE_DIR, "dataset_synced.csv")

# Load the synced 10k dataset
df = pd.read_csv(dataset_path)

# Ensure 'text' is filled
df["text"] = df["text"].fillna("")

X = df["text"]
y = df["category"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.1, random_state=42, stratify=y
)

model = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2))), # Added bigrams for better context
    ("clf", LogisticRegression(max_iter=2000))
])

model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("Final Model Accuracy:", accuracy_score(y_test, y_pred))
print("\nFinal Classification Report:\n")
print(classification_report(y_test, y_pred))

model_save_path = os.path.join(BASE_DIR, "expense_model.pkl")
joblib.dump(model, model_save_path)
print(f"\n[SUCCESS] Model synced and saved as {model_save_path}")
