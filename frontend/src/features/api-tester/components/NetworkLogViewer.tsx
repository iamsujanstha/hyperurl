import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Trash2, Search, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurlResult } from '@backend/modules/curl-engine';
import { ResponseViewer } from './ResponseViewer';

interface NetworkLogViewerProps {
  results: CurlResult[];
  loading: boolean;
  onAbort: () => void;
  theme?: 'dark' | 'light';
  activeTabId: string;
  onClearLogs: () => void;
}

export function NetworkLogViewer({ 
  results, 
  loading, 
  onAbort, 
  theme = 'dark', 
  activeTabId,
  onClearLogs
}: NetworkLogViewerProps) {
  const [selectedResult, setSelectedResult] = useState<CurlResult | null>(null);

  // Sync selectedResult state with activeTab changes and new runs
  useEffect(() => {
    if (results && results.length > 0) {
      const exists = selectedResult && results.some(r => r.id === selectedResult.id);
      if (!exists) {
        setSelectedResult(results[results.length - 1]);
      }
    } else {
      setSelectedResult(null);
    }
  }, [results.length, activeTabId]);

  // Compute filtered results (filters are requested to be removed, so we fallback to all results directly)
  const filteredResults = results;

  // Handle empty list states elegantly
  if (results.length === 0) {
    if (loading) {
      return (
        <ResponseViewer 
          result={null} 
          loading={true} 
          onAbort={onAbort} 
          theme={theme} 
        />
      );
    }
    return (
      <ResponseViewer 
        result={null} 
        loading={false} 
        onAbort={onAbort} 
        theme={theme} 
      />
    );
  }

  return (
    <div className="flex-grow flex flex-col lg:flex-row h-full bg-[#07080A] text-slate-200 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80 overflow-hidden font-sans">
      
      {/* LHS Panel: Browser-like compact transaction logs */}
      <div className={cn("flex flex-col h-full bg-black overflow-hidden transition-all duration-300", selectedResult ? "w-full lg:w-[45%]" : "w-full")}>
        
        {/* Main Title Header */}
        <div className="px-5 py-3 border-b border-slate-900 bg-black/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-500 animate-pulse" aria-hidden="true" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">TRANSACTIONS ({results.length})</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClearLogs}
              className="text-xs font-mono text-slate-300 hover:text-rose-400 uppercase flex items-center gap-1.5 transition-colors cursor-pointer font-bold border border-slate-800 bg-slate-900/60 px-2.5 py-1 rounded"
              type="button"
              aria-label="Clear all transaction logs"
            >
              <Trash2 size={11} /> CLEAR
            </button>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-tight font-bold">RETAIN: 50</span>
          </div>
        </div>

        {/* Transaction Content Area */}
        <div className="flex-1 overflow-y-auto p-3 px-4 custom-scrollbar space-y-1.5 bg-[#07080A]/40">
          <AnimatePresence initial={false}>

            {/* Display chronological list, first hit at the top, latest hit at bottom */}
            {filteredResults.slice(-50).map((res, i) => {
              const originalIndex = results.findIndex(r => r.id === res.id) + 1;
              const rt = res.responseTime;
              const isSelected = selectedResult?.id === res.id;
              const isSuccess = res.status >= 200 && res.status < 300;

              // Size computation
              const bodyLength = res.body ? res.body.length : 0;
              const formattedSize = bodyLength > 1024 
                ? `${(bodyLength / 1024).toFixed(1)} KB` 
                : `${bodyLength} B`;

              // Extract readable Path
              const method = (res.config?.method || 'GET').toUpperCase();
              let pathStr = '';
              try {
                const urlObj = new URL(res.config?.url || '');
                pathStr = urlObj.pathname + urlObj.search;
              } catch {
                pathStr = res.config?.url || '';
              }
              const displayPath = pathStr.length > 32 ? pathStr.slice(0, 30) + '...' : pathStr;

              return (
                <motion.div 
                  key={res.id}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  onClick={() => setSelectedResult(res)}
                  className={cn(
                    "group flex border-l-2 py-2 px-3 transition-all cursor-pointer items-center min-h-[40px] gap-3 rounded-r",
                    isSelected 
                      ? "border-emerald-500 bg-emerald-500/15 text-white" 
                      : "border-slate-800 hover:border-slate-500 hover:bg-slate-900/40 text-slate-300"
                  )}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`Transaction ${originalIndex}: ${method} ${res.config?.url || 'N/A'}, status ${res.status !== 0 ? res.status : 'error'}`}
                >
                  <span className={cn(
                    "text-xs font-mono w-6 shrink-0 transition-colors",
                    isSelected ? "text-emerald-500 font-bold dark:text-emerald-350" : "text-slate-500"
                  )}>
                    #{originalIndex}
                  </span>
                  
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] font-black px-1.5 py-0.5 rounded-[2px] leading-none tracking-wider font-mono border shrink-0",
                      method === 'GET' ? 'bg-sky-500/10 text-sky-450 border-sky-500/20' :
                      method === 'POST' ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' :
                      method === 'PUT' ? 'bg-amber-500/10 text-amber-450 border-amber-500/20' :
                      method === 'DELETE' ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    )}>
                      {method}
                    </span>
                    <span className={cn(
                      "font-mono text-xs truncate tracking-tight transition-colors",
                      isSelected ? "text-slate-950 dark:text-white font-black" : "text-slate-400 group-hover:text-slate-200"
                    )} title={res.config?.url}>
                      {displayPath}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono shrink-0 text-xs">
                    <span className={cn("font-black text-xs w-8 text-right", isSuccess ? "bg-emerald-500/10 px-1 py-0.5 rounded text-emerald-400" : "bg-rose-500/10 px-1 py-0.5 rounded text-rose-400")}>
                      {res.status !== 0 ? res.status : 'ERR'}
                    </span>
                    <span className="text-blue-400 font-bold w-14 text-right">{rt}ms</span>
                    <span className={cn(
                      "w-12 text-right text-[11px] font-medium transition-colors",
                      isSelected ? "text-slate-700 dark:text-slate-205 font-bold" : "text-slate-500"
                    )}>{formattedSize}</span>
                  </div>
                </motion.div>
              );
            })}

            {/* Pulsing Pending Line at bottom of logs queue while fetching next result */}
            {loading && (
              <motion.div 
                key="pending"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex border-l-2 border-amber-500 bg-amber-500/10 py-2 px-3 items-center min-h-[40px] gap-3 rounded-r text-amber-400"
              >
                <span className="text-slate-505 text-xs font-mono w-6 shrink-0">#{results.length + 1}</span>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="bg-[#FFAA00]/10 text-[#FFAA00] border border-[#FFAA00]/25 text-[9px] font-black px-1.5 py-0.5 rounded-[2px] leading-none tracking-wide animate-pulse font-mono">
                    SEND
                  </span>
                  <span className="font-mono text-xs text-[#FFAA00]/70 truncate tracking-tight animate-pulse">
                    Requesting transmission...
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RefreshCw size={11} className="text-amber-500 animate-spin" aria-hidden="true" />
                  <span className="text-xs font-mono text-amber-400/70 font-semibold">PENDING</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RHS Panel: Inspected Response viewer detail */}
      {selectedResult && (
        <div className="flex-1 flex flex-col h-full bg-black relative">
          <div className="p-3 px-4 border-b border-slate-900 bg-[#0F1115] flex items-center justify-between shrink-0 font-sans">
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => setSelectedResult(null)}
                 className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
                 aria-label="Close details inspector"
               >
                 <X size={12} aria-hidden="true" /> CLOSE_DETAIL
               </button>
               <span className="w-px h-3 bg-slate-800/80 mx-1"></span>
               <span className="text-xs font-mono text-slate-405 uppercase font-medium">
                 TRANSACTION_DETAIL #{results.findIndex(r => r.id === selectedResult.id) + 1}
               </span>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto no-scrollbar bg-black">
            <ResponseViewer 
              result={selectedResult} 
              loading={false} 
              onAbort={onAbort} 
              theme={theme} 
              defaultTab="response"
            />
          </div>
        </div>
      )}
    </div>
  );
}
