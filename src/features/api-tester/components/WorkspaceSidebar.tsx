import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Plus, ChevronLeft, Beaker, Sliders, History, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkspaceSidebarProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  view: 'debugger' | 'lab' | 'variables' | 'history';
  setView: (view: 'debugger' | 'lab' | 'variables' | 'history') => void;
  createTab: () => void;
}

export function WorkspaceSidebar({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  view,
  setView,
  createTab
 }: WorkspaceSidebarProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const animatedWidth = isMobile 
    ? (isSidebarCollapsed ? '0px' : '220px')
    : (isSidebarCollapsed ? '52px' : '220px');

  return (
    <motion.aside 
      initial={false}
      animate={{ width: animatedWidth }}
      className={cn(
        "bg-[#0F1115] flex flex-col shrink-0 overflow-hidden z-40 transition-all duration-150",
        isSidebarCollapsed ? "border-r-0" : "border-r border-slate-850",
        isMobile ? "absolute top-0 bottom-0 left-0 h-full shadow-2xl" : "relative"
      )}
    >
      <div className={cn(
        "h-12 flex items-center border-b border-slate-900/40 shrink-0",
        isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3.5"
      )}>
        {!isSidebarCollapsed && (
          <span className="text-[10px] font-black tracking-[0.4em] text-white uppercase flex items-center gap-2 select-none animate-fade-in">
            <Terminal size={14} className="text-emerald-500 animate-pulse" /> HYPERCURL
          </span>
        )}
        <button 
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={cn(
            "text-slate-500 hover:text-white transition-colors p-1.5 cursor-pointer hover:bg-slate-800/40 rounded transition-all active:scale-95",
            isSidebarCollapsed ? "" : "ml-auto"
          )}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <Menu size={16} className="text-emerald-500" /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-3 px-2 space-y-1">
        {!isSidebarCollapsed && (
          <div className="text-[9px] font-black text-slate-550 uppercase tracking-[0.2em] mb-2.5 ml-2.5 select-none">
            NAVIGATION
          </div>
        )}
        
        {[
          { key: 'debugger', label: 'API CLIENT', icon: Terminal },
          { key: 'lab', label: 'TEST LAB', icon: Beaker },
          { key: 'variables', label: 'ENVIRONMENTS', icon: Sliders },
          { key: 'history', label: 'HISTORY', icon: History },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = view === item.key;
          return (
            <button 
              key={item.key}
              type="button"
              onClick={() => {
                setView(item.key as any);
                if (isMobile) {
                  setIsSidebarCollapsed(true);
                }
              }}
              className={cn(
                "w-full flex items-center rounded-lg text-[11px] font-bold transition-all group cursor-pointer border-none shadow-none",
                isSidebarCollapsed ? "justify-center px-1.5 py-2.5" : "gap-3.5 px-3 py-2.5 text-left",
                isActive 
                  ? "bg-[#1E293B]/70 text-emerald-400 border-l-2 border-emerald-500 rounded-l-none" 
                  : "text-slate-450 hover:bg-[#1E293B]/20 hover:text-slate-200"
              )}
              title={isSidebarCollapsed ? item.label : ""}
            >
              <Icon size={14} className={cn(
                "transition-transform shrink-0",
                isActive ? "text-emerald-500" : "group-hover:scale-110 text-slate-500"
              )} />
              {!isSidebarCollapsed && <span className="uppercase tracking-wider font-mono">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {!isSidebarCollapsed && (
        <div className="p-3 border-t border-slate-950 shrink-0">
          <button 
            type="button"
            onClick={createTab}
            className="w-full py-2.5 bg-[#141C2B] text-slate-200 hover:text-white hover:bg-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow"
          >
            <Plus size={13} /> NEW_REQ
          </button>
        </div>
      )}
    </motion.aside>
  );
}
