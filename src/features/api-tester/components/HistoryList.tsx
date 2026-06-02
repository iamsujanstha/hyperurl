import React, { useState, useEffect } from 'react';

export function HistoryList() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/history')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP_${r.status}`);
        return r.json();
      })
      .then(setHistory)
      .catch(err => {
        console.error('History fetch failed:', err);
        setHistory([]);
      });
  }, []);

  return (
    <div className="flex-grow overflow-hidden flex flex-col bg-[#0F1115] border border-slate-800/80 rounded-xl">
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar min-h-[350px]">
        {history.length === 0 && (
          <div className="text-center p-16 text-slate-500 font-mono text-sm italic">
            NO_PREVIOUS_REPORTS_FOUND_IN_CACHE
          </div>
        )}
        {history.map((item, idx) => (
          <div key={idx} className="p-4 bg-black/45 hover:bg-black/60 border border-slate-800/60 rounded-xl group hover:border-[#10B981]/50 transition-all shadow-md animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 border-b border-slate-850 pb-2.5">
              <div className="flex items-center gap-3.5 min-w-0">
                <span className={`text-xs font-black px-2 py-0.75 rounded-md border tracking-wider select-none ${
                  item.batch ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-emerald-555/40 text-emerald-400 bg-emerald-500/10'
                }`}>
                  {item.batch ? 'BATCH' : item.request.method}
                </span>
                <span className="text-xs sm:text-sm font-semibold font-mono text-slate-100 truncate max-w-[550px] tracking-wide">
                  {item.request.url}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-450 tracking-wide select-none">
                {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            
            {item.batch ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-900/30 rounded-lg border border-slate-800/50">
                <div className="text-center border-r border-slate-850 md:border-r last:border-0 p-1">
                   <div className="text-[10px] font-black text-slate-400 uppercase font-mono tracking-wider mb-1">TOTAL_REQS</div>
                   <div className="text-base font-black font-mono text-white tracking-widest">{item.batch.iterations}</div>
                </div>
                <div className="text-center border-r-0 md:border-r border-slate-850 last:border-0 p-1">
                   <div className="text-[10px] font-black text-slate-400 uppercase font-mono tracking-wider mb-1">CONCURRENCY</div>
                   <div className="text-base font-black font-mono text-amber-500">{item.batch.concurrency}</div>
                </div>
                <div className="text-center border-r border-slate-850 last:border-0 p-1">
                   <div className="text-[10px] font-black text-slate-400 uppercase font-mono tracking-wider mb-1">OK_RESP</div>
                   <div className="text-base font-black font-mono text-emerald-500">{item.batch.successCount}</div>
                </div>
                <div className="text-center p-1">
                   <div className="text-[10px] font-black text-slate-400 uppercase font-mono tracking-wider mb-1">AVG_LATENCY</div>
                   <div className="text-base font-black font-mono text-blue-400">{item.batch.avgResponseTime?.toFixed(0)}ms</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-xs font-mono text-slate-350 pr-1 pl-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 uppercase font-black tracking-wider text-[10px]">RESPONSE:</span>
                  <span className={`font-black px-1.5 py-0.5 rounded-md text-xs border ${
                    item.result.status < 300 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {item.result.status}
                  </span>
                </div>
                <span className="opacity-30">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 uppercase font-black tracking-wider text-[10px]">LATENCY:</span>
                  <span className="text-blue-400 font-bold">{item.result.responseTime}ms</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
