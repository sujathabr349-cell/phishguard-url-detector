"""
PhishGuard - Database Layer
Provides parameterized SQLite operations for persistent scan history and dashboard statistics.
"""

import json
import sqlite3
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from config import get_config

CONFIG = get_config()


def get_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """
    Establish a safe SQLite connection with row dictionary mapping and foreign key support.
    """
    target_path = db_path or CONFIG.DATABASE_PATH
    conn = sqlite3.connect(target_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(db_path: Optional[str] = None) -> None:
    """
    Initialize the database schema if tables do not exist.
    """
    conn = get_db_connection(db_path)
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                normalized_url TEXT NOT NULL,
                domain TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                is_https INTEGER NOT NULL,
                has_ip INTEGER NOT NULL,
                url_length INTEGER NOT NULL,
                dot_count INTEGER NOT NULL,
                subdomain_count INTEGER NOT NULL,
                suspicious_words_count INTEGER NOT NULL,
                shortener_detected INTEGER NOT NULL,
                unusual_port INTEGER NOT NULL,
                unusual_symbols_count INTEGER NOT NULL,
                analysis_mode TEXT NOT NULL,
                ml_probability REAL,
                explanation_summary TEXT NOT NULL,
                indicators_json TEXT NOT NULL,
                precautions_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans (created_at DESC)
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_scans_risk_level ON scans (risk_level)
        """)
    conn.close()


def save_scan(scan_data: Dict[str, Any], db_path: Optional[str] = None) -> int:
    """
    Persist a scan result using parameterized statements to prevent SQL injection.
    Returns the newly inserted row ID.
    """
    conn = get_db_connection(db_path)
    indicators_str = json.dumps(scan_data.get("indicators", []))
    precautions_str = json.dumps(scan_data.get("precautions", []))

    query = """
        INSERT INTO scans (
            url, normalized_url, domain, risk_score, risk_level,
            is_https, has_ip, url_length, dot_count, subdomain_count,
            suspicious_words_count, shortener_detected, unusual_port, unusual_symbols_count,
            analysis_mode, ml_probability, explanation_summary,
            indicators_json, precautions_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    timestamp = scan_data.get("created_at") or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    with conn:
        cursor = conn.execute(query, (
            scan_data["url"],
            scan_data["normalized_url"],
            scan_data["domain"],
            int(scan_data["risk_score"]),
            scan_data["risk_level"],
            1 if scan_data.get("is_https") else 0,
            1 if scan_data.get("has_ip") else 0,
            int(scan_data.get("url_length", 0)),
            int(scan_data.get("dot_count", 0)),
            int(scan_data.get("subdomain_count", 0)),
            int(scan_data.get("suspicious_words_count", 0)),
            1 if scan_data.get("shortener_detected") else 0,
            1 if scan_data.get("unusual_port") else 0,
            int(scan_data.get("unusual_symbols_count", 0)),
            scan_data.get("analysis_mode", "Heuristic Engine"),
            scan_data.get("ml_probability"),
            scan_data.get("explanation_summary", ""),
            indicators_str,
            precautions_str,
            timestamp
        ))
        scan_id = cursor.lastrowid
    conn.close()
    return scan_id


def get_all_scans(
    limit: int = 100,
    search_query: str = "",
    risk_filter: str = "",
    date_filter: str = "",
    db_path: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Retrieve scans matching optional search query, risk level, or date range.
    """
    conn = get_db_connection(db_path)
    base_query = "SELECT * FROM scans WHERE 1=1"
    params: List[Any] = []

    if search_query:
        base_query += " AND (url LIKE ? OR domain LIKE ?)"
        wildcard = f"%{search_query.strip()}%"
        params.extend([wildcard, wildcard])

    if risk_filter and risk_filter.lower() in ("low", "medium", "high"):
        base_query += " AND LOWER(risk_level) = ?"
        params.append(risk_filter.lower())

    if date_filter:
        # e.g., 'today', '7days', '30days'
        now = datetime.utcnow()
        if date_filter == "today":
            start_date = now.strftime("%Y-%m-%d 00:00:00")
            base_query += " AND created_at >= ?"
            params.append(start_date)
        elif date_filter == "7days":
            start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d 00:00:00")
            base_query += " AND created_at >= ?"
            params.append(start_date)
        elif date_filter == "30days":
            start_date = (now - timedelta(days=30)).strftime("%Y-%m-%d 00:00:00")
            base_query += " AND created_at >= ?"
            params.append(start_date)

    base_query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    cursor = conn.execute(base_query, tuple(params))
    rows = cursor.fetchall()
    results = []
    for row in rows:
        item = dict(row)
        try:
            item["indicators"] = json.loads(item["indicators_json"])
        except (TypeError, json.JSONDecodeError):
            item["indicators"] = []
        try:
            item["precautions"] = json.loads(item["precautions_json"])
        except (TypeError, json.JSONDecodeError):
            item["precautions"] = []
        results.append(item)
    conn.close()
    return results


def get_scan_by_id(scan_id: int, db_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Fetch a single scan by primary key.
    """
    conn = get_db_connection(db_path)
    cursor = conn.execute("SELECT * FROM scans WHERE id = ?", (scan_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    item = dict(row)
    try:
        item["indicators"] = json.loads(item["indicators_json"])
    except (TypeError, json.JSONDecodeError):
        item["indicators"] = []
    try:
        item["precautions"] = json.loads(item["precautions_json"])
    except (TypeError, json.JSONDecodeError):
        item["precautions"] = []
    return item


def delete_scan(scan_id: int, db_path: Optional[str] = None) -> bool:
    """
    Delete a single scan record.
    """
    conn = get_db_connection(db_path)
    with conn:
        cursor = conn.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
        deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def clear_history(db_path: Optional[str] = None) -> int:
    """
    Delete all stored scan records. Returns total count removed.
    """
    conn = get_db_connection(db_path)
    with conn:
        cursor = conn.execute("DELETE FROM scans")
        count = cursor.rowcount
    conn.close()
    return count


def get_dashboard_stats(db_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Calculate real-time dashboard aggregates strictly from the database.
    """
    conn = get_db_connection(db_path)
    cursor = conn.execute("""
        SELECT
            COUNT(*) as total_count,
            SUM(CASE WHEN LOWER(risk_level) = 'high' THEN 1 ELSE 0 END) as high_risk_count,
            SUM(CASE WHEN LOWER(risk_level) = 'medium' THEN 1 ELSE 0 END) as medium_risk_count,
            SUM(CASE WHEN LOWER(risk_level) = 'low' THEN 1 ELSE 0 END) as low_risk_count,
            AVG(risk_score) as avg_score
        FROM scans
    """)
    row = cursor.fetchone()
    conn.close()

    total = row["total_count"] or 0
    high = row["high_risk_count"] or 0
    med = row["medium_risk_count"] or 0
    low = row["low_risk_count"] or 0
    avg_score = round(float(row["avg_score"] or 0), 1)

    return {
        "total_scans": total,
        "high_risk": high,
        "medium_risk": med,
        "low_risk": low,
        "suspicious_total": high + med,
        "avg_risk_score": avg_score,
    }


def get_trend_data(days: int = 7, db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Return daily scan counts for the past N days.
    """
    conn = get_db_connection(db_path)
    start_date = (datetime.utcnow() - timedelta(days=days - 1)).strftime("%Y-%m-%d 00:00:00")

    query = """
        SELECT
            DATE(created_at) as scan_date,
            COUNT(*) as total,
            SUM(CASE WHEN LOWER(risk_level) = 'high' THEN 1 ELSE 0 END) as high_count,
            SUM(CASE WHEN LOWER(risk_level) = 'medium' THEN 1 ELSE 0 END) as medium_count,
            SUM(CASE WHEN LOWER(risk_level) = 'low' THEN 1 ELSE 0 END) as low_count
        FROM scans
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY scan_date ASC
    """
    cursor = conn.execute(query, (start_date,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_indicator_frequencies(db_path: Optional[str] = None) -> Dict[str, int]:
    """
    Count occurrences of top threat indicators across all scans.
    """
    conn = get_db_connection(db_path)
    cursor = conn.execute("""
        SELECT
            SUM(has_ip) as ip_count,
            SUM(CASE WHEN is_https = 0 THEN 1 ELSE 0 END) as no_https_count,
            SUM(CASE WHEN url_length > 75 THEN 1 ELSE 0 END) as long_url_count,
            SUM(CASE WHEN dot_count > 3 THEN 1 ELSE 0 END) as excessive_dots_count,
            SUM(CASE WHEN subdomain_count > 2 THEN 1 ELSE 0 END) as deep_subdomain_count,
            SUM(CASE WHEN suspicious_words_count > 0 THEN 1 ELSE 0 END) as suspicious_keywords_count,
            SUM(shortener_detected) as shortener_count,
            SUM(unusual_port) as unusual_port_count,
            SUM(CASE WHEN unusual_symbols_count > 0 THEN 1 ELSE 0 END) as unusual_symbols_count
        FROM scans
    """)
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {}

    return {
        "IP Address as Hostname": row["ip_count"] or 0,
        "No HTTPS Encryption": row["no_https_count"] or 0,
        "Excessive URL Length (>75 chars)": row["long_url_count"] or 0,
        "Multiple Subdomains (>2 levels)": row["deep_subdomain_count"] or 0,
        "Excessive Dots in Host (>3 dots)": row["excessive_dots_count"] or 0,
        "Deceptive Keywords in Hostname": row["suspicious_keywords_count"] or 0,
        "Known URL Shortener Service": row["shortener_count"] or 0,
        "Non-Standard Port Specified": row["unusual_port_count"] or 0,
        "Unusual Symbols (@, %, // in path)": row["unusual_symbols_count"] or 0,
    }
