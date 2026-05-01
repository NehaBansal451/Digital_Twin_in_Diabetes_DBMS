from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

app = Flask(__name__)
CORS(app)

# =========================
# TRAIN MODEL (Improved Data)
# =========================

df = pd.DataFrame({
    'age': [25, 40, 55, 60, 30, 50, 35, 45, 65, 28, 52, 38, 48, 70, 22],
    'glucose': [110, 180, 250, 300, 140, 220, 120, 190, 280, 100, 240, 160, 210, 310, 95],
    'risk': [0, 1, 2, 2, 0, 1, 0, 1, 2, 0, 2, 1, 1, 2, 0]
})

X = df[['age', 'glucose']]
y = df['risk']

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# =========================
# RECOMMENDATION FUNCTION
# =========================

def get_recommendation(risk):
    if risk == "Low":
        return {
            "diet": "Balanced diet, avoid excess sugar",
            "exercise": "Daily 30 min walk",
            "precaution": "Routine check monthly",
            "medicine": "No medicine required"
        }
    elif risk == "Medium":
        return {
            "diet": "Low carb diet, avoid sweets",
            "exercise": "Daily exercise + yoga",
            "precaution": "Check glucose weekly",
            "medicine": "Metformin (consult doctor)"
        }
    else:
        return {
            "diet": "Strict diabetic diet",
            "exercise": "Regular monitored activity",
            "precaution": "Consult doctor immediately",
            "medicine": "Insulin (doctor supervision required)"
        }

# =========================
# MAIN PREDICTION API
# =========================

@app.route('/predict', methods=['POST'])
def predict():
    try:
        input_data = request.json

        age = input_data['age']
        glucose = input_data['glucose']

        input_df = pd.DataFrame([[age, glucose]], columns=['age', 'glucose'])

        pred = model.predict(input_df)[0]

        if pred == 0:
            risk = "Low"
        elif pred == 1:
            risk = "Medium"
        else:
            risk = "High"

        recommendation = get_recommendation(risk)

        return jsonify({
            "risk": risk,
            "score": int(pred),
            "recommendation": recommendation
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# =========================
# FUTURE GLUCOSE PREDICTION
# =========================

@app.route('/predict-future', methods=['POST'])
def predict_future():
    try:
        data = request.json
        values = data['glucose_values']

        if not values:
            return jsonify({"error": "No data provided"}), 400

        if len(values) < 2:
            return jsonify({"prediction": values[-1]})

        # Better trend calculation
        diffs = [values[i+1] - values[i] for i in range(len(values)-1)]
        avg_diff = sum(diffs) / len(diffs)
        future = values[-1] + avg_diff

        return jsonify({
            "prediction": round(future, 2)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":
    app.run(port=5000, debug=True)
