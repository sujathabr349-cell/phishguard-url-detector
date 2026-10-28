"""
Unit tests for PhishGuard Database Layer
Validates SQLite table initialization, CRUD operations, parameterized security,
and aggregate telemetry calculation.
"""

import sys
from pathlib import Path
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from database import (
    init_db,
    save_scan,
    get_all_scans,
    get_scan_by_id,
    delete_scan,
    clear_history,
    get_dashboard_stats,
    get_indicator_frequencies,
    get_trend_data,
)


@pytest.fixture
def temp_db(tmp_path):
    """Provides a fresh isolated SQLite database for each test run."""
    db_file = str(tmp_path / "test_phishguard.db")
    init_db(db_file)
    return db_file


class TestDatabaseOperations:
    """Test suite covering database interactions."""

    def test_init_and_save_scan(self, temp_db):
        scan_data = {
            "url": "http://paypal-security-update.xyz/login",
            "normalized_url": "http://paypal-security-update.xyz/login",
            "domain": "paypal-security-update.xyz",
            "risk_score": 75,
            "risk_level": "High",
            "is_https": False,
            "has_ip": False,
            "url_length": 42,
            "dot_count": 2,
            "subdomain_count": 1,
            "suspicious_words_count": 2,
            "shortener_detected": False,
            "unusual_port": False,
            "unusual_symbols_count": 0,
            "analysis_mode": "Heuristic Ruleset",
            "explanation_summary": "High risk test sample.",
            "indicators": [{"name": "Suspicious Keyword", "impact": "+20 pts", "severity": "high"}],
            "precautions": ["Do not open link."]
        }

        scan_id = save_scan(scan_data, db_path=temp_db)
        assert scan_id > 0

        # Retrieve record by ID
        record = get_scan_by_id(scan_id, db_path=temp_db)
        assert record is not None
        assert record["domain"] == "paypal-security-update.xyz"
        assert record["risk_score"] == 75
        assert record["risk_level"] == "High"
        assert len(record["indicators"]) == 1

    def test_search_and_filter(self, temp_db):
        sample_low = {
            "url": "https://www.google.com",
            "normalized_url": "https://www.google.com",
            "domain": "google.com",
            "risk_score": 10,
            "risk_level": "Low",
            "is_https": True,
            "indicators": [],
            "precautions": []
        }
        sample_high = {
            "url": "http://192.168.1.55/login.php",
            "normalized_url": "http://192.168.1.55/login.php",
            "domain": "192.168.1.55",
            "risk_score": 85,
            "risk_level": "High",
            "is_https": False,
            "has_ip": True,
            "indicators": [],
            "precautions": []
        }
        save_scan(sample_low, db_path=temp_db)
        save_scan(sample_high, db_path=temp_db)

        # Filter by risk level
        highs = get_all_scans(risk_filter="high", db_path=temp_db)
        assert len(highs) == 1
        assert highs[0]["risk_level"] == "High"

        lows = get_all_scans(risk_filter="low", db_path=temp_db)
        assert len(lows) == 1
        assert lows[0]["risk_level"] == "Low"

        # Search query by keyword
        searched = get_all_scans(search_query="google", db_path=temp_db)
        assert len(searched) == 1
        assert searched[0]["domain"] == "google.com"

    def test_dashboard_aggregates(self, temp_db):
        sample1 = {"url": "https://a.com", "normalized_url": "https://a.com", "domain": "a.com", "risk_score": 20, "risk_level": "Low"}
        sample2 = {"url": "http://b.com", "normalized_url": "http://b.com", "domain": "b.com", "risk_score": 50, "risk_level": "Medium"}
        sample3 = {"url": "http://c.com", "normalized_url": "http://c.com", "domain": "c.com", "risk_score": 80, "risk_level": "High"}

        save_scan(sample1, db_path=temp_db)
        save_scan(sample2, db_path=temp_db)
        save_scan(sample3, db_path=temp_db)

        stats = get_dashboard_stats(db_path=temp_db)
        assert stats["total_scans"] == 3
        assert stats["high_risk"] == 1
        assert stats["medium_risk"] == 1
        assert stats["low_risk"] == 1
        assert stats["suspicious_total"] == 2
        assert stats["avg_risk_score"] == 50.0

    def test_delete_and_clear_history(self, temp_db):
        s1 = {"url": "https://sample.com", "normalized_url": "https://sample.com", "domain": "sample.com", "risk_score": 15, "risk_level": "Low"}
        scan_id = save_scan(s1, db_path=temp_db)

        # Delete single record
        deleted = delete_scan(scan_id, db_path=temp_db)
        assert deleted is True

        not_found = get_scan_by_id(scan_id, db_path=temp_db)
        assert not_found is None

        # Add records and clear all
        save_scan(s1, db_path=temp_db)
        save_scan(s1, db_path=temp_db)
        cleared_count = clear_history(db_path=temp_db)
        assert cleared_count == 2

        all_scans = get_all_scans(db_path=temp_db)
        assert len(all_scans) == 0
