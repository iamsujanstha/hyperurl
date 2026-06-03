import React from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tab } from '@/features/api-tester/types';

interface TabSystemProps {
  tabs: Tab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  closeTab: (e: React.MouseEvent, id: string) => void;
  createTab: () => void;
}

export function TabSystem({
  tabs,
  activeTabId,
  setActiveTabId,
  closeTab,
  createTab
}: TabSystemProps) {
  return (
    <div className="h-10 flex border-b border-slate-850 bg-[#0F1115] shrink-0 overflow-x-auto no-scrollbar scroll-smooth">
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId;
        return (
          <div 
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={cn(
              "group flex items-center gap-3.5 px-4 min-w-[120px] max-w-[185px] border-r border-slate-850 cursor-pointer transition-all relative select-none shrink-0",
              isActive ? "bg-black" : "hover:bg-white/5"
            )}
            role="tab"
            aria-selected={isActive}
          >
            <span className={cn(
              "text-[10px] font-mono truncate uppercase flex-1 tracking-wider font-bold",
              isActive ? "text-white" : "text-slate-550"
            )}>
              {tab.name}
            </span>
            <button 
              type="button"
              onClick={(e) => closeTab(e, tab.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-850 rounded text-slate-500 hover:text-rose-500 transition-all cursor-pointer"
              aria-label={`Close tab ${tab.name}`}
            >
              <X size={10} />
            </button>
          </div>
        );
      })}
      <button 
        type="button"
        onClick={() => createTab()}
        className="flex items-center justify-center px-4.5 border-r border-slate-850 hover:bg-white/5 text-slate-600 hover:text-emerald-500 transition-colors cursor-pointer"
        aria-label="Add new request tab"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
