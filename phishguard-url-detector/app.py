"""
PhishGuard - Flask Web Application
Main entry point coordinating URL scanning, persistent storage, security reporting,
and educational resources.
"""

import csv
import io
import os
from flask import (
    Flask,
    Response,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from config import get_config
from database import (
    clear_history,
    delete_scan,
    get_all_scans,
    get_dashboard_stats,
    get_indicator_frequencies,
    get_scan_by_id,
    get_trend_data,
    init_db,
    save_scan,
)
from url_analyzer import (
    URLPredictor,
    validate_and_normalize_url,
)

CONFIG = get_config()


def create_app(test_config=None) -> Flask:
    """Application factory for PhishGuard Flask app."""
    app = Flask(__name__)
    if test_config:
        app.config.from_object(test_config)
    else:
        app.config.from_object(CONFIG)

    # Initialize SQLite database tables
    db_target = app.config.get("DATABASE_PATH")
    init_db(db_target)

    # Instantiate model predictor (loads model if present, otherwise defaults to heuristic)
    model_target = app.config.get("MODEL_PATH")
    predictor = URLPredictor(model_target)

    @app.context_processor
    def inject_global_data():
        """Make common variables available to all Jinja templates."""
        return {
            "app_name": "PhishGuard",
            "model_loaded": predictor.model_loaded,
            "analysis_mode_label": "Trained ML Model" if predictor.model_loaded else "Heuristic Engine",
        }

    @app.route("/")
    def index():
        """Home page with prominent URL scanner and security highlights."""
        recent_scans = get_all_scans(limit=5, db_path=app.config.get("DATABASE_PATH"))
        stats = get_dashboard_stats(db_path=app.config.get("DATABASE_PATH"))
        return render_template("index.html", recent_scans=recent_scans, stats=stats)

    @app.route("/dashboard")
    def dashboard():
        """Comprehensive cybersecurity operations dashboard."""
        db_path = app.config.get("DATABASE_PATH")
        stats = get_dashboard_stats(db_path=db_path)
        recent_scans = get_all_scans(limit=10, db_path=db_path)
        trend_data = get_trend_data(days=7, db_path=db_path)
        return render_template(
            "dashboard.html",
            stats=stats,
            recent_scans=recent_scans,
            trend_data=trend_data,
        )

    @app.route("/scan", methods=["GET", "POST"])
    def scan():
        """Process URL submission, extract features, score risk, and store result."""
        if request.method == "POST":
            raw_url = request.form.get("url", "").strip()

            # Server-side validation
            is_valid, normalized, err_msg = validate_and_normalize_url(raw_url)
            if not is_valid:
                flash(err_msg, "error")
                return render_template("index.html", url_input=raw_url)

            try:
                # Perform analysis without ever fetching the target site (SSRF safe)
                analysis_result = predictor.analyze(normalized)

                # Persist to SQLite
                db_path = app.config.get("DATABASE_PATH")
                scan_id = save_scan(analysis_result, db_path=db_path)
                return redirect(url_for("result", scan_id=scan_id))
            except Exception as e:
                flash(f"Analysis failed: {str(e)}", "error")
                return render_template("index.html", url_input=raw_url)

        return render_template("index.html")

    @app.route("/result/<int:scan_id>")
    def result(scan_id: int):
        """Display transparent risk indicators, contributing factors, and precautions."""
        db_path = app.config.get("DATABASE_PATH")
        scan_record = get_scan_by_id(scan_id, db_path=db_path)
        if not scan_record:
            flash("The requested scan report could not be found.", "warning")
            return redirect(url_for("dashboard"))

        return render_template("result.html", scan=scan_record)

    @app.route("/history")
    def history():
        """Searchable and filterable history of analyzed URLs."""
        search_query = request.args.get("q", "").strip()
        risk_filter = request.args.get("risk", "").strip()
        date_filter = request.args.get("date", "").strip()

        db_path = app.config.get("DATABASE_PATH")
        scans = get_all_scans(
            limit=200,
            search_query=search_query,
            risk_filter=risk_filter,
            date_filter=date_filter,
            db_path=db_path,
        )
        stats = get_dashboard_stats(db_path=db_path)

        return render_template(
            "history.html",
            scans=scans,
            search_query=search_query,
            risk_filter=risk_filter,
            date_filter=date_filter,
            stats=stats,
        )

    @app.route("/history/delete/<int:scan_id>", methods=["POST"])
    def delete_record(scan_id: int):
        """Remove a single record from SQLite storage."""
        db_path = app.config.get("DATABASE_PATH")
        deleted = delete_scan(scan_id, db_path=db_path)
        if deleted:
            flash("Scan record was deleted successfully.", "success")
        else:
            flash("Scan record could not be found or was already deleted.", "warning")
        return redirect(url_for("history"))

    @app.route("/history/clear", methods=["POST"])
    def clear_all():
        """Clear the entire scan log following user confirmation."""
        db_path = app.config.get("DATABASE_PATH")
        count = clear_history(db_path=db_path)
        flash(f"Successfully removed {count} scan record(s) from history.", "info")
        return redirect(url_for("history"))

    @app.route("/history/export")
    def export_csv():
        """Export analyzed URL history as RFC 4180 compliant CSV."""
        db_path = app.config.get("DATABASE_PATH")
        scans = get_all_scans(limit=5000, db_path=db_path)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "ID", "Submitted URL", "Domain", "Risk Score", "Risk Level",
            "HTTPS", "IP Hostname", "URL Length", "Dots", "Subdomains",
            "Shortener", "Analysis Mode", "Timestamp"
        ])

        for s in scans:
            writer.writerow([
                s["id"],
                s["url"],
                s["domain"],
                s["risk_score"],
                s["risk_level"],
                "Yes" if s["is_https"] else "No",
                "Yes" if s["has_ip"] else "No",
                s["url_length"],
                s["dot_count"],
                s["subdomain_count"],
                "Yes" if s["shortener_detected"] else "No",
                s["analysis_mode"],
                s["created_at"],
            ])

        response = Response(output.getvalue(), mimetype="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=phishguard_scan_history.csv"
        return response

    @app.route("/reports")
    def reports():
        """Risk distribution metrics, detection frequencies, and temporal activity."""
        db_path = app.config.get("DATABASE_PATH")
        stats = get_dashboard_stats(db_path=db_path)
        indicators = get_indicator_frequencies(db_path=db_path)
        trends = get_trend_data(days=14, db_path=db_path)

        return render_template(
            "reports.html",
            stats=stats,
            indicators=indicators,
            trends=trends,
        )

    @app.route("/security-tips")
    def security_tips():
        """Educational guide on phishing mechanics, URL anatomy, and protective measures."""
        return render_template("security_tips.html")

    # REST API Endpoints for headless/integration usage
    @app.route("/api/scan", methods=["POST"])
    def api_scan():
        """Programmatic URL analysis endpoint."""
        data = request.get_json(silent=True) or {}
        raw_url = data.get("url", "").strip()

        is_valid, normalized, err_msg = validate_and_normalize_url(raw_url)
        if not is_valid:
            return jsonify({"status": "error", "message": err_msg}), 400

        try:
            analysis = predictor.analyze(normalized)
            db_path = app.config.get("DATABASE_PATH")
            scan_id = save_scan(analysis, db_path=db_path)
            analysis["scan_id"] = scan_id
            return jsonify({"status": "success", "data": analysis})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.route("/api/stats")
    def api_stats():
        """Retrieve aggregated dashboard metrics as JSON."""
        db_path = app.config.get("DATABASE_PATH")
        stats = get_dashboard_stats(db_path=db_path)
        indicators = get_indicator_frequencies(db_path=db_path)
        trends = get_trend_data(days=7, db_path=db_path)
        return jsonify({
            "status": "success",
            "stats": stats,
            "indicators": indicators,
            "trends": trends,
        })

    # Error handling
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template("index.html", error_message="The requested resource was not found."), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template("index.html", error_message="An unexpected server error occurred."), 500

    return app


if __name__ == "__main__":
    app = create_app()
    # Run locally on port 5000 in development
    app.run(host="127.0.0.1", port=5000, debug=True)
