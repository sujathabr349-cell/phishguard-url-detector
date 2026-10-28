import React, { useState, useMemo } from 'react';
import { RiskLevel, ScanRecord } from '../types';
import { 
  Search, 
  Trash2, 
  Download, 
  AlertOctagon, 
  X,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';

interface HistoryViewProps {
  scans: ScanRecord[];
  onSelectScan: (scan: ScanRecord) => void;
  onDeleteScan: (id: string) => void;
  onClearHistory: () => void;
  onExportCsv: () => void;
  onNavigateToScanner: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  scans,
  onSelectScan,
  onDeleteScan,
  onClearHistory,
  onExportCsv,
  onNavigateToScanner
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showClearModal, setShowClearModal] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<ScanRecord | null>(null);

  // Filter pipeline
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesUrl = scan.url.toLowerCase().includes(q);
        const matchesDomain = scan.domain.toLowerCase().includes(q);
        if (!matchesUrl && !matchesDomain) return false;
      }

      // 2. Risk filter
      if (riskFilter !== 'all') {
        if (scan.riskLevel.toLowerCase() !== riskFilter.toLowerCase()) return false;
      }

      // 3. Date filter
      if (dateFilter !== 'all') {
        const scanTime = new Date(scan.createdAt).getTime();
        const now = Date.now();
        if (dateFilter === 'today' && now - scanTime > 86400000) return false;
        if (dateFilter === '7days' && now - scanTime > 7 * 86400000) return false;
        if (dateFilter === '30days' && now - scanTime > 30 * 86400000) return false;
      }

      return true;
    });
  }, [scans, searchQuery, riskFilter, dateFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setRiskFilter('all');
    setDateFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Inspection History & Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Audit, search, and manage historical URL analysis records.
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
          {scans.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative flex items-center bg-[#070c18] border border-slate-700/80 rounded-lg px-3 py-1.5 focus-within:border-cyan-400 transition-colors">
            <Search className="w-4 h-4 text-slate-500 shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by URL string or domain..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Risk Filter Select */}
          <div className="flex items-center gap-2">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-[#070c18] border border-slate-700/80 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk Only</option>
              <option value="medium">Medium Risk Only</option>
              <option value="low">Low Risk Only</option>
            </select>

            {/* Date Filter Select */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-[#070c18] border border-slate-700/80 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Dates</option>
              <option value="today">Past 24 Hours</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 30 Days</option>
            </select>

            {(searchQuery || riskFilter !== 'all' || dateFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-2 text-xs text-slate-400 hover:text-white underline whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scans Table */}
      <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        {filteredScans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px] bg-[#090f1d]">
                  <th className="py-3 px-4">Submitted URL</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Protocol</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 max-w-[280px] truncate font-mono text-slate-200" title={scan.url}>
                      {scan.url}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-400">
                      {scan.domain}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-white">
                      {scan.riskScore}/100
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-mono ${scan.isHttps ? 'text-teal-400' : 'text-amber-400'}`}>
                        {scan.isHttps ? 'HTTPS' : 'HTTP'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {scan.createdAt}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectScan(scan)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-medium transition-colors"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => setScanToDelete(scan)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 border-t border-slate-800 bg-[#090f1d] text-[11px] text-slate-500 text-right">
              Showing {filteredScans.length} of {scans.length} total records
            </div>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <SlidersHorizontal className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-300">No Matching Scan Records</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || riskFilter !== 'all' || dateFilter !== 'all'
                ? 'No records match your active search or filter criteria. Try resetting filters.'
                : 'Your inspection log is currently empty. Analyze a URL to begin logging scans.'}
            </p>
            <div className="pt-2">
              {searchQuery || riskFilter !== 'all' || dateFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700"
                >
                  Clear Active Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateToScanner}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300"
                >
                  Start First Scan
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Single Item Modal */}
      {scanToDelete && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1527] border border-slate-700 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Scan Record</h3>
                <p className="text-xs text-slate-400">Permanently remove this entry from the database?</p>
              </div>
            </div>
            <div className="p-3 rounded bg-[#070c18] border border-slate-800 font-mono text-xs text-slate-300 truncate">
              {scanToDelete.url}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScanToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteScan(scanToDelete.id);
                  setScanToDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All History Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1527] border border-red-500/40 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear Complete Scan History</h3>
                <p className="text-xs text-slate-400">Destructive action confirmation</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently erase all <span className="font-mono text-white font-bold">{scans.length}</span> scan records from your local database? This action cannot be reversed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearHistory();
                  setShowClearModal(false);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-900/40"
              >
                Yes, Erase All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
