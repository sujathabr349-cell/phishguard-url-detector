/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ViewTab, ScanRecord } from './types';
import { 
  getStoredScans, 
  saveScanRecord, 
  deleteScanRecord, 
  clearAllScanRecords, 
  calculateDashboardStats, 
  calculateTrends, 
  calculateIndicatorFrequencies,
  exportScansToCsv 
} from './utils/storage';
import { analyzeUrl } from './utils/urlAnalyzer';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ScannerView } from './components/ScannerView';
import { ResultView } from './components/ResultView';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { ReportsView } from './components/ReportsView';
import { EducationView } from './components/EducationView';
import { CodeExplorerView } from './components/CodeExplorerView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('scanner');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [useMLModel, setUseMLModel] = useState(true);

  // Stored scans & telemetry
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);

  // Scanning animated progress
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(1);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch from storage (will auto-seed benchmark scans if empty)
    const initialScans = getStoredScans();
    setScans(initialScans);
  }, []);

  const stats = useMemo(() => calculateDashboardStats(scans), [scans]);
  const trends = useMemo(() => calculateTrends(scans, 7), [scans]);
  const indicators = useMemo(() => calculateIndicatorFrequencies(scans), [scans]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleScanSubmit = (rawUrl: string) => {
    setIsScanning(true);
    setScanStep(1);

    // Multi-stage animation progression
    const t1 = setTimeout(() => setScanStep(2), 250);
    const t2 = setTimeout(() => setScanStep(3), 500);
    const t3 = setTimeout(() => setScanStep(4), 750);

    const tFinal = setTimeout(() => {
      try {
        const scanResult = analyzeUrl(rawUrl, useMLModel);
        saveScanRecord(scanResult);
        setScans(getStoredScans());
        setSelectedScan(scanResult);
        showToast('URL analysis completed successfully.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`Scan error: ${msg}`);
      } finally {
        setIsScanning(false);
        setScanStep(1);
      }
    }, 1050);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tFinal);
    };
  };

  const handleDeleteScan = (id: string) => {
    deleteScanRecord(id);
    const updated = getStoredScans();
    setScans(updated);
    if (selectedScan?.id === id) {
      setSelectedScan(null);
    }
    showToast('Scan record deleted.');
  };

  const handleClearHistory = () => {
    clearAllScanRecords();
    setScans([]);
    setSelectedScan(null);
    showToast('All scan history cleared.');
  };

  const handleExportCsv = () => {
    if (scans.length === 0) {
      showToast('No scans available to export.');
      return;
    }
    exportScansToCsv(scans);
    showToast('CSV export downloaded.');
  };

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#0d1527] border border-cyan-500/40 text-cyan-200 px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedScan(null);
        }}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        useMLModel={useMLModel}
        onToggleML={() => {
          setUseMLModel(!useMLModel);
          showToast(!useMLModel ? 'Trained Random Forest ML enabled.' : 'Heuristic Ruleset fallback enabled.');
        }}
      />

      {/* Main Workspace Frame */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <TopBar
          activeTab={activeTab}
          onOpenMobile={() => setMobileOpen(true)}
          onQuickScan={() => {
            setActiveTab('scanner');
            setSelectedScan(null);
          }}
          onExportCsv={handleExportCsv}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {selectedScan ? (
            <ResultView
              scan={selectedScan}
              onBack={() => setSelectedScan(null)}
              onScanAnother={() => {
                setSelectedScan(null);
                setActiveTab('scanner');
              }}
            />
          ) : (
            <>
              {activeTab === 'scanner' && (
                <ScannerView
                  onScan={handleScanSubmit}
                  isScanning={isScanning}
                  scanStep={scanStep}
                  recentScans={scans}
                  onSelectScan={(scan) => setSelectedScan(scan)}
                  onNavigateToHistory={() => setActiveTab('history')}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  scans={scans}
                  trends={trends}
                  onNavigateToScanner={() => setActiveTab('scanner')}
                  onNavigateToHistory={() => setActiveTab('history')}
                  onSelectScan={(scan) => setSelectedScan(scan)}
                  onExportCsv={handleExportCsv}
                />
              )}

              {activeTab === 'history' && (
                <HistoryView
                  scans={scans}
                  onSelectScan={(scan) => setSelectedScan(scan)}
                  onDeleteScan={handleDeleteScan}
                  onClearHistory={handleClearHistory}
                  onExportCsv={handleExportCsv}
                  onNavigateToScanner={() => setActiveTab('scanner')}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  stats={stats}
                  indicators={indicators}
                  trends={trends}
                  scans={scans}
                  onExportCsv={handleExportCsv}
                />
              )}

              {activeTab === 'education' && <EducationView />}

              {activeTab === 'code-explorer' && <CodeExplorerView />}
            </>
          )}
        </main>

        {/* Global Defensive Security Notice Footer */}
        <footer className="border-t border-slate-800/80 bg-[#090f1d] px-6 py-4 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] leading-relaxed">
              <strong>Cybersecurity Advisory:</strong> PhishGuard performs lexical and statistical risk analysis. Zero-day threats can circumvent heuristics via newly registered domains or legitimate hosting services. Never submit credentials into unverified web applications.
            </p>
            <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono text-slate-400">
              <span>MIT License</span>
              <span>·</span>
              <span>SSRF Protected</span>
              <span>·</span>
              <span>SQLite + Scikit-Learn</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
