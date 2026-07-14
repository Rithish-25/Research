import joblib
import pandas as pd

# 1. Load the model
model = joblib.load("loan_risk_model.pkl")

# 2. Define a sample input matching the 13 required features
sample_data = pd.DataFrame([{
    "person_age": 22.0,
    "person_gender": "female",
    "person_education": "Master",
    "person_income": 71948.0,
    "person_emp_exp": 0,
    "person_home_ownership": "RENT",
    "loan_amnt": 35000.0,
    "loan_intent": "PERSONAL",
    "loan_int_rate": 16.02,
    "loan_percent_income": 0.49,
    "cb_person_cred_hist_length": 3.0,
    "credit_score": 561,
    "previous_loan_defaults_on_file": "No"
}])

# 3. Make predictions (bypassing the scikit-learn 1.6 compatibility issue)
X_transformed = model.named_steps["preprocessor"].transform(sample_data)
prediction = model.named_steps["classifier"].predict(X_transformed)
probability = model.named_steps["classifier"].predict_proba(X_transformed)

print("Prediction (0 = Safe, 1 = Default Risk):", prediction[0])
print(f"Risk Probability: {probability[0][1]:.2%}")
