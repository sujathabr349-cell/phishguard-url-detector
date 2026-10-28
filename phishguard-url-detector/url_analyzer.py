"""
PhishGuard - URL Feature Extraction & Risk Scoring Engine
Extracts structural and lexical URL characteristics, calculates heuristic risk weights,
and provides Scikit-learn model inference with a documented fallback engine.
"""

import ipaddress
import math
import os
import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse
import joblib

# Known URL shortener services often leveraged in phishing campaigns
KNOWN_SHORTENERS = {
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "is.gd", "cli.gs", "yfrog.com",
    "migre.me", "ff.im", "tiny.cc", "url4.eu", "twit.ac", "su.pr", "twurl.nl",
    "snipurl.com", "short.to", "ow.ly", "buff.ly", "cutt.ly", "rebrand.ly",
    "qr.ae", "adf.ly", "bc.vc", "shorte.st"
}

# Suspicious words frequently abused in phishing subdomains/hostnames
SUSPICIOUS_KEYWORDS = [
    "login", "signin", "verify", "verification", "update", "security",
    "secure", "account", "banking", "authenticate", "password", "credential",
    "confirm", "confirmation", "support", "billing", "invoice", "appleid",
    "paypal", "wallet", "recover", "suspicious", "webscr", "ebayisapi"
]

# High-profile brand names frequently targeted for domain typosquatting
TARGETED_BRANDS = [
    "paypal", "apple", "google", "microsoft", "netflix", "amazon", "facebook",
    "instagram", "chase", "wellsfargo", "bankofamerica", "coinbase", "binance",
    "dropbox", "dhl", "fedex", "usps", "docuSign"
]


def calculate_entropy(text: str) -> float:
    """Calculate the Shannon entropy of a string to detect random character strings."""
    if not text:
        return 0.0
    probabilities = [float(text.count(c)) / len(text) for c in set(text)]
    return -sum(p * math.log2(p) for p in probabilities)


def validate_and_normalize_url(raw_url: str) -> Tuple[bool, str, Optional[str]]:
    """
    Validate input URL structure and normalize safely.
    Returns: (is_valid, normalized_url_or_empty, error_message_or_none)
    """
    if not raw_url or not isinstance(raw_url, str):
        return False, "", "URL cannot be empty."

    cleaned = raw_url.strip()

    if len(cleaned) > 2048:
        return False, "", "URL exceeds the maximum allowable length of 2,048 characters."

    # Reject non-printable ASCII or control characters
    if any(ord(char) < 32 or ord(char) == 127 for char in cleaned):
        return False, "", "URL contains invalid control characters or non-printable bytes."

    # Parse scheme
    if "://" not in cleaned:
        # Check if user typed without scheme, e.g. 'example.com'
        # Per specification: "Accept only HTTP and HTTPS URLs. Reject malformed input and unsupported schemes."
        return False, "", "Missing protocol scheme. Please enter a full URL starting with http:// or https://"

    try:
        parsed = urlparse(cleaned)
    except Exception as exc:
        return False, "", f"Malformed URL syntax: {str(exc)}"

    scheme = (parsed.scheme or "").lower()
    if scheme not in ("http", "https"):
        return False, "", f"Unsupported scheme '{scheme}'. PhishGuard only evaluates http:// and https:// URLs."

    hostname = (parsed.hostname or "").strip().lower()
    if not hostname:
        return False, "", "Invalid URL: Missing a valid destination hostname."

    # Validate hostname syntax
    if " " in hostname or "\\" in hostname:
        return False, "", "Invalid URL: Hostname contains invalid whitespace or slashes."

    # Normalize: Scheme and hostname lowercased, retain path/query formatting
    port_str = f":{parsed.port}" if parsed.port and parsed.port not in (80, 443) else ""
    path_str = parsed.path if parsed.path else ""
    query_str = f"?{parsed.query}" if parsed.query else ""
    fragment_str = f"#{parsed.fragment}" if parsed.fragment else ""

    normalized = f"{scheme}://{hostname}{port_str}{path_str}{query_str}{fragment_str}"
    return True, normalized, None


