import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Activity, BarChart4, Globe, Trash2, X, Layout, FileJson, Copy, Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurlResult, RequestConfig } from '@/server/modules/curl-engine';
import { ProgressUpdate } from '@/server/modules/runner';
import { TestModuleId } from '../TestLabData';
import { LabJsonInteractiveNode } from './LabJsonInteractiveNode';

interface ExtendedCurlResult extends CurlResult {
  retriesApplied?: number;
}

interface TestLabResultsProps {
  results: ExtendedCurlResult[];
  loading: boolean;
  progress: ProgressUpdate | null;
  selectedModule: TestModuleId;
  assertions: { id: string; type: string; value: string }[];
  percentiles: { p50: number; p90: number; p95: number; p99: number };
  latencyCategories: {
    fast: { count: number; pct: number };
    acceptable: { count: number; pct: number };
    slow: { count: number; pct: number };
    lagging: { count: number; pct: number };
  };
  regionalBreakdown: { id: string; count: number; ok: number; sumTime: number; flag: string; label: string; avgTime: number; successPct: number }[] | null;
  securityAudit: {
    totalAlerts: number;
    items: { name: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'PASS'; status: string; detail: string; recommendation: string }[];
  } | null;
  activeModule: { name: string };
  selectedResult: ExtendedCurlResult | null;
  setSelectedResult: (res: ExtendedCurlResult | null) => void;
  payloadTab: 'pretty' | 'raw';
  setPayloadTab: (tab: 'pretty' | 'raw') => void;
  logDetailWidth: number;
  setIsDraggingLogDetail: (val: boolean) => void;
  getFailedAssertionsCount: (res: ExtendedCurlResult) => number;
  handleClearLogs: () => void;
  config: RequestConfig;
}

