import requests

def test_predict():
    response = requests.post("http://127.0.0.1:8000/predict", json={"text": "Freelancing"})
    print("Response for Freelancing:", response.json())

test_predict()
