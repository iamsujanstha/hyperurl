import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Zap, Repeat, Settings2, ShieldAlert, Cpu, Flame, Globe, Terminal, Play, RefreshCw, Plus, Target, Activity, Server, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequestConfig } from '@/server/modules/curl-engine';
import { TEST_MODULES, TestModuleId, TestModule } from '../TestLabData';
import { TestLabPresets } from './TestLabPresets';
import { Telemetry } from '@/features/api-tester/types';

interface TestLabSidebarProps {
  config: RequestConfig;
  loading: boolean;
  selectedModule: TestModuleId;
  setSelectedModule: (id: TestModuleId) => void;
  setSelectedResult: (res: any) => void;
  concurrency: number;
  setConcurrency: (val: number) => void;
  iterationsPerUser: number;
  setIterationsPerUser: (val: number) => void;
  retries: number;
  setRetries: (val: number) => void;
  securityChecks: { sqli: boolean, xss: boolean, pathTraversal: boolean, headersAuditor: boolean };
  setSecurityChecks: (checks: { sqli: boolean, xss: boolean, pathTraversal: boolean, headersAuditor: boolean }) => void;
  fuzzerChecks: { keyDeletions: boolean, typeMutations: boolean, bufferOverflow: boolean };
  setFuzzerChecks: (checks: { keyDeletions: boolean, typeMutations: boolean, bufferOverflow: boolean }) => void;
  chaosAmplitude: number;
  setChaosAmplitude: (val: number) => void;
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;
  selectedPresetId: string;
  setSelectedPresetId: (id: string) => void;
  curlStrategy: string;
  onStartTest: () => void;
  onAbort: () => void;
  onChangeConfig?: (updates: Partial<RequestConfig>) => void;
  telemetry: Telemetry;
}

const getModuleIcon = (id: TestModuleId) => {
  switch (id) {
    case 'basic_query': return <Target size={16} />;
    case 'blast': return <Zap size={16} />;
    case 'race': return <Activity size={16} />;
    case 'replay': return <Repeat size={16} />;
    case 'load': return <Server size={16} />;
    case 'chaos': return <Flame size={16} />;
    case 'fuzzer': return <Cpu size={16} />;
    case 'security_audit': return <Shield size={16} />;
    case 'distributed': return <Globe size={16} />;
  }
};

const UI_MODULES: (Omit<TestModule, 'category'> & { icon: React.ReactNode; category: 'perf' | 'resilience' | 'security' })[] = TEST_MODULES.map(mod => ({
  ...mod,
  icon: getModuleIcon(mod.id),
  category: mod.category as 'perf' | 'resilience' | 'security'
}));

