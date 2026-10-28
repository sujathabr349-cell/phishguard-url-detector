"""
PhishGuard - Machine Learning Model Training Script
Trains a Scikit-learn Random Forest classifier on labeled phishing and legitimate URLs.
Generates evaluation metrics (Precision, Recall, F1-score, Confusion Matrix) and saves
the serialized model to model/phishguard_model.joblib.
"""

import os
import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, precision_score, recall_score, f1_score, accuracy_score
from sklearn.model_selection import train_test_split

# Ensure url_analyzer can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent))
from url_analyzer import extract_features, get_feature_vector, FEATURE_NAMES, validate_and_normalize_url

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "model"
MODEL_PATH = MODEL_DIR / "phishguard_model.joblib"
DATASET_PATH = DATA_DIR / "urldata.csv"

# Seed for reproducibility
RANDOM_SEED = 42


def get_or_generate_dataset() -> pd.DataFrame:
    """
    Load dataset from data/urldata.csv or generate a documented baseline dataset
    of representative legitimate and phishing URL samples if the external CSV is absent.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if DATASET_PATH.exists():
        print(f"[*] Loading existing dataset from {DATASET_PATH}...")
        df = pd.read_csv(DATASET_PATH)
        return df

    print(f"[*] Generating curated baseline training dataset at {DATASET_PATH}...")
    # Curated real-world representative URLs across legitimate and phishing categories
    # 0 = Legitimate, 1 = Phishing
    sample_data = [
        # Legitimate URLs (Tranco Top 1000 & Standard web services)
        ("https://www.google.com", 0),
        ("https://www.wikipedia.org/wiki/Computer_security", 0),
        ("https://github.com/torvalds/linux", 0),
        ("https://stackoverflow.com/questions/tagged/python", 0),
        ("https://aws.amazon.com/console/", 0),
        ("https://developer.mozilla.org/en-US/docs/Web/HTTP", 0),
        ("https://news.ycombinator.com", 0),
        ("https://www.nytimes.com/section/technology", 0),
        ("https://docs.python.org/3/library/urllib.parse.html", 0),
        ("https://www.microsoft.com/en-us/software-download", 0),
        ("https://scikit-learn.org/stable/modules/ensemble.html", 0),
        ("https://www.apple.com/shop/buy-mac", 0),
        ("https://en.wikipedia.org/wiki/Transport_Layer_Security", 0),
        ("https://www.nationalgeographic.com/environment", 0),
        ("https://www.mit.edu/research/", 0),
        ("https://www.bbc.com/news/world", 0),
        ("https://www.reuters.com/business/finance/", 0),
        ("https://arxiv.org/abs/2103.00020", 0),
        ("https://www.cloudflare.com/learning/ssl/what-is-ssl/", 0),
        ("https://support.google.com/accounts/answer/185839", 0),
        ("https://www.reddit.com/r/netsec/", 0),
        ("https://www.linkedin.com/feed/", 0),
        ("https://www.nasa.gov/mission_pages/station/main/index.html", 0),
        ("https://pypi.org/project/scikit-learn/", 0),
        ("https://httpbin.org/get", 0),
        ("https://fastapi.tiangolo.com/tutorial/", 0),
        ("https://flask.palletsprojects.com/en/3.0.x/", 0),
        ("https://pandas.pydata.org/docs/reference/api.html", 0),
        ("https://developer.apple.com/documentation/security", 0),
        ("https://learn.microsoft.com/en-us/azure/security/", 0),

        # Phishing & Suspicious URLs (Mimicking real PhishTank / OpenPhish patterns)
        ("http://192.168.1.105/login/paypal.php", 1),
        ("http://218.45.109.22/secure/update-banking-credentials/", 1),
        ("http://appleid.apple.com.verify-device-portal.xyz/auth/login", 1),
        ("http://paypal-security-center-update.com/signin/index.html", 1),
        ("http://accounts-google.com.verify-identity-auth.info/signin", 1),
        ("http://bit.ly/3xFakeBankLoginLure", 1),
        ("http://tinyurl.com/secure-banking-portal-verification", 1),
        ("http://netflix.account-billing-issue.top/re-activate/", 1),
        ("http://wellsfargo-online-service.auth-verify.cc/login.php", 1),
        ("http://secure.paypal.com.customer-verification-request.net", 1),
        ("http://185.220.101.5/webscr/login?cmd=_login-run", 1),
        ("http://chase.online-security-confirmation.club/auth/", 1),
        ("http://amazon-account-suspension.update-billing.org/verify", 1),
        ("http://microsoft-support.login-portal.site/onedrive/auth", 1),
        ("http://signin.ebay.com.account-protection.biz/ws/eBayISAPI.dll", 1),
        ("http://user@fake-auth-portal.com/banking/sign-in", 1),
        ("http://login.dhl-tracking-delivery.me/package-confirm/", 1),
        ("http://fedex-parcel-delivery.reschedule-notice.link/parcel", 1),
        ("http://instagram-security-badge-verification.online/verify", 1),
        ("http://coinbase-wallet-restore-seed.pro/auth/", 1),
        ("http://binance-account-unlock-kyc.vip/verify-login", 1),
        ("http://dropbox.file-share-notification.biz/download-file.exe", 1),
        ("http://bankofamerica.online-safety-alert.com/signon", 1),
        ("http://apple-support-lost-mode.id-lookup.space/findmy/", 1),
        ("http://facebook-security-infraction-appeal.support-case.top", 1),
        ("http://198.51.100.44:8080/secure/password-reset.php", 1),
        ("http://myetherwallet.cx.token-airdrop-claim.com/wallet", 1),
        ("http://usps-redelivery-fee.track-postage.cc/form/", 1),
        ("http://docusign-envelope-review.document-sign.pw/doc/", 1),
        ("http://internal-payroll-tax-update.employee-portal.website/hr", 1),
    ]

    df = pd.DataFrame(sample_data, columns=["url", "label"])
    df.to_csv(DATASET_PATH, index=False)
    print(f"[+] Saved baseline dataset ({len(df)} samples) to {DATASET_PATH}.")
    return df


def extract_dataset_features(df: pd.DataFrame):
    """
    Process dataset URLs into feature matrix X and target vector y.
    """
    X_list = []
    y_list = []
    valid_count = 0
    skipped_count = 0

    for idx, row in df.iterrows():
        raw_url = str(row["url"]).strip()
        label = int(row["label"])

        is_valid, normalized_url, _ = validate_and_normalize_url(raw_url)
        if not is_valid:
            # Try prepending http:// if user passed bare hostname
            if not raw_url.startswith(("http://", "https://")):
                is_valid, normalized_url, _ = validate_and_normalize_url(f"http://{raw_url}")

        if not is_valid:
            skipped_count += 1
            continue

        try:
            feats = extract_features(normalized_url)
            vec = get_feature_vector(feats)
            X_list.append(vec)
            y_list.append(label)
            valid_count += 1
        except Exception as exc:
            skipped_count += 1
            continue

    print(f"[+] Feature extraction completed: {valid_count} valid samples, {skipped_count} skipped.")
    return np.array(X_list), np.array(y_list)


def train_and_evaluate():
    """
    Main training workflow: Load data -> Extract features -> Train Test Split -> Train -> Evaluate -> Save.
    """
    print("=" * 65)
    print("       PhishGuard Machine Learning Training Pipeline")
    print("=" * 65)

    df = get_or_generate_dataset()
    X, y = extract_dataset_features(df)

    if len(X) < 10:
        print("[-] Error: Insufficient valid samples to train model.")
        return

    # Train / Test split (80% train, 20% test) with stratified sampling
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.25,
        random_state=RANDOM_SEED,
        stratify=y
    )

    print(f"[+] Training set size: {len(X_train)} samples")
    print(f"[+] Testing set size:  {len(X_test)} samples")

    # Initialize Random Forest Classifier
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=RANDOM_SEED,
        class_weight="balanced"
    )

    print("[*] Training Random Forest Classifier...")
    clf.fit(X_train, y_train)

    # Predictions & Evaluation
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "-" * 40)
    print("          MODEL EVALUATION METRICS")
    print("-" * 40)
    print(f"Accuracy:        {accuracy * 100:.2f}%")
    print(f"Precision:       {precision * 100:.2f}%")
    print(f"Recall:          {recall * 100:.2f}%")
    print(f"F1-Score:        {f1 * 100:.2f}%")
    print("\nConfusion Matrix:")
    print(f"  [TN={cm[0][0]}, FP={cm[0][1]}]")
    print(f"  [FN={cm[1][0]}, TP={cm[1][1]}]")
    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Phishing"], zero_division=0))

    # Feature Importance Analysis
    importances = clf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    print("Feature Importance Ranking:")
    for rank, idx in enumerate(sorted_idx, 1):
        print(f"  {rank:2d}. {FEATURE_NAMES[idx]:<24} : {importances[idx]:.4f}")

    # Save model artifact
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    print(f"\n[+] Successfully saved trained model to: {MODEL_PATH}")
    print("=" * 65)


if __name__ == "__main__":
    train_and_evaluate()
