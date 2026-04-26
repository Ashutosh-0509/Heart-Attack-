"""
HeartGuard CVD Risk Model Trainer — UPDATED
Trains on real-world cardio_train.csv and outputs model coefficients for JS app.
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score
import json, warnings, os
warnings.filterwarnings('ignore')

import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Relative path to the dataset
CSV_PATH = os.path.join("src", "Dataset", "archive", "cardio_train.csv")

print("=" * 60)
print("  HeartGuard CVD Model Trainer (Real Data Integration)")
print("=" * 60)

if not os.path.exists(CSV_PATH):
    print(f"[ERROR] Could not find dataset at {CSV_PATH}")
    sys.exit(1)

# -- Load data -------------------------------------------------------
df = pd.read_csv(CSV_PATH, sep=';')
print(f"\n[OK] Loaded {len(df)} records")

# -- Data Cleaning (Increased Efficiency) ----------------------------
print("\n── Data Cleaning ───────────────────────────────────────")
initial_len = len(df)
# Remove impossible Blood Pressure values
df = df[(df['ap_hi'] >= 80) & (df['ap_hi'] <= 250)]
df = df[(df['ap_lo'] >= 40) & (df['ap_lo'] <= 150)]
df = df[df['ap_hi'] > df['ap_lo']] # Systolic must be higher than diastolic
# Remove height/weight outliers
df = df[(df['height'] >= 100) & (df['height'] <= 220)]
df = df[(df['weight'] >= 30) & (df['weight'] <= 250)]

print(f"  Removed {initial_len - len(df)} outlier records.")
print(f"  Remaining records: {len(df)}")

# -- Feature Engineering ---------------------------------------------
print("\n── Feature Engineering ─────────────────────────────────")
df2 = df.copy()

# Gender: cardio_train uses 1=women, 2=men. Mapping to 0=Female, 1=Male
df2['gender'] = (df2['gender'] == 2).astype(int)

# Age: in days, convert to years
df2['age_years'] = df2['age'] / 365.25

# BMI: Calculate real BMI from height and weight
df2['bmi'] = df2['weight'] / ((df2['height'] / 100) ** 2)

# Blood pressure
df2['systolic'] = df2['ap_hi']
df2['diastolic'] = df2['ap_lo']

# Cholesterol & Glucose are already 1, 2, 3 in this dataset
df2['cholesterol'] = df2['cholesterol']
df2['glucose'] = df2['gluc']

# Smoking & Activity
df2['smoking'] = df2['smoke']
df2['active'] = df2['active']

# Target
df2['target'] = df2['cardio']

FEATURES = ['age_years', 'bmi', 'gender', 'cholesterol', 'glucose', 'smoking', 'active', 'systolic', 'diastolic']
LABELS   = ['Age', 'BMI', 'Gender', 'Cholesterol', 'Glucose', 'Smoking', 'Activity', 'Systolic BP', 'Diastolic BP']

df_clean = df2[FEATURES + ['target']].dropna()
X = df_clean[FEATURES].values
y = df_clean['target'].values

# -- Train / Test split ----------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# -- Scale -----------------------------------------------------------
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

print(f"\n── Training Logistic Regression ────────────────────────")
clf = LogisticRegression(max_iter=1000, C=1.0, random_state=42)
clf.fit(X_train_s, y_train)

y_pred = clf.predict(X_test_s)
y_prob = clf.predict_proba(X_test_s)[:, 1]
acc = accuracy_score(y_test, y_pred)
try:
    auc = roc_auc_score(y_test, y_prob)
except:
    auc = 0.0

print(f"  Accuracy : {acc*100:.2f}%")
print(f"  AUC-ROC  : {auc:.4f}")

# -- Feature Importance ----------------------------------------------
coef_abs = np.abs(clf.coef_[0])
fi_pct   = coef_abs / coef_abs.sum() * 100
fi_dict  = dict(zip(LABELS, [round(v, 2) for v in fi_pct]))
fi_sorted = dict(sorted(fi_dict.items(), key=lambda x: -x[1]))

print("\n── Feature Importances (% of total coefficient weight) ─")
for name, val in fi_sorted.items():
    bar = '█' * int(val / 2)
    print(f"  {name:<15} {val:5.1f}%  {bar}")

# -- Output MODEL object ---------------------------------------------
coef_list       = [round(v, 6) for v in clf.coef_[0].tolist()]
intercept_val   = round(clf.intercept_[0], 6)
means_list      = [round(v, 4) for v in scaler.mean_.tolist()]
stds_list       = [round(v, 4) for v in scaler.scale_.tolist()]

model_js = f"""// ── MODEL (trained on cardio_train.csv, {len(df_clean)} patients) ──
// Accuracy: {acc*100:.1f}%  |  AUC: {auc:.3f}
const MODEL = {{
  coef:      {coef_list},
  intercept: {intercept_val},
  means:     {means_list},
  stds:      {stds_list},
  features:  {json.dumps(FEATURES)},
  labels:    {json.dumps(LABELS)},
}};"""

print("\n── JS MODEL Object ─────────────────────────────────────")
print(model_js)

# -- Stats for UI ----------------------------------------------------
high_rate = df_clean['target'].mean() * 100
avg_sys = df_clean['systolic'].mean()
avg_bmi_high = df_clean[df_clean['target'] == 1]['bmi'].mean()
chol3_high = df_clean[df_clean['cholesterol'] == 3]['target'].mean() * 100
chol2_high = df_clean[df_clean['cholesterol'] == 2]['target'].mean() * 100
act_high = df_clean[df_clean['active'] == 1]['target'].mean() * 100
inact_high = df_clean[df_clean['active'] == 0]['target'].mean() * 100

print("\n── Clinical Insight Statistics ─────────────────────────")
print(f"  Total Records                 : {len(df_clean)}")
print(f"  High Risk Rate                : {high_rate:.1f}%")
print(f"  Avg Systolic BP               : {avg_sys:.1f} mmHg")
print(f"  Avg BMI (high-risk)           : {avg_bmi_high:.2f}")
print(f"  Cholesterol Level 3 HIGH rate : {chol3_high:.1f}%")
print(f"  Cholesterol Level 2 HIGH rate : {chol2_high:.1f}%")
print(f"  Active patients HIGH rate     : {act_high:.1f}%")
print(f"  Inactive patients HIGH rate   : {inact_high:.1f}%")
print(f"  Activity protective diff      : {inact_high - act_high:.1f}%")

print("\n── DONE ────────────────────────────────────────────────")
print("  Copy the MODEL object above into healthReport.js and heart_predictor.html")
print("=" * 60)

