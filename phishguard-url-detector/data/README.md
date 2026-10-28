# PhishGuard Dataset Documentation

## 1. Overview
The PhishGuard machine learning pipeline relies on labeled URL datasets categorized into:
- `0` (Legitimate): Benign, reputable websites operating under standard domain conventions.
- `1` (Phishing): Malicious lures, credential harvesters, smishing links, and brand impersonation endpoints.

## 2. Dataset Sources & Acquisition
For production-grade model scaling beyond the included baseline sample (`data/urldata.csv`), the following public, verified cybersecurity repositories are recommended:

1. **PhishTank** (`https://phishtank.org/`):
   - Community-vetted repository of confirmed phishing URLs updated in near real-time.
   - Download the verified online phishing database in CSV format (`data.phishtank.com/data/online-valid.csv`).

2. **ISCX-URL2016 (University of New Brunswick)** (`https://www.unb.ca/cic/datasets/url-2016.html`):
   - Academic benchmark dataset with over 35,000 legitimate and 10,000 phishing URLs with detailed structural labels.

3. **Tranco List / Alexa Top Domains** (`https://tranco-list.eu/`):
   - Research-oriented ranking of top 1,000,000 web domains representing legitimate traffic profiles to prevent false positives.

## 3. CSV File Format
To train with your own custom dataset, place a CSV file named `urldata.csv` inside this `data/` directory with the following structure:

```csv
url,label
https://www.google.com,0
http://paypal-security-update.com/login,1
```

## 4. Dataset Limitations & Threat Landscape Considerations
- **Temporal Drift**: Attackers constantly rotate top-level domains (.xyz, .top, .cc) and hosting providers. Models trained on historical data may require periodic retraining.
- **Benign Edge Cases**: Highly technical legitimate websites (e.g., local development IPs `http://192.168.1.1` or CDNs with long hash paths) may trigger heuristic warnings.
- **Compromised Legitimate Domains**: Sophisticated phishing actors compromise authenticated WordPress or cPanel sites. The root domain will appear benign while subpaths host phishing forms.
- **Complementary Defense**: URL lexical and structural analysis is an early triage mechanism. It should be coupled with endpoint protection, DNS sinkholing, and multi-factor authentication (MFA).