export function TestLabResults({
  results,
  loading,
  progress,
  selectedModule,
  assertions,
  percentiles,
  latencyCategories,
  regionalBreakdown,
  securityAudit,
  activeModule,
  selectedResult,
  setSelectedResult,
  payloadTab,
  setPayloadTab,
  logDetailWidth,
  setIsDraggingLogDetail,
  getFailedAssertionsCount,
  handleClearLogs,
  config
}: TestLabResultsProps): React.JSX.Element {

  const [balance, setBalance] = React.useState<number | null>(null);
  const [isResetting, setIsResetting] = React.useState(false);

  const fetchBalance = React.useCallback(async () => {
    try {
      const res = await fetch('/api/race-demo/balance');
      const data = await res.json();
      if (typeof data.balance === 'number') {
        setBalance(data.balance);
      }
    } catch (e) {
      console.error("Error reading balance:", e);
    }
  }, []);

  React.useEffect(() => {
    if (selectedModule === 'race' || (config.url && (config.url.includes('orders') || config.url.includes('race-demo')))) {
      fetchBalance();
      const timer = setInterval(fetchBalance, 1500);
      return () => clearInterval(timer);
    }
  }, [selectedModule, config.url, fetchBalance]);

  React.useEffect(() => {
    if (selectedModule === 'race' || (config.url && (config.url.includes('orders') || config.url.includes('race-demo')))) {
      fetchBalance();
    }
  }, [results, progress, selectedModule, config.url, fetchBalance]);

  const handleResetBalance = async () => {
    setIsResetting(true);
    try {
      await fetch('/api/race-demo/reset', { method: 'POST' });
      await fetchBalance();
    } catch (e) {
      console.error("Error resetting ledger:", e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex-grow overflow-y-auto p-5 custom-scrollbar space-y-2 bg-[#050608]/50">
       
       {/* Live Atomic Ledger state monitor for Race conditions */}
       {(selectedModule === 'race' || (config.url && (config.url.includes('orders') || config.url.includes('race-demo')))) && (
         <div className="bg-[#090D14] border border-violet-500/20 p-4 rounded-xl mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl select-none relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
           <div className="flex items-center gap-3 relative z-10">
             <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
               <Repeat size={16} className={cn(loading ? "animate-spin text-emerald-400" : "")} />
             </div>
             <div>
               <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-100 font-mono">Live Transactional Storage Monitor</h4>
               <p className="text-[9px] text-slate-455 mt-0.5 uppercase font-mono font-bold">Shared Database State (Simulated Race-Condition Sandbox)</p>
             </div>
           </div>

           <div className="flex items-center gap-3 relative z-10 shrink-0">
             <div className="py-2.5 px-4 bg-black border border-slate-800 rounded-lg flex flex-col items-center min-w-[120px]">
               <span className="text-[8px] font-black font-mono text-slate-500 tracking-wider">LEDGER_BALANCE</span>
               <span className={cn(
                 "text-sm font-black font-mono tracking-tight mt-0.5 transition-colors",
                 balance === null ? "text-slate-600" :
                 balance < 0 ? "text-rose-400 animate-pulse" :
                 balance === 0 ? "text-amber-400" : "text-emerald-400"
               )}>
                 {balance === null ? "FETCHING..." : `$${balance.toLocaleString()}`}
               </span>
             </div>

             <button
               type="button"
               onClick={handleResetBalance}
               disabled={isResetting}
               className="px-3.5 h-[46px] text-[10px] font-mono rounded-lg bg-slate-900 border border-slate-805 text-slate-350 hover:text-white hover:border-violet-500 hover:bg-slate-950 transition-all font-black select-none cursor-pointer flex items-center justify-center"
             >
               <span>{isResetting ? "RESETTING..." : "RESET_LEDGER"}</span>
             </button>
           </div>
         </div>
       )}

       {/* Assessment Diagnostics complete summary panel once test is completed */}
       {!loading && results.length > 0 && (
         <div className="bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-slate-950/60 border border-emerald-500/30 p-5 rounded-xl mb-4 space-y-4 shadow-xl select-text">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-455 rounded-lg flex items-center justify-center">
                 <ShieldAlert size={18} />
               </div>
               <div>
                 <h3 className="text-xs font-black text-white font-mono tracking-wider uppercase leading-none">Diagnostic Completed</h3>
                 <p className="text-[10px] text-slate-455 mt-1 uppercase font-mono font-bold">Analysis Profile for real life verification</p>
               </div>
             </div>
             
             {/* Grade rating calculation */}
             {(() => {
               const successPct = Math.round((results.filter(r => r.status < 400).length / results.length) * 100);
               const avgLat = results.reduce((acc, r) => acc + r.responseTime, 0) / results.length;
               const failedAss = results.filter(r => getFailedAssertionsCount(r) > 0).length;
               
               let grade = "A+";
               let gradeColor = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-emerald-500/5";

               if (successPct < 80 || failedAss > results.length * 0.4) {
                 grade = "F";
                 gradeColor = "text-rose-450 border-rose-500/30 bg-rose-500/10 shadow-rose-500/5";
               } else if (avgLat > 600) {
                 grade = "D";
                 gradeColor = "text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-amber-500/5";
               } else if (avgLat > 300) {
                 grade = "C";
                 gradeColor = "text-amber-300 border-amber-500/20 bg-amber-500/5";
               } else if (successPct < 100) {
                 grade = "B";
                 gradeColor = "text-blue-400 border-blue-500/30 bg-blue-500/10 shadow-blue-500/5";
               }
               
               return (
                 <div className="flex items-center gap-4">
                   <div className={cn("px-4 py-2 border rounded-xl text-center shadow-md font-sans", gradeColor)}>
                     <div className="text-[9px] font-mono font-black text-slate-400 uppercase leading-none mb-0.5 whitespace-nowrap">HEALTH SCORE</div>
                     <span className="text-xl font-black font-mono tracking-tighter leading-none">{grade}</span>
                   </div>
                 </div>
               );
             })()}
           </div>
           
           {/* Quick stats grid inside report */}
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
             <div className="bg-black/40 p-2.5 border border-slate-850 rounded-lg">
               <span className="text-[10px] font-mono text-slate-400 font-bold block mb-0.5 uppercase">AVERAGE LATENCY</span>
               <span className="text-sm font-black font-mono text-white">
                 {(results.reduce((acc, r) => acc + r.responseTime, 0) / results.length || 0).toFixed(0)}ms
               </span>
             </div>
             <div className="bg-black/40 p-2.5 border border-slate-850 rounded-lg">
               <span className="text-[10px] font-mono text-slate-400 font-bold block mb-0.5 uppercase">VERIFICATION PASSED</span>
               <span className={cn("text-xs font-black font-mono", results.every(r => getFailedAssertionsCount(r) === 0) ? "text-emerald-400" : "text-amber-400")}>
                 {results.filter(r => getFailedAssertionsCount(r) === 0).length} / {results.length} PASSED
               </span>
             </div>
             <div className="bg-black/40 p-2.5 border border-slate-850 rounded-lg">
               <span className="text-[10px] font-mono text-slate-400 font-bold block mb-0.5 uppercase">90TH PERCENTILE</span>
               <span className="text-sm font-black font-mono text-white">{percentiles.p90}ms</span>
             </div>
             <div className="bg-black/40 p-2.5 border border-slate-850 rounded-lg">
               <span className="text-[10px] font-mono text-slate-400 font-bold block mb-0.5 uppercase">99TH PERCENTILE</span>
               <span className="text-sm font-black font-mono text-white">{percentiles.p99}ms</span>
             </div>
           </div>
         </div>
       )}

       {/* Custom QA Security Audit Report Panel */}
       {!loading && securityAudit && (
         <div className="bg-slate-900/80 border border-rose-500/20 p-5 rounded-xl mb-4 space-y-4 shadow-xl select-text">
           <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
             <div className="flex items-center gap-3">
               <div className={cn(
                 "p-2 rounded-lg flex items-center justify-center font-black text-[10px] border font-mono select-none leading-none",
                 securityAudit.totalAlerts > 0 
                   ? "bg-rose-500/10 border-rose-500/30 text-rose-455" 
                   : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
               )}>
                 {securityAudit.totalAlerts > 0 ? "VULNERABLE" : "SECURE PASS"}
               </div>
               <div>
                 <h3 className="text-xs font-black text-white font-mono tracking-wider uppercase leading-none">Vulnerability Compliance Report</h3>
                 <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono font-bold leading-none">API Security assessment diagnostic</p>
               </div>
             </div>
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-mono text-slate-500 font-bold uppercase leading-none">ALERTS FOUND:</span>
               <span className={cn(
                 "px-2 py-0.5 rounded font-mono font-black border text-xs leading-none",
                 securityAudit.totalAlerts > 0 ? "bg-rose-500/10 border-rose-500/30 text-rose-455" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
               )}>
                 {securityAudit.totalAlerts}
               </span>
             </div>
           </div>

           <div className="space-y-3">
             {securityAudit.items.map((item, idx) => {
               const isPass = item.severity === 'PASS';
               return (
                 <div key={idx} className={cn(
                   "p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors",
                   isPass 
                     ? "bg-[#090D14]/40 border-slate-850" 
                     : item.severity === 'CRITICAL' 
                       ? "bg-rose-950/20 border-rose-500/20" 
                       : item.severity === 'HIGH'
                         ? "bg-rose-950/15 border-rose-500/15"
                         : "bg-amber-950/10 border-amber-500/15"
                 )}>
                   <div className="space-y-1.5 flex-1 select-text">
                     <div className="flex items-center gap-2.5 h-4">
                       <span className={cn(
                         "text-[8px] font-extrabold font-mono px-1.5 py-0.5 rounded uppercase leading-none tracking-wider",
                         isPass 
                           ? "bg-emerald-500/10 text-emerald-550 border border-emerald-500/20" 
                           : item.severity === 'CRITICAL' 
                             ? "bg-rose-550 text-black leading-none py-0.5" 
                             : item.severity === 'HIGH'
                               ? "bg-rose-500/15 text-rose-550 border border-rose-500/25 leading-none"
                               : "bg-amber-500/10 text-amber-550 border border-amber-500/25 leading-none"
                       )}>
                         {item.severity}
                       </span>
                       <span className="text-xs font-black text-slate-200 font-mono tracking-wide leading-none">{item.name}</span>
                     </div>
                     <p className="text-xs text-slate-350 leading-relaxed font-sans mt-1">{item.detail}</p>
                     {!isPass && (
                       <div className="text-[11px] text-slate-400 font-sans border-t border-slate-800/80 pt-1.5 mt-1.5 flex items-start gap-1 font-bold">
                         <span className="font-mono font-black text-rose-455 uppercase tracking-tighter shrink-0 text-[10px] [word-spacing:-3px] leading-none">REMEDIATION :</span>
                         <span className="leading-relaxed -mt-0.5">{item.recommendation}</span>
                       </div>
                     )}
                   </div>
                   <div className={cn(
                     "text-[10px] font-mono font-black tracking-wider uppercase px-2.5 py-1 rounded-md shrink-0 border select-none self-start sm:self-auto text-center font-bold",
                     isPass 
                       ? "bg-emerald-950/10 border-emerald-500/15 text-emerald-500" 
                       : "bg-rose-950/20 border-rose-505/25 text-rose-400"
                   )}>
                     {item.status}
                   </div>
                 </div>
               );
             })}
           </div>
         </div>
       )}

       {/* Latency Distribution Graph always available above logs */}
       {results.length > 0 && (
         <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl mb-4 space-y-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <BarChart4 size={14} className="text-emerald-400" />
               <span className="text-xs font-black tracking-wider text-slate-300 font-mono uppercase">Telemetry Response Latency Distribution</span>
             </div>
             <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">In-Transit Allocation</span>
           </div>

           <div className="grid grid-cols-4 gap-2 text-center select-none">
             {[
               { label: 'FAST', limit: '<150ms', color: 'bg-emerald-500 shadow-emerald-550/15', ...latencyCategories.fast },
               { label: 'NOMINAL', limit: '150-450ms', color: 'bg-blue-500 shadow-blue-550/15', ...latencyCategories.acceptable },
               { label: 'SLOW', limit: '450-1000ms', color: 'bg-amber-500 shadow-amber-550/15', ...latencyCategories.slow },
               { label: 'LAGGING', limit: '>1000ms', color: 'bg-rose-500 shadow-rose-550/15', ...latencyCategories.lagging }
             ].map((cat) => (
               <div key={cat.label} className="bg-black/50 p-2 border border-slate-850/80 rounded-lg flex flex-col justify-between">
                 <div>
                   <div className="text-[10px] font-mono text-slate-300 uppercase font-black">{cat.label}</div>
                   <div className="text-[9px] font-mono text-slate-500 font-semibold">{cat.limit}</div>
                 </div>
                 <div className="my-2.5 flex items-end justify-center h-12 bg-slate-950/40 rounded-md p-1 border border-slate-900/50">
                   <div 
                     style={{ height: `${Math.max(4, cat.pct)}%` }}
                     className={cn("w-full max-w-[16px] rounded-sm transition-all duration-300 shadow", cat.color)}
                   />
                 </div>
                 <div>
                   <div className="text-sm font-black font-mono text-white">{cat.count}</div>
                   <div className="text-[10px] font-mono text-slate-400 font-extrabold bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 mt-1">{cat.pct}%</div>
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}

       {/* Geographical Simulation Nodes Metrics Breakdown (Exclusive for Distributed load test mode) */}
       {selectedModule === 'distributed' && regionalBreakdown && results.length > 0 && (
         <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl mb-4 space-y-4">
           <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
             <div className="flex items-center gap-2">
               <Globe size={14} className="text-violet-400 animate-pulse" />
               <span className="text-xs font-black tracking-wider text-slate-300 font-mono uppercase">Geographical Routing Quality Metrics</span>
             </div>
             <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Node Breakdown</span>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
             {regionalBreakdown.map(region => {
               const isRegionActive = region.count > 0;
               return (
                 <div 
                   key={region.id} 
                   className={cn(
                     "p-3 rounded-lg border flex items-center justify-between",
                     isRegionActive 
                       ? "bg-black/60 border-violet-500/20 shadow-sm" 
                       : "bg-black/20 border-slate-900 opacity-40"
                   )}
                 >
                   <div className="space-y-1">
                     <div className="text-xs font-bold text-white flex items-center gap-1.5">
                       <span>{region.flag}</span>
                       <span className="truncate max-w-[150px]">{region.label}</span>
                     </div>
                     <div className="text-[10px] text-slate-505 font-bold">
                       LOAD: <span className="text-violet-400 font-black">{region.count} REQS</span>
                     </div>
                   </div>
                   <div className="text-right space-y-1 shrink-0">
                     <div className="text-xs font-black text-amber-400">
                       {region.avgTime > 0 ? `~${region.avgTime}ms` : '—'}
                     </div>
                     {region.count > 0 ? (
                       <div className={cn(
                         "text-[9px] font-black border rounded px-1.5 py-0.5 inline-block uppercase",
                         region.successPct >= 90 
                           ? "text-emerald-400 border-emerald-950 bg-emerald-950/20"
                           : "text-rose-400 border-rose-950 bg-rose-950/20"
                       )}>
                         {region.successPct}% PASS
                       </div>
                     ) : (
                       <div className="text-[9px] text-slate-600 font-bold">INACTIVE</div>
                     )}
                   </div>
                 </div>
               );
             })}
           </div>
         </div>
       )}

       {results.length === 0 && !loading && (
         <div className="h-full flex flex-col items-center justify-center p-20 opacity-40 text-center space-y-4">
           <div className="w-16 h-16 border border-slate-705 border-dashed rounded-full flex items-center justify-center">
              <Activity size={24} className="text-emerald-400" />
           </div>
           <div className="uppercase tracking-widest font-mono text-xs text-white font-black">Standby Stream Init</div>
           <p className="text-xs text-slate-350 max-w-sm leading-relaxed font-sans">
             Press <span className="font-bold text-emerald-400">"INITIATE STRESS SEQUENCE"</span> or click on a Preset to dispatch mock concurrent workflows and verify endpoints.
           </p>
         </div>
       )}

       {[...results].reverse().map((res, i) => {
         const currentIdx = res.iterationIndex !== undefined ? res.iterationIndex + 1 : (progress?.completed ?? results.length) - i;
         const isSelected = selectedResult?.id === res.id;
         const fails = getFailedAssertionsCount(res);
         const passedAll = fails === 0;
         const rt = res.responseTime;
         const tag = rt < 150 
           ? { label: 'FAST', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' }
           : rt < 450 
             ? { label: 'NOMINAL', color: 'bg-blue-500/10 text-blue-450 border border-blue-500/20' }
             : rt < 1000 
               ? { label: 'SLOW', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' }
               : { label: 'LAGGING', color: 'bg-rose-500/15 text-rose-455 border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]' };
         return (
           <div 
             key={res.id} 
             onClick={() => setSelectedResult(res)}
             className={cn(
               "group flex border-l-4 py-3 pl-4 pr-3.5 rounded-lg transition-all cursor-pointer items-center min-h-[44px] select-none text-xs font-mono mb-1.5",
               isSelected 
                 ? "bg-slate-800 text-white border-emerald-500 shadow-md" 
                 : passedAll 
                   ? "border-slate-850 hover:border-emerald-505/70 hover:bg-[#10b981]/10 bg-black/20"
                   : "border-rose-950 hover:border-rose-500/70 hover:bg-rose-505/5 bg-rose-950/10"
             )}
           >
             <span className="text-slate-400 w-20 shrink-0 font-bold group-hover:text-amber-400 transition-colors">➔ {rt}ms</span>
             <span className={cn("w-14 font-black", res.status < 300 ? "text-emerald-400" : "text-rose-400")}>
               [{res.status}]
             </span>
             <span className="text-slate-200 flex-grow truncate uppercase tracking-tight group-hover:text-white transition-colors">
               <span className="text-slate-500 opacity-90 mr-2 font-bold">#{currentIdx}</span>
               {selectedModule === 'fuzzer' && <span className="text-cyan-400 font-extrabold mr-1.5">[MUTATED]</span>}
               {selectedModule === 'replay' && <span className="text-blue-400 font-extrabold mr-1.5">[CLONED]</span>}
               {selectedModule === 'chaos' && <span className="text-rose-455 font-extrabold mr-1.5">[CORRUPTED]</span>}
               {res.simulatedIp ? (
                  <span className="text-violet-400 font-extrabold mr-1.5 inline-flex items-center gap-1.5">
                    <Globe size={11} className="text-violet-400 animate-pulse" />
                    [DISTRIBUTED] {res.simulatedFlag} {res.simulatedIp} <span className="text-slate-500 font-black text-[9px]">({res.simulatedRegion?.split(' ')[0]})</span>
                  </span>
                ) : (
                  activeModule.name
                )}
             </span>
             <div className="flex items-center shrink-0 ml-2 gap-1.5">
               <span className={cn("text-[8px] font-black tracking-wider px-2 py-0.5 rounded uppercase font-mono border", tag.color)}>
                 {tag.label}
               </span>
                {res.retriesApplied !== undefined && (
                  <span className="text-[10px] font-black text-amber-400 bg-amber-500/15 px-2 py-1/2 rounded border border-amber-500/30 font-mono tracking-wider flex items-center gap-1">
                    <Repeat size={10} className="animate-spin" /> {res.retriesApplied}R
                  </span>
                )}
               {passedAll ? (
                 <span className="text-[10px] font-black text-emerald-400 uppercase font-mono bg-emerald-500/15 px-2.5 py-0.5 rounded border border-emerald-500/30">
                   ✓ PASS
                 </span>
               ) : (
                 <span className="text-[10px] font-black text-rose-400 uppercase font-mono bg-rose-500/15 px-2.5 py-0.5 rounded border border-rose-500/30 flex items-center gap-1">
                   ✗ FAIL ({fails})
                 </span>
               )}
             </div>
           </div>
         );
       })}
    </div>
  );
}
