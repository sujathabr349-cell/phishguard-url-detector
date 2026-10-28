import React, { useState } from 'react';
import { 
  FolderTree, 
  FileCode, 
  Copy, 
  Check, 
  Terminal, 
  CheckCircle2,
  FileText
} from 'lucide-react';

interface FileEntry {
  path: string;
  name: string;
  type: 'python' | 'markdown' | 'config' | 'html';
  code: string;
}

const PROJECT_FILES: FileEntry[] = [
  {
    path: 'app.py',
    name: 'app.py',
    type: 'python',
    code: `"""
PhishGuard - Flask Web Application
Main entry point coordinating URL scanning, persistent storage, security reporting,
and educational resources.
"""
from flask import Flask, request, render_template, redirect, url_for, flash, jsonify, Response
import io, csv
from config import get_config
from database import init_db, save_scan, get_all_scans, get_scan_by_id, delete_scan, clear_history, get_dashboard_stats, get_trend_data, get_indicator_frequencies
from url_analyzer import URLPredictor, validate_and_normalize_url

CONFIG = get_config()

def create_app(test_config=None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(test_config or CONFIG)
    init_db(app.config.get("DATABASE_PATH"))
    predictor = URLPredictor(app.config.get("MODEL_PATH"))

    @app.route("/")
    def index():
        recent_scans = get_all_scans(limit=5, db_path=app.config.get("DATABASE_PATH"))
        stats = get_dashboard_stats(db_path=app.config.get("DATABASE_PATH"))
        return render_template("index.html", recent_scans=recent_scans, stats=stats)

    @app.route("/scan", methods=["POST"])
    def scan():
        raw_url = request.form.get("url", "").strip()
        is_valid, normalized, err_msg = validate_and_normalize_url(raw_url)
        if not is_valid:
            flash(err_msg, "error")
            return redirect(url_for("index"))
        analysis = predictor.analyze(normalized)
        scan_id = save_scan(analysis, db_path=app.config.get("DATABASE_PATH"))
        return redirect(url_for("result", scan_id=scan_id))

    @app.route("/result/<int:scan_id>")
    def result(scan_id: int):
        scan_record = get_scan_by_id(scan_id, db_path=app.config.get("DATABASE_PATH"))
        return render_template("result.html", scan=scan_record)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=True)`
  },
  {
    path: 'url_analyzer.py',
    name: 'url_analyzer.py',
    type: 'python',
    code: `"""
PhishGuard - URL Feature Extraction & Risk Scoring Engine
Extracts structural and lexical URL characteristics, calculates heuristic risk weights,
and provides Scikit-learn model inference with a documented fallback engine.
"""
import re, math, ipaddress
from urllib.parse import urlparse
import joblib

KNOWN_SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "is.gd", "ow.ly", "buff.ly", "cutt.ly"}
SUSPICIOUS_KEYWORDS = ["login", "signin", "verify", "update", "security", "account", "banking", "password", "paypal"]
TARGETED_BRANDS = ["paypal", "apple", "google", "microsoft", "netflix", "amazon", "chase"]

def validate_and_normalize_url(raw_url: str):
    if not raw_url or len(raw_url) > 2048:
        return False, "", "Invalid URL length or empty input."
    parsed = urlparse(raw_url.strip())
    if (parsed.scheme or "").lower() not in ("http", "https"):
        return False, "", "Unsupported scheme. Only http:// and https:// allowed."
    if not parsed.hostname:
        return False, "", "Missing destination hostname."
    return True, parsed.geturl(), None

def extract_features(url: str):
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()
    return {
        "url": url,
        "is_https": parsed.scheme.lower() == "https",
        "has_ip": bool(re.match(r"^\\d{1,3}(\\.\\d{1,3}){3}$", hostname)),
        "url_length": len(url),
        "dot_count": hostname.count("."),
        "is_shortener": hostname in KNOWN_SHORTENERS,
        "suspicious_words": [w for w in SUSPICIOUS_KEYWORDS if w in hostname],
        "at_symbol": "@" in url,
        "unusual_port": parsed.port not in (None, 80, 443),
    }

def calculate_heuristic_risk(features):
    score = 0
    indicators = []
    if features["has_ip"]:
        score += 30
        indicators.append({"name": "Direct IP Host", "impact": "+30 pts", "severity": "high"})
    if not features["is_https"]:
        score += 20
        indicators.append({"name": "No HTTPS", "impact": "+20 pts", "severity": "medium"})
    if features["is_shortener"]:
        score += 20
        indicators.append({"name": "URL Shortener", "impact": "+20 pts", "severity": "medium"})
    final_score = min(100, max(0, score))
    level = "High" if final_score >= 70 else "Medium" if final_score >= 36 else "Low"
    return {"risk_score": final_score, "risk_level": level, "indicators": indicators}`
  },
  {
    path: 'train_model.py',
    name: 'train_model.py',
    type: 'python',
    code: `"""
PhishGuard - Machine Learning Model Training Script
Trains a Scikit-learn Random Forest classifier on labeled phishing and legitimate URLs.
"""
import joblib, pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from url_analyzer import extract_features, get_feature_vector

def train_and_evaluate():
    df = pd.read_csv("data/urldata.csv")
    X = [get_feature_vector(extract_features(u)) for u in df["url"]]
    y = df["label"].values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    clf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    print("Accuracy: ", accuracy_score(y_test, y_pred))
    print("Precision:", precision_score(y_test, y_pred))
    print("Recall:   ", recall_score(y_test, y_pred))
    print("F1-Score: ", f1_score(y_test, y_pred))
    joblib.dump(clf, "model/phishguard_model.joblib")
    print("Saved model to model/phishguard_model.joblib")

if __name__ == "__main__":
    train_and_evaluate()`
  },
  {
    path: 'database.py',
    name: 'database.py',
    type: 'python',
    code: `"""
PhishGuard - Database Layer (Parameterized SQLite)
"""
import sqlite3, json

def get_db_connection(db_path="phishguard.db"):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path="phishguard.db"):
    with get_db_connection(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                domain TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                is_https INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def save_scan(scan_data, db_path="phishguard.db"):
    query = "INSERT INTO scans (url, domain, risk_score, risk_level, is_https) VALUES (?, ?, ?, ?, ?)"
    with get_db_connection(db_path) as conn:
        cur = conn.execute(query, (scan_data["url"], scan_data["domain"], scan_data["risk_score"], scan_data["risk_level"], 1 if scan_data["is_https"] else 0))
        return cur.lastrowid`
  },
  {
    path: 'tests/test_url_analyzer.py',
    name: 'test_url_analyzer.py',
    type: 'python',
    code: `import pytest
from url_analyzer import validate_and_normalize_url, extract_features, calculate_heuristic_risk

def test_valid_urls():
    valid, norm, _ = validate_and_normalize_url("https://www.google.com")
    assert valid is True

def test_ip_detection():
    feats = extract_features("http://192.168.1.1/login")
    assert feats["has_ip"] is True

def test_risk_scoring():
    feats = extract_features("http://192.168.1.1:8080/paypal-verify")
    res = calculate_heuristic_risk(feats)
    assert res["risk_level"] == "High"`
  },
  {
    path: 'requirements.txt',
    name: 'requirements.txt',
    type: 'config',
    code: `Flask>=3.0.0
pandas>=2.1.0
scikit-learn>=1.4.0
numpy>=1.26.0
joblib>=1.3.2
pytest>=8.0.0
python-dotenv>=1.0.0`
  }
];

