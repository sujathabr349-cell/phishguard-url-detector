"""
Unit tests for PhishGuard URL Analyzer
Validates input sanitization, feature extraction, and heuristic risk scoring.
"""

import sys
from pathlib import Path
import pytest

# Ensure parent path is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from url_analyzer import (
    validate_and_normalize_url,
    check_is_ip_address,
    extract_features,
    calculate_heuristic_risk,
    URLPredictor,
)


class TestURLValidation:
    """Tests for input validation and normalization."""

    def test_valid_https_url(self):
        valid, normalized, err = validate_and_normalize_url("https://www.google.com/search?q=cybersecurity")
        assert valid is True
        assert normalized.startswith("https://www.google.com")
        assert err is None

    def test_valid_http_url(self):
        valid, normalized, err = validate_and_normalize_url("http://example.org/path")
        assert valid is True
        assert normalized == "http://example.org/path"
        assert err is None

    def test_missing_scheme_rejection(self):
        valid, _, err = validate_and_normalize_url("example.com/login")
        assert valid is False
        assert "Missing protocol scheme" in err

    def test_unsupported_scheme_rejection(self):
        valid, _, err = validate_and_normalize_url("ftp://ftp.example.com/file.zip")
        assert valid is False
        assert "Unsupported scheme 'ftp'" in err

        valid, _, err = validate_and_normalize_url("javascript:alert(1)")
        assert valid is False
        assert "Unsupported scheme 'javascript'" in err

    def test_empty_input(self):
        valid, _, err = validate_and_normalize_url("")
        assert valid is False
        assert "cannot be empty" in err

    def test_whitespace_and_casing_normalization(self):
        valid, normalized, _ = validate_and_normalize_url("   HTTPS://WwW.ExAmPlE.cOm/Login/Path   ")
        assert valid is True
        assert normalized.startswith("https://www.example.com/Login/Path")


class TestFeatureExtraction:
    """Tests for individual structural and lexical feature detection."""

    def test_ip_address_detection(self):
        assert check_is_ip_address("192.168.1.1") is True
        assert check_is_ip_address("10.0.0.254") is True
        assert check_is_ip_address("218.45.109.22") is True
        assert check_is_ip_address("example.com") is False
        assert check_is_ip_address("google.com") is False

    def test_shortener_detection(self):
        feats = extract_features("https://bit.ly/3xTestingShortener")
        assert feats["is_shortener"] is True

        feats_normal = extract_features("https://github.com/torvalds/linux")
        assert feats_normal["is_shortener"] is False

    def test_at_symbol_detection(self):
        feats = extract_features("http://legitimate.com@evil-phish.net/login")
        assert feats["at_symbol_count"] == 1

    def test_unusual_port_detection(self):
        feats_custom = extract_features("http://192.168.1.50:8080/admin")
        assert feats_custom["unusual_port"] is True
        assert feats_custom["port"] == 8080

        feats_standard = extract_features("https://example.com/path")
        assert feats_standard["unusual_port"] is False

    def test_suspicious_keywords_in_host(self):
        feats = extract_features("http://paypal-security-update-verify.com/login")
        assert "paypal" in feats["suspicious_words_host"] or "verify" in feats["suspicious_words_host"]
        assert feats["suspicious_words_count"] >= 2


class TestRiskAssessment:
    """Tests for transparent heuristic scoring logic and risk tier assignment."""

    def test_legitimate_url_low_risk(self):
        feats = extract_features("https://www.google.com")
        res = calculate_heuristic_risk(feats)
        assert res["risk_level"] == "Low"
        assert res["risk_score"] < 36
        assert len(res["precautions"]) > 0

    def test_high_risk_phishing_combination(self):
        # Direct IP + HTTP + Suspicious auth keywords + Unusual port
        feats = extract_features("http://198.51.100.22:8080/login/paypal-verification-update")
        res = calculate_heuristic_risk(feats)
        assert res["risk_level"] == "High"
        assert res["risk_score"] >= 70
        assert len(res["indicators"]) >= 3

    def test_medium_risk_unencrypted_shortener(self):
        feats = extract_features("http://bit.ly/short-doc-link")
        res = calculate_heuristic_risk(feats)
        assert res["risk_level"] in ("Medium", "High")
        assert res["risk_score"] >= 36

    def test_predictor_class_fallback(self):
        # Predictor initialized without trained model file operates in Heuristic mode
        predictor = URLPredictor(model_path="non_existent_model.joblib")
        assert predictor.model_loaded is False
        result = predictor.analyze("https://www.wikipedia.org/wiki/Main_Page")
        assert result["risk_level"] == "Low"
        assert "Heuristic" in result["analysis_mode"]
