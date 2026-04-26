# HeartGuard — CVD Risk Model Training Script
#
# WHAT THIS FILE DOES:
#   - Loads CVD Dataset.csv from the archive folder
#   - Engineers features (gender, BMI, cholesterol category, etc.)
#   - Trains a Logistic Regression model via scikit-learn
#   - Prints model coefficients, means, and stds as JS constant
#   - Prints clinical stats for UI updates
#
# USAGE:
#   python -X utf8 train_model.py
#   Then copy the MODEL object printed at the bottom into:
#     - server/algorithms/healthReport.js
#     - client/heart_predictor.html
#
# REQUIREMENTS:
#   pip install pandas scikit-learn numpy

# NOTE: The actual training code lives in train_model.py
# This file is the model reference script kept alongside the HTML predictor.
# See heart_predictor.html for the standalone CardioPredict app.

TRAINED_MODEL = {
    # Trained on cardio_train.csv — 68,629 real records
    # Test Accuracy: 73.0% | AUC-ROC: 0.795
    "coef":      [0.339085, 0.135304, 0.012165, 0.33993, -0.070266, -0.05742, -0.092789, 0.930461, 0.107033],
    "intercept": 0.028908,
    "means":     [53.2937, 27.4879, 0.3503, 1.3646, 1.2256, 0.0874, 0.8031, 126.6524, 81.2971],
    "stds":      [6.7452, 5.3745, 0.4771, 0.6788, 0.5722, 0.2825, 0.3977, 16.6986, 9.4317],
    "features":  ["age_years", "bmi", "gender", "cholesterol", "glucose", "smoking", "active", "systolic", "diastolic"],
    "labels":    ["Age", "BMI", "Gender", "Cholesterol", "Glucose", "Smoking", "Activity", "Systolic BP", "Diastolic BP"],
}

DATASET_STATS = {
    "total_records":        68629,
    "high_risk_rate_pct":   49.5,   
    "avg_systolic_bp":      126.7,  # mmHg
    "avg_bmi_high_risk":    28.48,
    "chol_level3_high_pct": 76.3,
    "chol_level2_high_pct": 59.6,
    "active_high_pct":      48.5,
    "inactive_high_pct":    53.3,
    "activity_protection":  4.8,   # percentage point difference
}

FEATURE_IMPORTANCE = {
    "Systolic BP":  44.6,
    "Cholesterol":  16.3,
    "Age":          16.3,
    "BMI":           6.5,
    "Diastolic BP":  5.1,
    "Activity":      4.5,
    "Glucose":       3.4,
    "Smoking":       2.8,
    "Gender":        0.6,
}

if __name__ == "__main__":
    print("HeartGuard Model Reference — REAL DATA")
    print(f"  Records:    {DATASET_STATS['total_records']}")
    print(f"  High Risk:  {DATASET_STATS['high_risk_rate_pct']}%")
    print(f"  Avg Sys BP: {DATASET_STATS['avg_systolic_bp']} mmHg")
    print("\nFeature Importances:")
    for k, v in sorted(FEATURE_IMPORTANCE.items(), key=lambda x: -x[1]):
        print(f"  {k:<15} {v:.1f}%")
    print("\nRun 'python train_model.py' to retrain the model.")
