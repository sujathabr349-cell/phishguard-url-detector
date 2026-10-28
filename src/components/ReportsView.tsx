import React from 'react';
import { DashboardStats, IndicatorFrequency, ScanRecord, TrendPoint } from '../types';
import { 
  BarChart3, 
  Download, 
  ShieldAlert, 
  Layers, 
  Activity,
  Flame
} from 'lucide-react';

interface ReportsViewProps {
  stats: DashboardStats;
  indicators: IndicatorFrequency[];
  trends: TrendPoint[];
  scans: ScanRecord[];
  onExportCsv: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  stats,
  indicators,
  trends,
  scans,
  onExportCsv
}) => {
  const maxTrend = Math.max(1, ...trends.map(t => t.total));
  const maxIndicatorCount = Math.max(1, ...indicators.map(i => i.count));

  const total = stats.totalScans || 1;
  const benignPercentage = total > 0 ? ((stats.lowRisk / total) * 100).toFixed(1) : '0';
  const suspiciousPercentage = total > 0 ? ((stats.suspiciousTotal / total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Cybersecurity Analytics & Indicator Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Statistical distribution, temporal detection velocity, and threat vector frequencies.
          </p>
        </div>
        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download CSV Audit Log</span>
        </button>
      </div>

      {/* Aggregate Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-4 sm:p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block">Total Database Inquiries</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums">
              {stats.totalScans}
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Full inspection history</span>
        </div>

        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-4 sm:p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 block">Suspicious Threat Lures</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-red-400 tabular-nums">
              {stats.suspiciousTotal}
            </span>
            <span className="text-xs font-mono text-slate-400">({suspiciousPercentage}%)</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">High & Medium risk flags</span>
        </div>

        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-4 sm:p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 block">Average Threat Score</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400 tabular-nums">
              {stats.avgRiskScore}
            </span>
            <span className="text-xs font-mono text-slate-400">/100</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Overall threat baseline</span>
        </div>

        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-4 sm:p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400 block">Benign Architecture Ratio</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-400 tabular-nums">
              {benignPercentage}%
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Low risk conformations</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Velocity */}
        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Detection Velocity Trends</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Scan activity and high-risk flags</p>
            </div>
          </div>

          <div className="h-52 w-full flex items-end gap-2 pt-4 px-2">
            {trends.map((point, idx) => {
              const barHeight = Math.max(10, (point.total / maxTrend) * 140);
              const highHeight = Math.max(0, (point.high / maxTrend) * 140);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    <div 
                      className="w-full max-w-[18px] bg-cyan-500/50 hover:bg-cyan-400 rounded-t transition-all"
                      style={{ height: `${barHeight}px` }}
                      title={`${point.date}: ${point.total} total`}
                    />
                    {point.high > 0 && (
                      <div 
                        className="w-full max-w-[12px] bg-red-500 hover:bg-red-400 rounded-t transition-all"
                        style={{ height: `${highHeight}px` }}
                        title={`${point.date}: ${point.high} high risk`}
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

        {/* Stratification Breakdown */}
        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Risk Stratification Breakdown</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Proportionate composition of scans</p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-400 font-medium">High Risk Lures (&ge; 70 pts)</span>
                <span className="font-mono text-white tabular-nums">{stats.highRisk} scans</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-red-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(stats.highRisk / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-medium">Medium Suspicion (36–69 pts)</span>
                <span className="font-mono text-white tabular-nums">{stats.mediumRisk} scans</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(stats.mediumRisk / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-teal-400 font-medium">Lower Risk Baseline (&lt; 36 pts)</span>
                <span className="font-mono text-white tabular-nums">{stats.lowRisk} scans</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(stats.lowRisk / total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Detected Warning Indicators Horizontal Bar Chart */}
      <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-cyan-400" />
            <span>Top Detected Threat Vectors & Anomaly Frequencies</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Most frequently triggered structural heuristics across the entire database.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {indicators.map((ind, idx) => {
            const barWidth = maxIndicatorCount > 0 ? (ind.count / maxIndicatorCount) * 100 : 0;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{ind.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                      ind.severity === 'high' ? 'text-red-400 bg-red-950/30' : ind.severity === 'medium' ? 'text-amber-400 bg-amber-950/30' : 'text-teal-400 bg-teal-950/30'
                    }`}>
                      {ind.severity}
                    </span>
                    <span className="font-mono text-white tabular-nums font-semibold w-12 text-right">
                      {ind.count} hits
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-800/70 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      ind.severity === 'high' ? 'bg-red-500' : ind.severity === 'medium' ? 'bg-cyan-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.max(4, barWidth)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