export function TestLabSidebar({
  config,
  loading,
  selectedModule,
  setSelectedModule,
  setSelectedResult,
  concurrency,
  setConcurrency,
  iterationsPerUser,
  setIterationsPerUser,
  retries,
  setRetries,
  securityChecks,
  setSecurityChecks,
  fuzzerChecks,
  setFuzzerChecks,
  chaosAmplitude,
  setChaosAmplitude,
  selectedRegions,
  setSelectedRegions,
  selectedPresetId,
  setSelectedPresetId,
  curlStrategy,
  onStartTest,
  onAbort,
  onChangeConfig,
  telemetry
}: TestLabSidebarProps): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'perf' | 'resilience' | 'security'>('all');
  const [showLabCurl, setShowLabCurl] = useState(false);

  const filteredModules = useMemo(() => {
    if (selectedCategory === 'all') return UI_MODULES;
    return UI_MODULES.filter(m => m.category === selectedCategory);
  }, [selectedCategory]);

  const totalIterations = concurrency * iterationsPerUser;

  return (
    <div className="w-full h-full bg-[#0F1115] flex flex-col overflow-y-auto custom-scrollbar">
      <div className="p-5 space-y-6 flex-grow">
        
        {/* Sleek Test Strategy Selector */}
        <div className="space-y-3 bg-slate-900/30 p-4 border border-slate-800/80 rounded-xl">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">TEST STRATEGY</span>
          
          {/* Category Filter Tabs */}
          <div className="flex bg-black/60 p-1 border border-slate-800/50 rounded-lg gap-1 relative overflow-hidden">
            {[
              { id: 'all', label: 'All' },
              { id: 'perf', label: 'Perf' },
              { id: 'resilience', label: 'Resil' },
              { id: 'security', label: 'Security' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id as any)}
                className={cn(
                  "flex-1 py-1 text-[8px] font-extrabold tracking-wider uppercase rounded transition-all cursor-pointer select-none outline-none border relative z-10",
                  selectedCategory === tab.id
                    ? "text-emerald-400 font-black border-slate-700/30"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
                )}
              >
                {tab.label}
                {selectedCategory === tab.id && (
                  <motion.div
                    layoutId="activeCategoryTab"
                    className="absolute inset-0 bg-slate-800 border border-slate-700/60 rounded z-[-1]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {filteredModules.map((module) => {
                const isActive = selectedModule === module.id;
                return (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    key={module.id}
                    type="button"
                    onClick={() => {
                      setSelectedModule(module.id);
                      setSelectedResult(null); 
                    }}
                    className={cn(
                      "p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer relative overflow-hidden select-none outline-none min-h-[76px]",
                      isActive 
                        ? "bg-emerald-500/15 border-emerald-500/40 text-white" 
                        : "bg-black/40 border-slate-850 text-slate-400 hover:bg-slate-900/35 hover:border-slate-800 hover:text-slate-200"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-md border",
                      isActive ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[#090D14]/50 border-slate-850/80 text-slate-400"
                    )}>
                      {module.icon}
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] font-black font-mono tracking-wider block uppercase">{module.name.replace('_', ' ')}</span>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Thread controls & Error Mitigation */}
        {selectedModule !== 'basic_query' && (
          <>
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block border-b border-slate-800 pb-1.5">Concurrency Engine</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="concurrency-workers" className="text-[10px] font-mono text-slate-300 uppercase font-extrabold flex items-center gap-1.5">
                    <Zap size={12} className="text-amber-400" /> Workers
                  </label>
                  <input 
                    id="concurrency-workers"
                    type="number" 
                    value={concurrency}
                    onChange={(e) => {
                      setConcurrency(Math.max(1, parseInt(e.target.value) || 1));
                      setSelectedPresetId('');
                    }}
                    disabled={loading}
                    className="w-full bg-black border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="concurrency-iterations" className="text-xs font-mono text-slate-300 uppercase font-extrabold flex items-center gap-1.5">
                    <Repeat size={12} className="text-blue-400" /> Iterations
                  </label>
                  <input 
                    id="concurrency-iterations"
                    type="number" 
                    value={iterationsPerUser}
                    onChange={(e) => {
                      setIterationsPerUser(Math.max(1, parseInt(e.target.value) || 1));
                      setSelectedPresetId('');
                    }}
                    disabled={loading}
                    className="w-full bg-black border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between bg-black/40 p-3 border border-slate-800 rounded-lg text-xs font-mono">
                <span className="text-slate-300 font-bold">Cumulative Load:</span>
                <span className="text-emerald-400 font-black text-sm">{totalIterations} requests total</span>
              </div>
              {telemetry && (
                <div className="bg-slate-900/20 p-3.5 border border-slate-800/80 rounded-xl text-[11px] font-mono leading-relaxed space-y-1.5 select-none transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-350 font-bold uppercase tracking-wider text-[9px]">Multi-Thread Engine:</span>
                    {telemetry.activeWorkers > 0 ? (
                      <span className="text-[#38BDF8] font-extrabold flex items-center gap-1">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8] animate-pulse"></span>
                        REAL-THREAD POOL ({telemetry.activeWorkers} ACTIVE)
                      </span>
                    ) : (
                      <span className="text-slate-400 font-bold uppercase tracking-wide text-[10px]">
                        VIRTUAL LOOP
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-300 leading-normal font-sans">
                    {telemetry.activeWorkers > 0 
                      ? "✓ Background Node.js worker threads spawned! Stress test execution is distributed across physical OS threads." 
                      : "ⓘ Spawn real worker threads in the top-bar button to delegate execution to physical CPU threads."}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="error-tolerance" className="text-[10px] font-mono text-slate-300 uppercase font-bold flex items-center gap-1.5">
                <Settings2 size={12} className="text-violet-400" /> Error tolerance
              </label>
              <select 
                id="error-tolerance"
                value={retries}
                onChange={(e) => {
                  setRetries(parseInt(e.target.value));
                  setSelectedPresetId('');
                }}
                disabled={loading}
                className="w-full bg-black border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 outline-none cursor-pointer appearance-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value={0} className="bg-slate-900 text-white">NO RETRY (FAIL_FAST)</option>
                <option value={1} className="bg-slate-900 text-white">1X RETRY (RAPID_REATTEMPT)</option>
                <option value={2} className="bg-[#0f1115] text-white">2X RETRY (LINEAR_BACKOFF)</option>
              </select>
            </div>
          </>
        )}

        {/* Custom inputs based on module */}
        {selectedModule === 'security_audit' && (
          <div className="p-4 bg-rose-955/20 rounded-lg border border-rose-500/30 space-y-3">
            <div className="text-xs font-black text-rose-455 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert size={14} /> Security shield configuration
            </div>
            <div className="space-y-2" role="group" aria-label="Security Testing Presets">
              {[
                { key: 'sqli', label: 'PROBE SQL INJECTIONS (SQLI)' },
                { key: 'xss', label: 'PROBE CROSS-SITE SCRIPTING (XSS)' },
                { key: 'pathTraversal', label: 'LOCAL PATH TRAVERSAL PROBE' },
                { key: 'headersAuditor', label: 'AUDIT RESPONSE HEADERS HYGIENE' }
              ].map(item => (
                <label key={item.key} htmlFor={`security-${item.key}`} className="flex items-center gap-3.5 text-xs font-mono text-slate-300 hover:text-white cursor-pointer select-none">
                  <input 
                    id={`security-${item.key}`}
                    type="checkbox" 
                    checked={(securityChecks as any)[item.key]} 
                    onChange={(e) => setSecurityChecks({ ...securityChecks, [item.key]: e.target.checked })}
                    className="w-4 h-4 accent-rose-500 bg-black border-slate-700 rounded transition-all focus:ring-1 focus:ring-rose-500" 
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {selectedModule === 'fuzzer' && (
          <div className="p-4 bg-purple-955/20 rounded-lg border border-purple-500/30 space-y-3">
            <div className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2 font-mono">
              <Cpu size={14} /> Mutation fuzzer engine
            </div>
            <div className="space-y-2" role="group" aria-label="JSON Mutation Fuzzer Targets">
              {[
                { key: 'keyDeletions', label: 'MUTATE BY DELETING INTEGRAL KEYPAIRS' },
                { key: 'typeMutations', label: 'CROSS-MUTATE TYPES (STRING VS NUMBER)' },
                { key: 'bufferOverflow', label: 'FLOOD BY BUFFER OVERFLOWS (1000x STRING)' }
              ].map(item => (
                <label key={item.key} htmlFor={`fuzzer-${item.key}`} className="flex items-center gap-3.5 text-xs font-mono text-slate-300 hover:text-white cursor-pointer select-none">
                  <input 
                    id={`fuzzer-${item.key}`}
                    type="checkbox" 
                    checked={(fuzzerChecks as any)[item.key]} 
                    onChange={(e) => setFuzzerChecks({ ...fuzzerChecks, [item.key]: e.target.checked })}
                    className="w-4 h-4 accent-purple-500 bg-black border-slate-700 rounded transition-all focus:ring-1 focus:ring-purple-500" 
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {selectedModule === 'chaos' && (
          <div className="p-4 bg-orange-955/20 rounded-lg border border-orange-500/30 space-y-3">
            <div className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-2 font-mono">
              <Flame size={14} /> Entropy Chaos Injection
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-extrabold">MAX JITTER WAVE DELAY</span>
                <span className="text-orange-400 font-black">{chaosAmplitude}ms</span>
              </div>
              <label htmlFor="chaos-jitter-delay" className="sr-only">Maximum jitter delay configuration (ms)</label>
              <input 
                id="chaos-jitter-delay"
                type="range" 
                min={50} 
                max={1500} 
                step={50}
                value={chaosAmplitude}
                onChange={(e) => setChaosAmplitude(parseInt(e.target.value))}
                disabled={loading}
                className="w-full accent-orange-500 cursor-pointer h-1.5 bg-black rounded outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="text-[10px] text-slate-300 leading-relaxed font-sans">
                Entropy adds packet delays and forces structural failures to stress resilience layers.
              </div>
            </div>
          </div>
        )}

        {selectedModule === 'distributed' && (
          <div className="space-y-3">
            <div className="p-4 bg-indigo-950/20 rounded-lg border border-indigo-500/30 space-y-3">
              <div className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                <Globe size={14} /> Global Simulation Nodes
              </div>
              <div className="space-y-2" role="group" aria-label="Distributed Region Routing Options">
                {[
                  { id: 'us', label: '🇺🇸 NORTH AMERICA (US-EAST / US-WEST)' },
                  { id: 'eu', label: '🇩🇪 EUROPE (FRANKFURT / LONDON / PARIS)' },
                  { id: 'apac', label: '🇯🇵 ASIA PACIFIC (TOKYO / SINGAPORE / SYDNEY)' },
                  { id: 'latam', label: '🇧🇷 LATIN AMERICA (SÃO PAULO / MEXICO / BOGOTÁ)' }
                ].map(region => {
                  const isChecked = selectedRegions.includes(region.id);
                  return (
                    <label key={region.id} htmlFor={`region-${region.id}`} className="flex items-center gap-3.5 text-xs font-mono text-slate-350 hover:text-white cursor-pointer select-none">
                      <input 
                        id={`region-${region.id}`}
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRegions([...selectedRegions, region.id]);
                          } else {
                            if (selectedRegions.length > 1) {
                              setSelectedRegions(selectedRegions.filter(r => r !== region.id));
                            }
                          }
                        }}
                        className="w-4 h-4 accent-indigo-500 bg-black border-slate-700 rounded transition-all focus:ring-1 focus:ring-indigo-500" 
                      />
                      {region.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* QA Presets Component integration */}
        <TestLabPresets 
          config={config}
          onChangeConfig={onChangeConfig}
          setConcurrency={setConcurrency}
          setIterationsPerUser={setIterationsPerUser}
          setSelectedPresetId={setSelectedPresetId}
          setSelectedModule={setSelectedModule}
          selectedPresetId={selectedPresetId}
        />

        {/* Target Curl Strategy Code Previews */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Target curl strategy</span>
            <button 
              onClick={() => setShowLabCurl(!showLabCurl)}
              className={cn(
                "text-xs font-mono flex items-center gap-1.5 uppercase transition-all px-2.5 py-1 rounded-lg border",
                showLabCurl ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" : "bg-white/5 border-slate-800/45 text-slate-400 hover:text-slate-200"
              )}
            >
              <Terminal size={12} /> {showLabCurl ? 'HIDE CODE' : 'SHOW SHELL'}
            </button>
          </div>
          <AnimatePresence>
            {showLabCurl && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 bg-black border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre-wrap break-all shadow-inner select-all">
                   {curlStrategy}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Roster execution button */}
      <div className="p-4 bg-black/55 border-t border-slate-800 space-y-3 shrink-0">
        <button
          onClick={loading ? onAbort : onStartTest}
          disabled={!config.url}
          className={cn(
            "w-full py-4 rounded-xl text-xs sm:text-sm font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 active:scale-95 shadow-lg select-none cursor-pointer",
            loading 
              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 animate-pulse font-black" 
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 disabled:opacity-25 border border-emerald-500/40 font-black h-12"
          )}
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="animate-spin" /> ABORT ACTIVE RUNNER
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" /> INITIATE STRESS SEQUENCE
            </>
          )}
        </button>
      </div>
    </div>
  );
}
