import React from 'react';
import { ViewTab } from '../types';
import { Menu, Search, Download } from 'lucide-react';

interface TopBarProps {
  activeTab: ViewTab;
  onOpenMobile: () => void;
  onQuickScan: () => void;
  onExportCsv: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onOpenMobile,
  onQuickScan,
  onExportCsv
}) => {
  const getTabTitle = (tab: ViewTab) => {
    switch (tab) {
      case 'scanner': return 'URL Inspection Scanner';
      case 'dashboard': return 'Operations Dashboard';
      case 'history': return 'Scan Audit Log';
      case 'reports': return 'Threat Analytics & Reports';
      case 'education': return 'Security Education Center';
      case 'code-explorer': return 'Python Project Explorer';
    }
  };

  return (
    <header className="h-16 bg-[#0d1527] border-b border-slate-800/80 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      {/* Zone 1: Breadcrumbs & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="font-medium text-slate-300">PhishGuard</span>
          <span className="text-slate-600">/</span>
          <span className="text-white font-semibold">{getTabTitle(activeTab)}</span>
        </div>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExportCsv}
          className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
        <button
          type="button"
          onClick={onQuickScan}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-sm whitespace-nowrap"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Scan URL</span>
        </button>
      </div>
    </header>
  );
};