def check_is_ip_address(hostname: str) -> bool:
    """Check if the given hostname is a literal IPv4 or IPv6 address."""
    # Strip brackets for IPv6 if present
    cleaned = hostname.strip("[]")
    try:
        ipaddress.ip_address(cleaned)
        return True
    except ValueError:
        # Check regex for IPv4 with port or hex representation
        ipv4_pattern = r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
        return bool(re.match(ipv4_pattern, cleaned))


def extract_features(url: str) -> Dict[str, Any]:
    """
    Extract structural, lexical, and behavioral features from a validated URL.
    """
    parsed = urlparse(url)
    scheme = (parsed.scheme or "").lower()
    hostname = (parsed.hostname or "").lower()
    path = parsed.path or ""
    query = parsed.query or ""
    full_url = url.strip()

    is_https = scheme == "https"
    has_ip = check_is_ip_address(hostname)
    url_len = len(full_url)
    hostname_len = len(hostname)
    path_len = len(path)

    # Subdomain and dot breakdown
    dot_count = hostname.count(".")
    parts = [p for p in hostname.split(".") if p]

    # Calculate subdomains: e.g., 'sub.login.example.com' -> sub, login
    if has_ip:
        subdomain_count = 0
    elif len(parts) > 2:
        # crude approximation accounting for common 2-level ccTLDs (.co.uk, .com.br)
        is_cctld_2level = len(parts) >= 3 and parts[-2] in ("co", "com", "net", "org", "gov", "edu") and len(parts[-1]) == 2
        root_parts = 3 if is_cctld_2level else 2
        subdomain_count = max(0, len(parts) - root_parts)
    else:
        subdomain_count = 0

    # Shortener check
    is_shortener = hostname in KNOWN_SHORTENERS

    # Suspicious keywords in hostname or path
    found_suspicious_words_host = [w for w in SUSPICIOUS_KEYWORDS if w in hostname]
    found_suspicious_words_path = [w for w in SUSPICIOUS_KEYWORDS if w in path.lower()]

    # Brand spoofing check: Brand name appears in subdomain when not root domain
    suspected_brand_spoofing = []
    if not has_ip and len(parts) > 2:
        root_domain = ".".join(parts[-2:])
        for brand in TARGETED_BRANDS:
            if brand in hostname and brand not in root_domain:
                suspected_brand_spoofing.append(brand)

    # Unusual symbols
    at_symbol_count = full_url.count("@")
    hyphen_count_host = hostname.count("-")
    hyphen_count_total = full_url.count("-")
    double_slash_in_path = "//" in path
    underscore_count = full_url.count("_")
    percent_count = full_url.count("%")
    has_url_encoding = "%" in full_url or bool(re.search(r"%[0-9a-fA-F]{2}", full_url))
    tilde_count = full_url.count("~")

    # Port analysis
    unusual_port = False
    port_number = parsed.port
    if port_number and port_number not in (80, 443):
        unusual_port = True

    # Entropy
    host_entropy = round(calculate_entropy(hostname), 2)

    # Punycode / IDN
    has_punycode = "xn--" in hostname

    # Hexadecimal sequence in host
    has_hex_sequence = bool(re.search(r"0x[0-9a-fA-F]+", hostname))

    return {
        "url": full_url,
        "scheme": scheme,
        "hostname": hostname,
        "path": path,
        "query": query,
        "is_https": is_https,
        "has_ip": has_ip,
        "url_length": url_len,
        "hostname_length": hostname_len,
        "path_length": path_len,
        "dot_count": dot_count,
        "subdomain_count": subdomain_count,
        "is_shortener": is_shortener,
        "suspicious_words_host": found_suspicious_words_host,
        "suspicious_words_path": found_suspicious_words_path,
        "suspicious_words_count": len(found_suspicious_words_host) + len(found_suspicious_words_path),
        "suspected_brand_spoofing": suspected_brand_spoofing,
        "at_symbol_count": at_symbol_count,
        "hyphen_count_host": hyphen_count_host,
        "hyphen_count_total": hyphen_count_total,
        "double_slash_in_path": double_slash_in_path,
        "underscore_count": underscore_count,
        "percent_count": percent_count,
        "has_url_encoding": has_url_encoding,
        "tilde_count": tilde_count,
        "unusual_symbols_count": at_symbol_count + (1 if double_slash_in_path else 0) + percent_count + tilde_count,
        "port": port_number,
        "unusual_port": unusual_port,
        "host_entropy": host_entropy,
        "has_punycode": has_punycode,
        "has_hex_sequence": has_hex_sequence,
    }


