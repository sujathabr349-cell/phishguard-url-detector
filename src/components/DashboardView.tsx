import React from 'react';
import { DashboardStats, ScanRecord, TrendPoint } from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Search, 
  Download,
  ExternalLink
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats;
  scans: ScanRecord[];
  trends: TrendPoint[];
  onNavigateToScanner: () => void;
  onNavigateToHistory: () => void;
  onSelectScan: (scan: ScanRecord) => void;
  onExportCsv: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  scans,
  trends,
  onNavigateToScanner,
  onNavigateToHistory,
  onSelectScan,
  onExportCsv
}) => {
  // Calculate doughnut geometry
  const total = stats.totalScans || 1;
  const highAngle = (stats.highRisk / total) * 360;
  const medAngle = (stats.mediumRisk / total) * 360;
  const lowAngle = (stats.lowRisk / total) * 360;

  // Max trend count for trend SVG scaling
  const maxTrend = Math.max(1, ...trends.map(t => t.total));

  return (
    <div className="space-y-6">
      {/* Dashboard Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Cybersecurity Telemetry & Threat Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time aggregate telemetry computed dynamically from {stats.totalScans} stored URL records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToScanner}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 flex items-center gap-1.5 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Quick Scan</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-4 sm:p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block">
            Total Scans Logged
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums">
              {stats.totalScans}
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Indexed in local storage</span>
        </div>

        <div className="bg-[#0d1527] border border-red-500/25 rounded-xl p-4 sm:p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 block flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            <span>High Risk URLs</span>
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-red-400 tabular-nums">
              {stats.highRisk}
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Score &ge; 70 (Critical lures)</span>
        </div>

        <div className="bg-[#0d1527] border border-amber-500/25 rounded-xl p-4 sm:p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Medium Suspicion</span>
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
              {stats.mediumRisk}
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Score 36–69 (Anomalies detected)</span>
        </div>

        <div className="bg-[#0d1527] border border-teal-500/25 rounded-xl p-4 sm:p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400 block flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Lower Risk URLs</span>
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-400 tabular-nums">
              {stats.lowRisk}
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Score &lt; 36 (Conforming structure)</span>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Activity Volume Chart */}
        <div className="lg:col-span-2 bg-[#0d1527] border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>7-Day Threat Assessment Volume</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily submissions & risk stratification</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Total
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> High Risk
              </span>
            </div>
          </div>

          {/* Responsive SVG Chart */}
          <div className="h-56 w-full flex items-end gap-2 pt-4 px-2">
            {trends.map((point, idx) => {
              const totalHeight = Math.max(8, (point.total / maxTrend) * 160);
              const highHeight = Math.max(0, (point.high / maxTrend) * 160);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap pointer-events-none z-20">
                    {point.date}: {point.total} scans ({point.high} high)
                  </div>

                  <div className="w-full flex items-end justify-center gap-1 h-44">
                    {/* Total bar */}
                    <div 
                      className="w-full max-w-[20px] bg-cyan-500/40 hover:bg-cyan-400/60 rounded-t transition-all"
                      style={{ height: `${totalHeight}px` }}
                    />
                    {/* High risk bar */}
                    {point.high > 0 && (
                      <div 
                        className="w-full max-w-[12px] bg-red-500/80 hover:bg-red-400 rounded-t transition-all"
                        style={{ height: `${highHeight}px` }}
                      />
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {point.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Risk Ratio Stratification</h3>
            <p className="text-xs text-slate-400 mt-0.5">Overall categorization breakdown</p>
          </div>

          <div className="relative flex items-center justify-center py-4">
            {/* SVG Donut */}
            <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90">
              {/* Background circle */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#131e36" strokeWidth="14" />
              {/* Segments */}
              {stats.totalScans > 0 ? (
                <>
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="14"
                    strokeDasharray={`${(highAngle / 360) * 251.2} 251.2`}
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="14"
                    strokeDasharray={`${(medAngle / 360) * 251.2} 251.2`}
                    strokeDashoffset={`-${(highAngle / 360) * 251.2}`}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#14b8a6"
                    strokeWidth="14"
                    strokeDasharray={`${(lowAngle / 360) * 251.2} 251.2`}
                    strokeDashoffset={`-${((highAngle + medAngle) / 360) * 251.2}`}
                  />
                </>
              ) : (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1e293b" strokeWidth="14" />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {stats.avgRiskScore}
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Avg Risk
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> High Risk
              </span>
              <span className="font-mono text-slate-400 tabular-nums">
                {stats.highRisk} ({stats.totalScans > 0 ? ((stats.highRisk / stats.totalScans) * 100).toFixed(0) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Medium Risk
              </span>
              <span className="font-mono text-slate-400 tabular-nums">
                {stats.mediumRisk} ({stats.totalScans > 0 ? ((stats.mediumRisk / stats.totalScans) * 100).toFixed(0) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-500" /> Lower Risk
              </span>
              <span className="font-mono text-slate-400 tabular-nums">
                {stats.lowRisk} ({stats.totalScans > 0 ? ((stats.lowRisk / stats.totalScans) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Inspection Activity</h3>
            <p className="text-xs text-slate-400">Audit trail of URLs inspected across sessions</p>
          </div>
          <button
            type="button"
            onClick={onNavigateToHistory}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
          >
            <span>View all in history</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {scans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Submitted URL</th>
                  <th className="py-2.5 px-3">Extracted Host</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Protocol</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scans.slice(0, 8).map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 max-w-[220px] truncate font-mono text-slate-200" title={scan.url}>
                      {scan.url}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400">
                      {scan.domain}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-white">
                      {scan.riskScore}/100
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase ${
                        scan.riskLevel === 'High'
                          ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                          : scan.riskLevel === 'Medium'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                      }`}>
                        {scan.riskLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[11px] font-mono ${scan.isHttps ? 'text-teal-400' : 'text-amber-400'}`}>
                        {scan.isHttps ? 'HTTPS' : 'HTTP'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {scan.createdAt}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectScan(scan)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-medium transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            No scans recorded yet. Use the URL Scanner to inspect links.
          </div>
        )}
      </div>
    </div>
  );
};
