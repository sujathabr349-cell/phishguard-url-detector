/**
 * PhishGuard - Chart.js Telemetry & Analytics Controller
 * Renders dark navy themed data visualizations for dashboard and security reports.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Shared chart styling parameters
    const chartDefaults = {
        color: '#94a3b8',
        font: {
            family: "'Plus Jakarta Sans', system-ui, sans-serif",
            size: 11
        },
        borderColor: 'rgba(255, 255, 255, 0.07)',
    };

    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = chartDefaults.color;
        Chart.defaults.font.family = chartDefaults.font.family;
        Chart.defaults.borderColor = chartDefaults.borderColor;
    }

    // ==========================================
    // 1. Dashboard Charts
    // ==========================================
    if (typeof dashboardData !== 'undefined') {
        // A. 7-Day Trend Chart
        const trendCanvas = document.getElementById('trendChart');
        if (trendCanvas) {
            const rawTrends = dashboardData.trends || [];
            const labels = rawTrends.length > 0 ? rawTrends.map(t => t.scan_date) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const totals = rawTrends.length > 0 ? rawTrends.map(t => t.total) : [0, 0, 0, 0, 0, 0, 0];
            const highCounts = rawTrends.length > 0 ? rawTrends.map(t => t.high_count) : [0, 0, 0, 0, 0, 0, 0];

            new Chart(trendCanvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Total Scans',
                            data: totals,
                            borderColor: '#06b6d4',
                            backgroundColor: 'rgba(6, 182, 212, 0.1)',
                            fill: true,
                            tension: 0.35,
                            borderWidth: 2,
                            pointBackgroundColor: '#06b6d4',
                            pointRadius: 4
                        },
                        {
                            label: 'High Risk Lures',
                            data: highCounts,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            fill: true,
                            tension: 0.35,
                            borderWidth: 2,
                            pointBackgroundColor: '#ef4444',
                            pointRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 12, boxHeight: 12 } },
                        tooltip: { backgroundColor: '#0d1527', titleColor: '#f8fafc', bodyColor: '#cbd5e1', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { grid: { color: 'transparent' } }
                    }
                }
            });
        }

        // B. Risk Distribution Doughnut Chart
        const distCanvas = document.getElementById('distributionChart');
        if (distCanvas) {
            const high = dashboardData.highRisk || 0;
            const med = dashboardData.mediumRisk || 0;
            const low = dashboardData.lowRisk || 0;
            const hasData = (high + med + low) > 0;

            new Chart(distCanvas, {
                type: 'doughnut',
                data: {
                    labels: hasData ? ['High Risk', 'Medium Suspicion', 'Lower Risk'] : ['No Data Logged'],
                    datasets: [{
                        data: hasData ? [high, med, low] : [1],
                        backgroundColor: hasData ? ['#ef4444', '#f59e0b', '#14b8a6'] : ['#1e293b'],
                        borderColor: '#070c18',
                        borderWidth: 3,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } }
                    }
                }
            });
        }
    }

    // ==========================================
    // 2. Reports Page Charts
    // ==========================================
    if (typeof reportData !== 'undefined') {
        // A. 14-Day Trend
        const repTrendCanvas = document.getElementById('reportsTrendChart');
        if (repTrendCanvas) {
            const trends = reportData.trends || [];
            const labels = trends.map(t => t.scan_date);
            const totals = trends.map(t => t.total);
            const highs = trends.map(t => t.high_count);

            new Chart(repTrendCanvas, {
                type: 'bar',
                data: {
                    labels: labels.length > 0 ? labels : ['Past 14 Days'],
                    datasets: [
                        {
                            label: 'Total Inquiries',
                            data: totals.length > 0 ? totals : [0],
                            backgroundColor: 'rgba(6, 182, 212, 0.65)',
                            borderRadius: 4
                        },
                        {
                            label: 'High Severity Flags',
                            data: highs.length > 0 ? highs : [0],
                            backgroundColor: 'rgba(239, 68, 68, 0.85)',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 12 } }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { grid: { color: 'transparent' } }
                    }
                }
            });
        }

        // B. Reports Risk Donut
        const repDistCanvas = document.getElementById('reportsDistChart');
        if (repDistCanvas) {
            const stats = reportData.stats || {};
            const high = stats.high_risk || 0;
            const med = stats.medium_risk || 0;
            const low = stats.low_risk || 0;
            const total = high + med + low;

            new Chart(repDistCanvas, {
                type: 'pie',
                data: {
                    labels: total > 0 ? ['High Risk', 'Medium Suspicion', 'Lower Risk'] : ['No Scans Logged'],
                    datasets: [{
                        data: total > 0 ? [high, med, low] : [1],
                        backgroundColor: total > 0 ? ['#ef4444', '#f59e0b', '#14b8a6'] : ['#1e293b'],
                        borderColor: '#070c18',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } }
                    }
                }
            });
        }

        // C. Frequent Indicators Horizontal Bar Chart
        const indCanvas = document.getElementById('reportsIndicatorsChart');
        if (indCanvas) {
            const rawIndicators = reportData.indicators || {};
            const labels = Object.keys(rawIndicators);
            const values = Object.values(rawIndicators);

            new Chart(indCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Detection Frequency',
                        data: values,
                        backgroundColor: 'rgba(20, 184, 166, 0.75)',
                        borderColor: '#14b8a6',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { grid: { color: 'transparent' } }
                    }
                }
            });
        }
    }
});
