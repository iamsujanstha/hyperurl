import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Zap, Repeat, Settings2, ShieldAlert, Cpu, Flame, Globe, Terminal, Play, RefreshCw, Plus, Target, Activity, Server, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequestConfig } from '@/server/modules/curl-engine';
import { TEST_MODULES, TestModuleId, TestModule } from '../TestLabData';
import { TestLabPresets } from './TestLabPresets';
import { TestLabAssertions } from './TestLabAssertions';

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
  assertions: { id: string, type: string, value: string }[];
  addAssertion: () => void;
  removeAssertion: (id: string) => void;
  updateAssertion: (id: string, updates: Partial<{ type: string, value: string }>) => void;
  setAssertions: (arr: { id: string, type: string, value: string }[]) => void;
  curlStrategy: string;
  onStartTest: () => void;
  onAbort: () => void;
  onChangeConfig?: (updates: Partial<RequestConfig>) => void;
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
  assertions,
  addAssertion,
  removeAssertion,
  updateAssertion,
  setAssertions,
  curlStrategy,
  onStartTest,
  onAbort,
  onChangeConfig
}: TestLabSidebarProps): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'perf' | 'resilience' | 'security'>('all');
  const [showLabCurl, setShowLabCurl] = useState(false);

  const filteredModules = useMemo(() => {
    if (selectedCategory === 'all') return UI_MODULES;
    return UI_MODULES.filter(m => m.category === selectedCategory);
  }, [selectedCategory]);

  const totalIterations = concurrency * iterationsPerUser;

  return (
    <div className="w-[420px] bg-[#0F1115] border-r border-[#1E293B] flex flex-col overflow-y-auto custom-scrollbar shrink-0">
      <div className="p-5 space-y-6 flex-grow">
        
        {/* Sleek Test Strategy Selector */}
        <div className="space-y-3 bg-slate-900/30 p-4 border border-slate-800/80 rounded-xl">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">TEST STRATEGY</span>
          
          {/* Category Filter Tabs */}
          <div className="flex bg-black/60 p-1 border border-slate-800/50 rounded-lg gap-1">
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
                  "flex-1 py-1 text-[8px] font-extrabold tracking-wider uppercase rounded transition-all cursor-pointer select-none outline-none border",
                  selectedCategory === tab.id
                    ? "bg-slate-800 border-slate-705 text-emerald-400 font-black"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {filteredModules.map((module) => {
              const isActive = selectedModule === module.id;
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => {
                    setSelectedModule(module.id);
                    setSelectedResult(null); 
                  }}
                  className={cn(
                    "p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer relative overflow-hidden select-none outline-none",
                    isActive 
                      ? "bg-emerald-500/15 border-emerald-500/40 text-white" 
                      : "bg-black/40 border-slate-850 text-slate-400 hover:bg-slate-900/35 hover:border-slate-800 hover:text-slate-200"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-md border",
                    isActive ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[#090D14]/50 border-slate-850/80 text-slate-505"
                  )}>
                    {module.icon}
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] font-black font-mono tracking-wider block uppercase">{module.name.replace('_', ' ')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread controls & Error Mitigation */}
        {selectedModule !== 'basic_query' && (
          <>
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block border-b border-slate-800 pb-1.5">Concurrency Engine</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-extrabold flex items-center gap-1.5">
                    <Zap size={12} className="text-amber-400" /> Workers
                  </label>
                  <input 
                    type="number" 
                    value={concurrency}
                    onChange={(e) => {
                      setConcurrency(Math.max(1, parseInt(e.target.value) || 1));
                      setSelectedPresetId('');
                    }}
                    disabled={loading}
                    className="w-full bg-black border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 font-bold outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-330 uppercase font-extrabold flex items-center gap-1.5">
                    <Repeat size={12} className="text-blue-400" /> Iterations
                  </label>
                  <input 
                    type="number" 
                    value={iterationsPerUser}
                    onChange={(e) => {
                      setIterationsPerUser(Math.max(1, parseInt(e.target.value) || 1));
                      setSelectedPresetId('');
                    }}
                    disabled={loading}
                    className="w-full bg-black border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 font-bold outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between bg-black/40 p-3 border border-slate-800 rounded-lg text-xs font-mono">
                <span className="text-slate-350 font-bold">Cumulative Load:</span>
                <span className="text-emerald-400 font-black text-sm">{totalIterations} requests total</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Settings2 size={12} className="text-violet-400" /> Error tolerance
              </label>
              <select 
                value={retries}
                onChange={(e) => {
                  setRetries(parseInt(e.target.value));
                  setSelectedPresetId('');
                }}
                disabled={loading}
                className="w-full bg-black border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 outline-none cursor-pointer appearance-none"
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
            <div className="space-y-2">
              {[
                { key: 'sqli', label: 'PROBE SQL INJECTIONS (SQLI)' },
                { key: 'xss', label: 'PROBE CROSS-SITE SCRIPTING (XSS)' },
                { key: 'pathTraversal', label: 'LOCAL PATH TRAVERSAL PROBE' },
                { key: 'headersAuditor', label: 'AUDIT RESPONSE HEADERS HYGIENE' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3.5 text-xs font-mono text-slate-350 hover:text-white cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={(securityChecks as any)[item.key]} 
                    onChange={(e) => setSecurityChecks({ ...securityChecks, [item.key]: e.target.checked })}
                    className="w-4 h-4 accent-rose-500 bg-black border-slate-700 rounded transition-all" 
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
            <div className="space-y-2">
              {[
                { key: 'keyDeletions', label: 'MUTATE BY DELETING INTEGRAL KEYPAIRS' },
                { key: 'typeMutations', label: 'CROSS-MUTATE TYPES (STRING VS NUMBER)' },
                { key: 'bufferOverflow', label: 'FLOOD BY BUFFER OVERFLOWS (1000x STRING)' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3.5 text-xs font-mono text-slate-350 hover:text-white cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={(fuzzerChecks as any)[item.key]} 
                    onChange={(e) => setFuzzerChecks({ ...fuzzerChecks, [item.key]: e.target.checked })}
                    className="w-4 h-4 accent-purple-550 bg-black border-slate-700 rounded transition-all" 
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
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400 font-extrabold">MAX JITTER WAVE DELAY</span>
                <span className="text-orange-400 font-black">{chaosAmplitude}ms</span>
              </div>
              <input 
                type="range" 
                min={50} 
                max={1500} 
                step={50}
                value={chaosAmplitude}
                onChange={(e) => setChaosAmplitude(parseInt(e.target.value))}
                disabled={loading}
                className="w-full accent-orange-500 cursor-pointer h-1.5 bg-black rounded"
              />
              <div className="text-[10px] text-slate-450 leading-relaxed font-sans">
                Entropy adds packet delays and forces structural failures to stress resilience layers.
              </div>
            </div>
          </div>
        )}

        {selectedModule === 'distributed' && (
          <div className="space-y-3">
            <div className="p-4 bg-indigo-950/20 rounded-lg border border-indigo-500/30 space-y-3">
              <div className="text-xs font-black text-indigo-405 uppercase tracking-widest flex items-center gap-2 font-mono">
                <Globe size={14} /> Global Simulation Nodes
              </div>
              <div className="space-y-2">
                {[
                  { id: 'us', label: '🇺🇸 NORTH AMERICA (US-EAST / US-WEST)' },
                  { id: 'eu', label: '🇩🇪 EUROPE (FRANKFURT / LONDON / PARIS)' },
                  { id: 'apac', label: '🇯🇵 ASIA PACIFIC (TOKYO / SINGAPORE / SYDNEY)' },
                  { id: 'latam', label: '🇧🇷 LATIN AMERICA (SÃO PAULO / MEXICO / BOGOTÁ)' }
                ].map(region => {
                  const isChecked = selectedRegions.includes(region.id);
                  return (
                    <label key={region.id} className="flex items-center gap-3.5 text-xs font-mono text-slate-350 hover:text-white cursor-pointer select-none">
                      <input 
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
                        className="w-4 h-4 accent-indigo-500 bg-black border-slate-700 rounded transition-all" 
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
          setAssertions={setAssertions}
          setSelectedPresetId={setSelectedPresetId}
          setSelectedModule={setSelectedModule}
          selectedPresetId={selectedPresetId}
        />

        {/* Assertions Criteria */}
        <TestLabAssertions 
          assertions={assertions}
          loading={loading}
          addAssertion={addAssertion}
          updateAssertion={updateAssertion}
          removeAssertion={removeAssertion}
          setSelectedPresetId={setSelectedPresetId}
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
