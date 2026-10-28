# PhishGuard – AI Phishing URL Detector

> A production-ready cybersecurity application that performs multi-layered structural, lexical, and machine-learning risk evaluations on URLs to detect deceptive phishing lures, credential harvesters, and malicious redirects before users open unknown links.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![Flask](https://img.shields.io/badge/Backend-Flask%203.0-lightgrey?logo=flask)
![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--learn-orange?logo=scikit-learn)
![SQLite](https://img.shields.io/badge/Database-SQLite3-003B57?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 1. Project Overview

Phishing remains the #1 initial access vector in cyberattacks. Attackers constantly engineer deceptive domain permutations—subdomain stacking, brand typosquatting, IDN homoglyphs, masking shorteners, and unencrypted IP endpoints—to circumvent conventional email gateways and lure unsuspecting users into surrendering credentials or session tokens.

**PhishGuard** analyzes submitted URLs without ever establishing an outbound HTTP socket connection to the target server (preventing Server-Side Request Forgery / SSRF vulnerabilities and protecting analysts from remote malware delivery). It parses the destination into discrete structural components, extracts 12+ security features, evaluates an interpretable heuristic ruleset, and scores the URL against a trained Scikit-learn Random Forest classifier.

---

## 2. Core Features

- **High-Fidelity Operations Dashboard:**
  - Real-time metrics calculated from local SQLite records: Total URLs Analyzed, High Risk flags, Medium Suspicion, and Lower Risk baseline counts.
  - Interactive 7-day volume trends and risk distribution doughnut charts powered by Chart.js.
  - Recent inspection log with quick inspection shortcuts.

- **Defensive URL Scanner:**
  - Strict RFC syntax and protocol validation (strictly allows `http://` and `https://`; rejects malformed input and non-web schemes).
  - Normalization engine ensuring safe character escaping and length constraints ($\le 2,048$ chars).
  - Multi-stage animated scan pipeline indicator illustrating syntax parsing, feature extraction, heuristic calculation, and ML inference.

- **Deep Structural & Lexical Feature Analysis:**
  - URL length and character distribution
  - Host dot counts and deep subdomain nesting levels
  - Direct IPv4 and IPv6 literal address detection
  - TLS/HTTPS encryption verification
  - Identification of 20+ known URL shortener domains (Bitly, TinyURL, Ow.ly, etc.)
  - High-profile brand typosquatting and combosquatting lures (PayPal, Apple, Google, Microsoft, Chase, Netflix, etc.)
  - Deceptive authentication keywords (`login`, `verify`, `billing`, `update`, `signin`, `secure`)
  - Non-standard TCP port numbers (e.g. `:8080`, `:8888`)
  - Hexadecimal and percent-encoded character sequences
  - Shannon entropy calculation of the hostname to spot random machine-generated domains

- **Transparent Risk Assessment:**
  - Clear risk categorization: **High Risk** ($\ge 70$), **Medium Suspicion** ($36–69$), and **Lower Risk** ($<36$).
  - Transparent point attribution: every penalty is explained in plain English with its numerical weight and risk severity.
  - Actionable precautions customized to the threat level.
  - Explicit cybersecurity disclaimer highlighting that statistical URL scoring provides threat triage, not a definitive guarantee.

- **Machine Learning with Heuristic Fallback:**
  - Scikit-learn Random Forest classifier trained on balanced legitimate and phishing URLs.
  - Clean feature extraction vector matching training dimensions.
  - Graceful fallback: If the serialized model is not present, the application operates seamlessly on the heuristic engine, with transparent UI indicators.

- **Persistent Scan History & Audit Log:**
  - Full SQLite persistence using parameterized queries to eliminate SQL injection.
  - Live keyword search across URLs and domains.
  - Filterable by risk level (High, Medium, Low) and date range (Today, 7 Days, 30 Days).
  - Individual record deletion and complete history clearing with a confirmation modal.
  - One-click RFC 4180 CSV audit export.

- **Cybersecurity Education Center:**
  - Explanations of phishing mechanics and social engineering urgency.
  - Interactive URL anatomy breakdown highlighting root domains vs. deceptive subdomains.
  - Detailed debunking of the *"HTTPS means safe"* misconception.
  - Step-by-step incident response checklist for users who clicked a suspicious link.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Framework** | Python 3.10+, Flask 3.0+ |
| **Data Processing & ML** | Scikit-learn, Pandas, NumPy, Joblib |
| **Database** | SQLite3 (Parameterized queries, foreign key support) |
| **Frontend UI** | HTML5, CSS3 (Custom Dark Navy Theme), JavaScript (ES6+) |
| **Visualizations** | Chart.js 4.4 |
| **Testing** | Pytest 8.0+ |

---

## 4. Project Structure

```
phishguard-url-detector/
├── .env.example              # Template environment configuration
├── .gitignore                # Git exclusions (virtualenvs, .db, .joblib, caches)
├── README.md                 # Full project documentation & architecture guide
├── app.py                    # Flask application factory, routing & API endpoints
├── config.py                 # Environment configurations (Dev, Test, Prod)
├── database.py               # SQLite initialization, CRUD, and telemetry functions
├── requirements.txt          # Python dependencies
├── train_model.py            # Reproducible ML training and evaluation script
├── url_analyzer.py           # Feature extraction, heuristic scoring, and ML predictor
├── data/
│   ├── README.md             # Dataset documentation, sources, and schema guide
│   └── urldata.csv           # Baseline curated dataset (generated or user-supplied)
├── model/
│   ├── .gitkeep              # Directory placeholder for serialized model
│   └── phishguard_model.joblib # Serialized Scikit-learn model artifact
├── templates/
│   ├── base.html             # Base cybersecurity layout, sidebar, and alert toasts
│   ├── index.html            # Prominent URL scanner with animated pipeline
│   ├── dashboard.html        # Telemetry cards, Chart.js trends & recent inspections
│   ├── result.html           # Risk gauge, contributing indicators & precautions
│   ├── history.html          # Searchable, filterable scan history table with modal
│   ├── reports.html          # Comprehensive analytics, bar charts & CSV export
│   └── security_tips.html    # Phishing defense guides and URL anatomy diagrams
├── static/
│   ├── css/
│   │   └── style.css         # Responsive dark navy theme styles
│   ├── js/
│   │   ├── app.js            # UI interactions, pipeline animations & modal handlers
│   │   └── charts.js         # Chart.js charts configuration
│   └── images/
│       └── favicon.svg       # Custom shield and radar brand icon
└── tests/
    ├── test_url_analyzer.py  # Unit tests for URL validation, features & scoring
    └── test_database.py      # Unit tests for database operations & statistics
```

---

## 5. Local Setup & Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/phishguard-url-detector.git
cd phishguard-url-detector
```

### Step 2: Create and Activate a Virtual Environment
**On macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 3: Install Required Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Copy the sample environment file:
```bash
cp .env.example .env
```
*(Optionally modify `.env` to specify custom paths or secret keys).*

---

## 6. Training the Machine Learning Model

PhishGuard includes a complete Scikit-learn training pipeline that trains a Random Forest Classifier on labeled URLs and produces detailed evaluation metrics (Accuracy, Precision, Recall, F1-Score, and a Confusion Matrix).

Run the training script:
```bash
python train_model.py
```

### Sample Training Output:
```text
=================================================================
       PhishGuard Machine Learning Training Pipeline
=================================================================
[*] Loading dataset...
[+] Feature extraction completed: 60 valid samples.
[+] Training set size: 45 samples
[+] Testing set size:  15 samples
[*] Training Random Forest Classifier...

----------------------------------------
          MODEL EVALUATION METRICS
----------------------------------------
Accuracy:        93.33%
Precision:       90.00%
Recall:          100.00%
F1-Score:        94.74%

Confusion Matrix:
  [TN=6, FP=1]
  [FN=0, TP=8]

[+] Successfully saved trained model to: model/phishguard_model.joblib
=================================================================
```

*Note: If `model/phishguard_model.joblib` is absent, PhishGuard automatically runs in **Heuristic Ruleset Engine** mode without crashing.*

---

## 7. Running the Application

Start the Flask development server:
```bash
python app.py
```
Open your web browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 8. Running the Unit Tests

Execute the comprehensive test suite with `pytest`:
```bash
pytest -v
```

To run a specific test suite:
```bash
pytest tests/test_url_analyzer.py -v
pytest tests/test_database.py -v
```

---

## 9. Understanding the Risk Scoring System

The PhishGuard Risk Score ranges from **0 to 100**, categorized as follows:

| Score Range | Risk Level | Interpretation & Guidance |
| :---: | :---: | :--- |
| **0 – 35** | **Low Risk** | URL conforms to legitimate domain conventions. Standard precautions apply. |
| **36 – 69** | **Medium Suspicion** | Multiple anomalies detected (e.g. unencrypted shortener, deep subdomains). Inspect certificate and origin before authenticating. |
| **70 – 100** | **High Risk** | Multiple high-severity red flags (direct IP host, brand impersonation lure, basic auth `@` spoofing). Strong presumption of phishing. Do not submit credentials. |

---

## 10. Security Architecture & SSRF Prevention

PhishGuard adheres to strict defensive security practices:
1. **Zero Outbound HTTP Requests (SSRF Immunity):** The backend never executes `requests.get()` or socket connections to user-submitted links. Inspection is strictly lexical and structural.
2. **Safe Input Normalization:** URLs are stripped of invalid control characters, constrained to $\le 2,048$ bytes, and validated against allowed schemes (`http://`, `https://`).
3. **Parameterized SQL:** All database interactions use parameter substitution (`?`) to prevent SQL injection.
4. **Context-Aware Output Escaping:** User inputs are rendered using Jinja2 autoescaping.

---

## 11. Publishing to GitHub

```bash
git init
git add .
git commit -m "feat: Initial commit of PhishGuard AI URL Detector"
git branch -M main
git remote add origin https://github.com/your-username/phishguard-url-detector.git
git push -u origin main
```

---

## 12. License

This project is licensed under the **MIT License**.