export const CodeExplorerView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileEntry>(PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Python Flask & Machine Learning Source Files
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          All Python, SQLite, Scikit-learn, and test files have been generated in the <code>/phishguard-url-detector/</code> directory.
        </p>
      </div>

      {/* Quick Run Commands Guide */}
      <div className="bg-[#0d1527] border border-cyan-500/25 rounded-xl p-4 sm:p-5 space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span>Local Terminal Execution in VS Code</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-[#070c18] border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-500 block mb-1"># 1. Install Dependencies</span>
            <code className="text-cyan-300">pip install -r requirements.txt</code>
          </div>
          <div className="bg-[#070c18] border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-500 block mb-1"># 2. Train ML Model</span>
            <code className="text-cyan-300">python train_model.py</code>
          </div>
          <div className="bg-[#070c18] border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-500 block mb-1"># 3. Launch Flask Server</span>
            <code className="text-cyan-300">python app.py</code>
          </div>
        </div>
      </div>

      {/* Code Viewer Layout */}
      <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-4">
        {/* File Tree Sidebar */}
        <div className="border-b lg:border-b-0 lg:border-r border-slate-800 p-3 space-y-1 bg-[#090f1d]">
          <span className="text-[11px] font-mono uppercase text-slate-500 px-3 py-1 block">
            Project Files
          </span>
          {PROJECT_FILES.map((file) => (
            <button
              key={file.path}
              type="button"
              onClick={() => setSelectedFile(file)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                selectedFile.path === file.path
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span className="truncate">{file.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Code Content View */}
        <div className="lg:col-span-3 flex flex-col bg-[#070c18]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-[#0d1527]">
            <span className="font-mono text-xs text-slate-300">{selectedFile.path}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy File'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[500px]">
            <code>{selectedFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
