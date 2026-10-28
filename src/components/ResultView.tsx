import React, { useState } from 'react';
import { ScanRecord } from '../types';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Info,
  Server,
  Lock,
  Compass,
  FileCode
} from 'lucide-react';

interface ResultViewProps {
  scan: ScanRecord;
  onBack: () => void;
  onScanAnother: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  scan,
  onBack,
  onScanAnother
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(scan.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskBorder = () => {
    if (scan.riskLevel === 'High') return 'border-red-500/40 bg-red-950/10';
    if (scan.riskLevel === 'Medium') return 'border-amber-500/40 bg-amber-950/10';
    return 'border-teal-500/40 bg-teal-950/10';
  };

  const getScoreColor = () => {
    if (scan.riskLevel === 'High') return 'text-red-400 border-red-500';
    if (scan.riskLevel === 'Medium') return 'text-amber-400 border-amber-500';
    return 'text-teal-400 border-teal-500';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy URL'}</span>
          </button>
          <button
            type="button"
            onClick={onScanAnother}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
          >
            Scan Another URL
          </button>
        </div>
      </div>

      {/* Main Assessment Banner */}
      <div className={`border rounded-xl p-6 sm:p-8 ${getRiskBorder()} backdrop-blur-sm transition-all`}>
        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          {/* Circular Score Meter */}
          <div className="flex flex-col items-center shrink-0">
            <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 ${getScoreColor()} bg-[#070c18] flex flex-col items-center justify-center shadow-lg shadow-black/40`}>
              <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums leading-none">
                {scan.riskScore}
              </span>
              <span className="text-[11px] font-mono text-slate-500 mt-1">/100 RISK</span>
            </div>
            <div className="mt-3 text-center">
              <span className={`text-base font-bold uppercase tracking-wider block ${
                scan.riskLevel === 'High' ? 'text-red-400' : scan.riskLevel === 'Medium' ? 'text-amber-400' : 'text-teal-400'
              }`}>
                {scan.riskLevel} Risk
              </span>
              <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                {scan.analysisMode}
              </span>
            </div>
          </div>

          {/* Details & Explanation */}
          <div className="flex-1 space-y-3 w-full">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block">
                Target URL Analyzed:
              </span>
              <div className="mt-1 p-2.5 rounded bg-[#070c18] border border-slate-800 font-mono text-xs sm:text-sm text-cyan-300 break-all select-all">
                {scan.url}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {scan.explanationSummary}
            </p>

            {/* Quick Badges Strip */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500">Domain:</span>
                <span className="font-mono text-white font-medium">{scan.domain}</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500">Protocol:</span>
                <span className={`font-medium ${scan.isHttps ? 'text-teal-400' : 'text-amber-400'}`}>
                  {scan.isHttps ? 'HTTPS Encrypted' : 'Plain HTTP (Insecure)'}
                </span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500">Host Type:</span>
                <span className="font-medium text-slate-300">
                  {scan.hasIp ? 'Direct IP Address' : 'Standard Domain'}
                </span>
              </div>
              {scan.mlProbability !== null && (
                <>
                  <span className="text-slate-700">·</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-slate-500">ML Phish Prob:</span>
                    <span className="text-cyan-400">{(scan.mlProbability * 100).toFixed(1)}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contributing Threat Indicators */}
      <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>Contributing Threat Indicators ({scan.indicators.length})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Documented structural characteristics that contributed to the cumulative risk score.
          </p>
        </div>

        {scan.indicators.length > 0 ? (
          <div className="space-y-3">
            {scan.indicators.map((ind, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-lg border bg-[#070c18] space-y-1.5 ${
                  ind.severity === 'high' 
                    ? 'border-red-500/30' 
                    : ind.severity === 'medium'
                    ? 'border-amber-500/30'
                    : 'border-teal-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {ind.name}
                  </span>
                  <span className="font-mono text-xs font-bold text-red-400">
                    {ind.impact}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {ind.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[#070c18] border border-teal-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white">No Suspicious Threat Indicators Detected</span>
              <p className="text-xs text-slate-400">
                The URL adheres to standard legitimate domain naming patterns, uses standard encryption, and displays no homoglyphs or misleading keyword stuffing.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Architectural Attributes Grid */}
      <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>URL Architectural Measurements</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Normalized structural metrics extracted during feature compilation.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-[#070c18] border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Total Length</span>
            <span className="text-sm font-mono font-bold text-white mt-1 block tabular-nums">
              {scan.urlLength} chars
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {scan.urlLength > 75 ? 'Above avg' : 'Standard'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#070c18] border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Dot Count</span>
            <span className="text-sm font-mono font-bold text-white mt-1 block tabular-nums">
              {scan.dotCount} dots
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Host separators</span>
          </div>

          <div className="p-3 rounded-lg bg-[#070c18] border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Subdomain Depth</span>
            <span className="text-sm font-mono font-bold text-white mt-1 block tabular-nums">
              {scan.subdomainCount} levels
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {scan.subdomainCount >= 2 ? 'Deep nesting' : 'Standard'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#070c18] border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Keyword Hits</span>
            <span className="text-sm font-mono font-bold text-white mt-1 block tabular-nums">
              {scan.suspiciousWordsCount}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Security lures</span>
          </div>

          <div className="p-3 rounded-lg bg-[#070c18] border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Unusual Symbols</span>
            <span className="text-sm font-mono font-bold text-white mt-1 block tabular-nums">
              {scan.unusualSymbolsCount}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">@, %, // symbols</span>
          </div>

          <div className="p-3 rounded-lg bg-[#070c18] border border-slate-800">
            <span className="text-[11px] text-slate-500 block">TCP Port</span>
            <span className="text-sm font-mono font-bold text-white mt-1 block tabular-nums">
              {scan.unusualPort ? 'Custom Port' : 'Default (80/443)'}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Connection target</span>
          </div>
        </div>
      </div>

      {/* Recommended Safety Precautions */}
      <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-6 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Recommended Safety Precautions ({scan.riskLevel} Risk)</span>
        </h3>
        <ul className="space-y-2">
          {scan.precautions.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
              <span className="text-cyan-400 font-bold shrink-0 mt-0.5">&bull;</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Transparent Scoring Disclosure */}
      <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Transparent Threat Assessment Methodology:</strong> PhishGuard evaluates lexical syntax, structural indicators, and Scikit-learn statistical inference. A score of 0 does not definitively guarantee that a website is benign, nor does a high score prove hostile intent. Threat actors frequently compromise authentic domains or acquire legitimate SSL certificates. Always verify critical workflows through known, official channels.
        </div>
      </div>
    </div>
  );
};