def calculate_heuristic_risk(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate an interpretable heuristic risk score from 0 to 100 based on weighted security rules.
    Transparent, documented, and deterministic.
    """
    score = 0
    indicators: List[Dict[str, Any]] = []

    # 1. IP address instead of domain name (+30 pts)
    if features["has_ip"]:
        score += 30
        indicators.append({
            "name": "Host Uses Direct IP Address",
            "impact": "+30 pts",
            "severity": "high",
            "description": "Legitimate websites almost always use domain names. Direct IP addresses are commonly used in phishing campaigns to bypass DNS reputation filters and domain registration vetting."
        })

    # 2. No HTTPS encryption (+20 pts)
    if not features["is_https"]:
        score += 20
        indicators.append({
            "name": "Unencrypted HTTP Protocol",
            "impact": "+20 pts",
            "severity": "medium",
            "description": "Traffic is sent over plaintext without SSL/TLS certificates, exposing credentials and session data to eavesdropping and manipulation."
        })

    # 3. URL Shortener (+20 pts)
    if features["is_shortener"]:
        score += 20
        indicators.append({
            "name": "URL Shortening Service",
            "impact": "+20 pts",
            "severity": "medium",
            "description": "Shorteners mask the true destination URL. Attackers frequently use shorteners to disguise deceptive domains in SMS (smishing) and email campaigns."
        })

    # 4. Brand spoofing / typosquatting (+35 pts)
    if features["suspected_brand_spoofing"]:
        brands_str = ", ".join(features["suspected_brand_spoofing"])
        score += 35
        indicators.append({
            "name": f"Targeted Brand Mimicry ({brands_str})",
            "impact": "+35 pts",
            "severity": "high",
            "description": f"The hostname references recognized brand name(s) ({brands_str}) in a subdomain or auxiliary prefix rather than the authentic root domain, strongly suggesting a credential phishing lure."
        })

    # 5. Suspicious keywords in hostname (+20 pts)
    if features["suspicious_words_host"]:
        words_str = ", ".join(features["suspicious_words_host"])
        score += 20
        indicators.append({
            "name": "Deceptive Authentication Keywords in Hostname",
            "impact": "+20 pts",
            "severity": "high",
            "description": f"Hostname includes deceptive keywords ({words_str}) commonly used to trick users into believing they are visiting an official authentication or billing portal."
        })
    elif features["suspicious_words_path"]:
        words_str = ", ".join(features["suspicious_words_path"][:3])
        score += 10
        indicators.append({
            "name": "Suspicious Keywords in Path",
            "impact": "+10 pts",
            "severity": "medium",
            "description": f"URL path includes keywords ({words_str}) targeting account security or login workflows."
        })

    # 6. '@' Symbol in URL (+25 pts)
    if features["at_symbol_count"] > 0:
        score += 25
        indicators.append({
            "name": "At Symbol (@) in URL",
            "impact": "+25 pts",
            "severity": "high",
            "description": "Browsers interpret the text before an '@' symbol as HTTP basic authentication credentials and navigate to whatever follows. Phishers use this to display a fake domain in the leading text."
        })

    # 7. Double slashes in path (+15 pts)
    if features["double_slash_in_path"]:
        score += 15
        indicators.append({
            "name": "Double Slashes in URL Path",
            "impact": "+15 pts",
            "severity": "medium",
            "description": "Double slashes (//) inside the path are often used for open redirects or URL parser confusion to evade simple URL matchers."
        })

    # 8. Excessive URL length (+15 pts for >100, +8 for >75)
    if features["url_length"] > 100:
        score += 15
        indicators.append({
            "name": f"Abnormally Long URL ({features['url_length']} characters)",
            "impact": "+15 pts",
            "severity": "medium",
            "description": "Excessively long URLs are often engineered to push the real domain name off-screen on mobile devices and narrow browser address bars."
        })
    elif features["url_length"] > 75:
        score += 8
        indicators.append({
            "name": f"Extended URL Length ({features['url_length']} characters)",
            "impact": "+8 pts",
            "severity": "low",
            "description": "The URL length is noticeably above the typical median of 40–55 characters."
        })

    # 9. Deep subdomains (>2) (+15 pts)
    if features["subdomain_count"] >= 3:
        score += 15
        indicators.append({
            "name": f"Excessive Subdomain Depth ({features['subdomain_count']} levels)",
            "impact": "+15 pts",
            "severity": "medium",
            "description": "Multiple subdomain layers are frequently configured by phishers on free or compromised DNS zones to mimic legitimate brand URLs."
        })
    elif features["subdomain_count"] == 2:
        score += 8
        indicators.append({
            "name": "Multiple Subdomains (2 levels)",
            "impact": "+8 pts",
            "severity": "low",
            "description": "Contains two subdomain levels preceding the registered root domain."
        })

    # 10. Multiple hyphens in hostname (+12 pts)
    if features["hyphen_count_host"] >= 2:
        score += 12
        indicators.append({
            "name": f"Multiple Hyphens in Hostname ({features['hyphen_count_host']} hyphens)",
            "impact": "+12 pts",
            "severity": "medium",
            "description": "Hyphens are used to chain deceptive brand names together (e.g., 'paypal-security-update.com') in malicious registrations."
        })

    # 11. Unusual Port (+18 pts)
    if features["unusual_port"]:
        score += 18
        indicators.append({
            "name": f"Non-Standard Port ({features['port']})",
            "impact": "+18 pts",
            "severity": "medium",
            "description": f"The URL directs traffic to port {features['port']} rather than standard port 80 (HTTP) or 443 (HTTPS), which is unusual for reputable public web services."
        })

    # 12. Punycode / Internationalized Domain Name (+20 pts)
    if features["has_punycode"]:
        score += 20
        indicators.append({
            "name": "Punycode / IDN Homoglyph Encoding (xn--)",
            "impact": "+20 pts",
            "severity": "high",
            "description": "Punycode is frequently abused in homograph attacks to substitute Cyrillic or Greek lookalike characters for Latin letters in famous domain names."
        })

    # 13. URL Encoding in Host or Path (+10 pts)
    if features["has_url_encoding"] and features["percent_count"] >= 2:
        score += 10
        indicators.append({
            "name": "Heavy Hex / Percent-Encoding",
            "impact": "+10 pts",
            "severity": "low",
            "description": "Hex escapes are sometimes used to disguise executable extensions or characters from automated gateway inspection."
        })

    # Cap score at 100
    final_score = min(100, max(0, score))

    # Classify Risk Level
    if final_score >= 70:
        risk_level = "High"
        summary = "This URL exhibits multiple high-confidence phishing indicators. Proceeding to this link carries significant risk of credential theft, session hijacking, or malicious payload delivery."
        precautions = [
            "Do NOT enter passwords, email addresses, credit cards, or personal credentials on this site.",
            "Do NOT download files or authorize browser notification requests.",
            "If this link arrived via email, SMS, or direct message, report it as phishing to your security administrator or service provider.",
            "Visit the legitimate organization by typing their known official address directly into a clean browser tab."
        ]
    elif final_score >= 36:
        risk_level = "Medium"
        summary = "This URL displays several suspicious structural or lexical characteristics commonly observed in deceptive websites. While not conclusive proof of malicious intent, heightened caution is warranted."
        precautions = [
            "Verify the exact spelling of the domain before interacting with the page.",
            "Check that the address bar displays a valid SSL certificate issued to the expected organization.",
            "Avoid signing into personal or financial accounts through links originating from unsolicited messages.",
            "Consider searching for the intended service using a reputable search engine instead of clicking this link."
        ]
    else:
        risk_level = "Low"
        summary = "The analyzed URL adheres to standard naming and architectural conventions with few or no structural red flags. Note: Low risk is an estimate based on URL syntax and does not guarantee that the destination server is completely harmless."
        precautions = [
            "Maintain standard digital safety habits when browsing.",
            "Ensure your browser and operating system security updates are applied.",
            "Look for reputable HTTPS certificates and verify the organization identity on sensitive forms.",
            "Remember that newly compromised legitimate sites can sometimes pass structural URL checks."
        ]

    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "indicators": indicators,
        "explanation_summary": summary,
        "precautions": precautions,
    }


def get_feature_vector(features: Dict[str, Any]) -> List[float]:
    """
    Convert dictionary of extracted features into a fixed numerical vector for Scikit-learn inference.
    Matching the order in train_model.py:
    [url_length, dot_count, subdomain_count, is_https, has_ip, is_shortener,
     suspicious_words_count, hyphen_count_host, unusual_symbols_count, unusual_port,
     has_punycode, host_entropy]
    """
    return [
        float(features["url_length"]),
        float(features["dot_count"]),
        float(features["subdomain_count"]),
        1.0 if features["is_https"] else 0.0,
        1.0 if features["has_ip"] else 0.0,
        1.0 if features["is_shortener"] else 0.0,
        float(features["suspicious_words_count"]),
        float(features["hyphen_count_host"]),
        float(features["unusual_symbols_count"]),
        1.0 if features["unusual_port"] else 0.0,
        1.0 if features["has_punycode"] else 0.0,
        float(features["host_entropy"]),
    ]


FEATURE_NAMES = [
    "url_length",
    "dot_count",
    "subdomain_count",
    "is_https",
    "has_ip",
    "is_shortener",
    "suspicious_words_count",
    "hyphen_count_host",
    "unusual_symbols_count",
    "unusual_port",
    "has_punycode",
    "host_entropy",
]


class URLPredictor:
    """
    Manages Scikit-learn model loading and inference with graceful heuristic fallback.
    """
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self.model = None
        self.model_loaded = False
        self.load_error = None
        self._try_load()

    def _try_load(self):
        if self.model_path and os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                self.model_loaded = True
                self.load_error = None
            except Exception as e:
                self.model = None
                self.model_loaded = False
                self.load_error = str(e)
        else:
            self.model = None
            self.model_loaded = False
            self.load_error = "Model file not found on disk. Operating in Heuristic Ruleset mode."

    def analyze(self, raw_url: str) -> Dict[str, Any]:
        """
        Execute full pipeline: Validate -> Extract -> Heuristic Score -> ML Predict (if available).
        """
        is_valid, normalized_url, err = validate_and_normalize_url(raw_url)
        if not is_valid:
            raise ValueError(err)

        features = extract_features(normalized_url)
        heuristic_result = calculate_heuristic_risk(features)

        ml_probability = None
        analysis_mode = "Heuristic Ruleset Engine"

        if self.model_loaded and self.model is not None:
            try:
                vec = [get_feature_vector(features)]
                # Scikit-learn predict_proba returns [[prob_legit, prob_phish]]
                probs = self.model.predict_proba(vec)[0]
                # Assuming class 1 is phishing
                phish_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
                ml_probability = round(phish_prob, 4)
                analysis_mode = "Trained Random Forest Classifier + Heuristic Ruleset"

                # Ensemble combination: blend ML probability with structural heuristic
                ml_score = int(phish_prob * 100)
                blended_score = int(0.55 * heuristic_result["risk_score"] + 0.45 * ml_score)
                heuristic_result["risk_score"] = min(100, max(0, blended_score))

                # Re-evaluate level with blended score
                if heuristic_result["risk_score"] >= 70:
                    heuristic_result["risk_level"] = "High"
                elif heuristic_result["risk_score"] >= 36:
                    heuristic_result["risk_level"] = "Medium"
                else:
                    heuristic_result["risk_level"] = "Low"
            except Exception as e:
                analysis_mode = f"Heuristic Ruleset Engine (ML error: {str(e)})"

        return {
            "url": raw_url,
            "normalized_url": normalized_url,
            "domain": features["hostname"],
            "risk_score": heuristic_result["risk_score"],
            "risk_level": heuristic_result["risk_level"],
            "is_https": features["is_https"],
            "has_ip": features["has_ip"],
            "url_length": features["url_length"],
            "dot_count": features["dot_count"],
            "subdomain_count": features["subdomain_count"],
            "suspicious_words_count": features["suspicious_words_count"],
            "shortener_detected": features["is_shortener"],
            "unusual_port": features["unusual_port"],
            "unusual_symbols_count": features["unusual_symbols_count"],
            "analysis_mode": analysis_mode,
            "ml_probability": ml_probability,
            "explanation_summary": heuristic_result["explanation_summary"],
            "indicators": heuristic_result["indicators"],
            "precautions": heuristic_result["precautions"],
            "features_raw": features,
        }
