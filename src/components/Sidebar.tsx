import React from 'react';
import { ViewTab } from '../types';
import { 
  ShieldAlert, 
  Search, 
  LayoutDashboard, 
  History, 
  BarChart3, 
  BookOpen, 
  Code2, 
  X,
  Cpu
} from 'lucide-react';

interface SidebarProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  useMLModel: boolean;
  onToggleML: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  useMLModel,
  onToggleML,
}) => {
  const navItems: { tab: ViewTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'scanner', label: 'URL Scanner', icon: <Search className="w-4 h-4" /> },
    { tab: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { tab: 'history', label: 'Scan History', icon: <History className="w-4 h-4" /> },
    { tab: 'reports', label: 'Analytics & Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { tab: 'education', label: 'Security Education', icon: <BookOpen className="w-4 h-4" /> },
    { tab: 'code-explorer', label: 'Python Codebase', icon: <Code2 className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0d1527] border-r border-slate-800/80 z-50 flex flex-col transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block">PhishGuard</span>
              <span className="text-[11px] font-mono text-cyan-400 block">AI URL Inspector</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => {
                  onSelectTab(item.tab);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800/90 text-white border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Engine status and ML toggle */}
        <div className="p-4 border-t border-slate-800/80 bg-[#090f1d]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Random Forest ML</span>
            </div>
            <button
              type="button"
              onClick={onToggleML}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                useMLModel ? 'bg-cyan-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  useMLModel ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            {useMLModel
              ? 'Trained Random Forest classifier active alongside heuristic rules.'
              : 'Pure heuristic ruleset active (baseline security rules).'}
          </p>
        </div>
      </aside>
    </>
  );
};
