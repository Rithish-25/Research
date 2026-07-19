import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# Load dataset
df = pd.read_csv("Dataset.csv")

# Target column
X = df.drop("loan_status", axis=1)
y = df["loan_status"]

# Same split used during training
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# ==========================
# Random Forest
# ==========================
rf = joblib.load("loan_risk_model_random_forest.pkl")

rf_X_transformed = rf.named_steps["preprocessor"].transform(X_test)
rf_pred = rf.named_steps["classifier"].predict(rf_X_transformed)

print("\n========== RANDOM FOREST ==========")
print(f"Accuracy : {accuracy_score(y_test, rf_pred)*100:.2f}%")
print(f"Precision: {precision_score(y_test, rf_pred)*100:.2f}%")
print(f"Recall   : {recall_score(y_test, rf_pred)*100:.2f}%")
print(f"F1 Score : {f1_score(y_test, rf_pred)*100:.2f}%")
print("Confusion Matrix")
print(confusion_matrix(y_test, rf_pred))


# ==========================
# XGBoost
# ==========================
# Load XGBoost dataset with additional features
df_xgb = pd.read_csv("Dataset_XGBoost.csv")

X_xgb = df_xgb.drop("loan_status", axis=1)
y_xgb = df_xgb["loan_status"]

X_train_xgb, X_test_xgb, y_train_xgb, y_test_xgb = train_test_split(
    X_xgb,
    y_xgb,
    test_size=0.2,
    random_state=42
)

xgb = joblib.load("loan_risk_model_xgboost.pkl")

xgb_X_transformed = xgb.named_steps["preprocessor"].transform(X_test_xgb)
xgb_pred = xgb.named_steps["classifier"].predict(xgb_X_transformed)

print("\n========== XGBOOST ==========")
print(f"Accuracy : {accuracy_score(y_test_xgb, xgb_pred)*100:.2f}%")
print(f"Precision: {precision_score(y_test_xgb, xgb_pred)*100:.2f}%")
print(f"Recall   : {recall_score(y_test_xgb, xgb_pred)*100:.2f}%")
print(f"F1 Score : {f1_score(y_test_xgb, xgb_pred)*100:.2f}%")
print("Confusion Matrix")
print(confusion_matrix(y_test_xgb, xgb_pred))