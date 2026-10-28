# 🛡️ PhishGuard – AI Phishing URL Detector

PhishGuard is a cybersecurity web application that analyzes URLs for potential phishing indicators and helps users recognize suspicious links. It provides risk assessments, explains warning signs, and offers security tips to encourage safer browsing.

## ✨ Features

- 🔍 **URL Scanner:** Analyze URLs for suspicious characteristics.
- 🛡️ **Risk Assessment:** Display estimated risk levels: Low, Medium, or High.
- 🤖 **Machine Learning:** Optionally classify URLs using a trained machine-learning model.
- 📊 **Dashboard:** View scan statistics and risk distributions.
- 🕒 **Scan History:** Review, search, filter, and delete previous scans.
- 📈 **Reports and Charts:** Visualize scan results and export history to CSV.
- 🔐 **Security Tips:** Learn how to identify phishing attempts and protect yourself online.
- 📱 **Responsive Design:** Access the application from desktop, tablet, and mobile devices.
- 💾 **SQLite Database:** Store scan history locally.

## 🛠️ Technologies Used

- Python
- Flask
- HTML5
- CSS3
- JavaScript
- SQLite
- Pandas
- Scikit-learn
- Chart.js

*Machine-learning features require a suitable dataset and a trained model.*

## 📁 Project Structure

```text
phishguard-url-detector/
├── app.py
├── config.py
├── database.py
├── url_analyzer.py
├── train_model.py
├── requirements.txt
├── README.md
├── .gitignore
├── model/
├── data/
├── templates/
├── static/
└── tests/
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/phishguard-url-detector.git
cd phishguard-url-detector
```

Replace `YOUR-USERNAME` with your GitHub username.

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure the application

Create any required environment variables according to the project configuration and initialize the SQLite database using the instructions in the source code.

### 5. Run the application

```bash
python app.py
```

Open the local address shown in the terminal, typically:

```text
http://127.0.0.1:5000
```

## 🧠 Machine Learning Setup

1. Obtain a documented, appropriately licensed dataset containing phishing and legitimate URL labels.
2. Follow the instructions in `data/README.md`.
3. Run the model-training script:

```bash
python train_model.py
```

4. Verify that the trained model and preprocessing pipeline are saved to
