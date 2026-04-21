import joblib
import os

# Use absolute path to the model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "expense_model.pkl")
model = joblib.load(model_path)

samples = [
    "purchased laptop",
    "laptop",
    "macbook",
    "food",
    "drink"
]


predictions = model.predict(samples)

for text, pred in zip(samples, predictions):
    print(f"'{text}' -> {pred}")