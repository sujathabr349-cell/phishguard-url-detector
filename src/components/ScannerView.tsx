import React, { useState } from 'react';
import { ScanRecord } from '../types';
import { 
  Globe, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Lock, 
  AlertTriangle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ScannerViewProps {
  onScan: (url: string) => void;
  isScanning: boolean;
  scanStep: number;
  recentScans: ScanRecord[];
  onSelectScan: (scan: ScanRecord) => void;
  onNavigateToHistory: () => void;
}

const SAMPLE_URLS = [
  { label: 'Suspicious Phish Lure', url: 'http://paypal-security-center.auth-update.xyz/login' },
  { label: 'Direct IP Host', url: 'http://192.168.1.105/secure/banking/signin.php' },
  { label: 'Masked Shortener', url: 'http://bit.ly/3xFakeBankLoginLure' },
  { label: 'Standard Benign URL', url: 'https://en.wikipedia.org/wiki/Transport_Layer_Security' }
];

export const ScannerView: React.FC<ScannerViewProps> = ({
  onScan,
  isScanning,
  scanStep,
  recentScans,
  onSelectScan,
  onNavigateToHistory
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = urlInput.trim();

    if (!cleaned) {
      setValidationError('Please enter a target URL.');
      return;
    }

    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      setValidationError('PhishGuard only accepts HTTP and HTTPS web URLs (starting with http:// or https://).');
      return;
    }

    setValidationError(null);
    onScan(cleaned);
  };

  const handleSelectSample = (url: string) => {
    setUrlInput(url);
    setValidationError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Phishing URL Detection & Structural Risk Analysis
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
          Inspect suspicious links before opening. Evaluates 12+ lexical and architectural indicators including homoglyphs, IP hostnames, URL shorteners, and brand impersonation lures.
        </p>
      </div>

      {/* Main Scanner Card */}
      <div className="bg-[#0d1527] border border-cyan-500/30 rounded-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex flex-col sm:flex-row items-stretch gap-2 bg-[#070c18] border border-slate-700/80 rounded-lg p-1.5 focus-within:border-cyan-400 transition-colors">
            <div className="flex items-center pl-3 text-slate-500">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="https://example.com/login or paste suspicious link..."
              className="flex-1 bg-transparent px-3 py-2.5 text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none font-mono"
              disabled={isScanning}
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isScanning}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${
                isScanning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              }`}
            >
              <span>{isScanning ? 'Analyzing...' : 'Analyze URL'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2 pt-1">
            <span>Accepted formats: Standard <code>http://</code> and <code>https://</code> web addresses up to 2,048 characters.</span>
            <span className="text-teal-400 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Safe execution: Zero outbound network requests</span>
            </span>
          </div>
        </form>

        {/* Animated Scan Pipeline Progress */}
        {isScanning && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { title: '1. Syntax Parse', doneStep: 1 },
                { title: '2. Lexical Signals', doneStep: 2 },
                { title: '3. Heuristics', doneStep: 3 },
                { title: '4. ML Probability', doneStep: 4 }
              ].map((step, idx) => {
                const isCurrent = scanStep === step.doneStep;
                const isDone = scanStep > step.doneStep;
                return (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                      isCurrent
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                        : isDone
                        ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      isCurrent ? 'bg-cyan-400 animate-ping' : isDone ? 'bg-teal-400' : 'bg-slate-600'
                    }`} />
                    <span className="truncate">{step.title}</span>
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-teal-400 h-full transition-all duration-300 ease-out"
                style={{ width: `${scanStep * 25}%` }}
              />
            </div>
            <p className="text-xs font-mono text-cyan-300 text-center">
              {scanStep === 1 && 'Deconstructing hostname and validating RFC syntax...'}
              {scanStep === 2 && 'Extracting lexical patterns, dot counts, and character entropy...'}
              {scanStep === 3 && 'Evaluating weighted security heuristic matrix...'}
              {scanStep === 4 && 'Evaluating multi-factor features against trained Random Forest model...'}
            </p>
          </div>
        )}

        {/* Sample URL Shortcuts */}
        <div className="mt-5 pt-4 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test sample lures:</span>
          </span>
          {SAMPLE_URLS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(sample.url)}
              className="text-xs px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white">Transparent Scoring</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Every score penalty is mapped to explicit structural indicators with clear numerical impact points and plain-English threat rationale.
          </p>
        </div>

        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white">Random Forest ML</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Classifies feature vectors against multi-dimensional distributions trained on balanced legitimate and phishing URL corpora.
          </p>
        </div>

        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white">Zero SSRF Exposure</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            PhishGuard operates purely on lexical syntax. It never issues outbound socket requests, preventing remote malware triggers and server exploitation.
          </p>
        </div>
      </div>

      {/* Recent Scans Table Preview */}
      {recentScans.length > 0 && (
        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent URL Inquiries</h3>
              <p className="text-xs text-slate-400">Latest analysis records stored in local database</p>
            </div>
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
            >
              <span>View full history</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Analyzed URL</th>
                  <th className="py-2.5 px-3">Domain</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Risk Tier</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentScans.slice(0, 5).map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 max-w-[240px] truncate font-mono text-slate-200" title={scan.url}>
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
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {scan.createdAt}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectScan(scan)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-medium transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
