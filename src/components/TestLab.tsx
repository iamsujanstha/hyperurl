import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Shield, Repeat, Target, Flame, AlertTriangle, Cpu, Activity, 
  Play, Info, Settings2, BarChart4, Terminal, X, RefreshCw, Layout, 
  Beaker, ChevronDown, Copy, Code2, Globe, Server, Hash, Clock, Plus, Trash2, List, ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';
import { RequestConfig, CurlResult } from '../server/modules/curl-engine';
import { ProgressUpdate } from '../server/modules/runner';

export type TestModuleId = 'blast' | 'race' | 'replay' | 'load' | 'chaos' | 'rate' | 'fuzzer' | 'scenario';

interface TestModule {
  id: TestModuleId;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  strategy: string;
  settingsTitle: string;
  primaryMetric: string;
  theory: string;
}

const TEST_MODULES: TestModule[] = [
  {
    id: 'blast',
    name: 'CONCURRENT_BLAST',
    description: 'High-density concurrent execution to verify endpoint saturation limit.',
    icon: <Zap size={16} />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40',
    strategy: 'PARALLEL_STORM',
    settingsTitle: 'STRESS_LEVEL',
    primaryMetric: 'THROUGHPUT',
    theory: 'Saturation testing identifies peak capacity. Saturating the CPU and I/O request queues monitors the exact Point of Failure (PoF) where latency degrades exponentially.'
  },
  {
    id: 'race',
    name: 'RACE_DETECTOR',
    description: 'Injects overlapping micro-delays to trigger state collisions.',
    icon: <Shield size={16} />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/40',
    strategy: 'ATOMIC_INTEGRITY',
    settingsTitle: 'COLLISION_WINDOW',
    primaryMetric: 'STATE_DRIFT',
    theory: 'Race conditions happen when backend outcomes depend on request timing. Inundating a cluster simultaneously targets race scenarios in read-modify-write fields.'
  },
  {
    id: 'replay',
    name: 'REPLAY_GUARD',
    description: 'Replays payload and telemetry signatures to verify idempotency guards.',
    icon: <Repeat size={16} />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/40',
    strategy: 'IDEMPOTENCY_PROBE',
    settingsTitle: 'DEDUPLICATOR',
    primaryMetric: 'DEDUPE_RATIO',
    theory: 'Deduplication guarantees that processing multiple identical payloads has the same system impact as a single transaction—essential for payment streams.'
  },
  {
    id: 'load',
    name: 'LOAD_CANNON',
    description: 'Sustained throughput testing with worker queue orchestration.',
    icon: <Target size={16} />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/40',
    strategy: 'SUSTAINED_PRESSURE',
    settingsTitle: 'QUEUE_DEPTH',
    primaryMetric: 'LATENCY_P99',
    theory: 'Sustained profiles monitor reliability against performance contracts (SLA logs). It analyzes latency over time under nominal target expectations.'
  },
  {
    id: 'chaos',
    name: 'CHAOS_MODE',
    description: 'Simulates connection drops, packet limits, & structural network decay.',
    icon: <Flame size={16} />,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/40',
    strategy: 'ENTROPY_ENGINE',
    settingsTitle: 'ENTROPY_RATIO',
    primaryMetric: 'ERROR_RATE',
    theory: 'Entropy engineering validates fallback resiliency. Simulating physical outages forces your API endpoints to handle structural exceptions elegantly.'
  },
  {
    id: 'rate',
    name: 'RATE_BREAKER',
    description: 'Frequency staging scans to map API endpoint throttling limitations.',
    icon: <AlertTriangle size={16} />,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/40',
    strategy: 'LIMITS_DISCOVERY',
    settingsTitle: 'BURST_PEAK',
    primaryMetric: 'LIMIT_HIT_TIME',
    theory: 'Rate limits protect computational cycles. This suite triggers consecutive micro-bursts of API packets until status 429 Too Many Requests triggers.'
  },
  {
    id: 'fuzzer',
    name: 'PAYLOAD_FUZZER',
    description: 'Mutates variable inputs & fields to detect type vulnerabilities.',
    icon: <Cpu size={16} />,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/40',
    strategy: 'MUTATION_STRESS',
    settingsTitle: 'MUTATION_DEPTH',
    primaryMetric: 'VULN_DISCOVERY',
    theory: 'Fuzzing supplies arbitrary structures to the parsing logic. This exposes bad exception handlers, unquoted fields, or implicit casting crashes.'
  },
  {
    id: 'scenario',
    name: 'SCENARIO_RUNNER',
    description: 'Sequential request pipelines with dynamic schema dependencies.',
    icon: <Activity size={16} />,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/40',
    strategy: 'PIPELINE_FLOW',
    settingsTitle: 'PIPELINE_STAGES',
    primaryMetric: 'CHAIN_SUCCESS',
    theory: 'Active clients don\'t run endpoints in isolation. Scenario testing orchestrates stateful changes to confirm transactional integrity across paths.'
  }
];



interface TestLabProps {
  config: RequestConfig;
  headersList: { id: string, key: string, value: string }[];
  ws: WebSocket | null;
  activeTabId: string;
  loading: boolean;
  progress: ProgressUpdate | null;
  results: CurlResult[];
  onStart: (moduleId: TestModuleId, settings: any) => void;
  onAbort: () => void;
  onChangeConfig?: (updates: Partial<RequestConfig>) => void;
}

export function TestLab({ config, headersList, ws, activeTabId, loading, progress, results, onStart, onAbort, onChangeConfig }: TestLabProps) {
  const [selectedModule, setSelectedModule] = useState<TestModuleId>('blast');
  const [selectedResult, setSelectedResult] = useState<CurlResult | null>(null);
  const [iterationsPerUser, setIterationsPerUser] = useState(10);
  const [concurrency, setConcurrency] = useState(10);
  const [retries, setRetries] = useState(0);
  const [labTab, setLabTab] = useState<'logs' | 'curl' | 'theory'>('logs');
  const [showLabCurl, setShowLabCurl] = useState(false);
  const [assertions, setAssertions] = useState<{ id: string, type: string, value: string }[]>([
    { id: '1', type: 'STATUS_CODE', value: '200' }
  ]);
  const [fuzzerChecks, setFuzzerChecks] = useState({ keyDeletions: true, typeMutations: true, bufferOverflow: false });
  const [chaosAmplitude, setChaosAmplitude] = useState(60);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  const activeModule = useMemo(() => {
    return TEST_MODULES.find(m => m.id === selectedModule) || TEST_MODULES[0];
  }, [selectedModule]);

  const totalIterations = iterationsPerUser * concurrency;

  // Generate strategy scripts
  const curlStrategy = useMemo(() => {
    const headersConfig = config.headers || {};
    const headers = Object.entries(headersConfig).map(([k, v]) => `-H "${k}: ${v}"`).join(' ');
    const body = config.body ? `-d '${config.body}'` : '';
    const baseCurl = `curl -X ${config.method} "${config.url || 'http://localhost:3000/api/endpoint'}" ${headers} ${body}`;

    switch (selectedModule) {
      case 'blast':
        return `seq ${totalIterations} | xargs -P ${concurrency} -I {} ${baseCurl}`;
      case 'race':
        return `# Overlapping Collision Script\nfor i in {1..${concurrency}}; do\n  ${baseCurl} &\ndone\nwait`;
      case 'fuzzer':
        return `# Mutation Fuzzer Input Script\nfor i in {1..20}; do\n  # Injected field mutation logic\n  ${baseCurl}\ndone`;
      default:
        return baseCurl;
    }
  }, [selectedModule, config, totalIterations, concurrency]);

  // Compute Latency categories dynamically
  const latencyCategories = useMemo(() => {
    let fast = 0;       // < 150ms
    let acceptable = 0; // 150 - 450ms
    let slow = 0;       // 450 - 1000ms
    let lagging = 0;    // > 1000ms

    results.forEach(r => {
      if (r.responseTime < 150) fast++;
      else if (r.responseTime < 450) acceptable++;
      else if (r.responseTime < 1000) slow++;
      else lagging++;
    });

    const total = results.length || 1;
    return {
      fast: { count: fast, pct: Math.round((fast / total) * 100) },
      acceptable: { count: acceptable, pct: Math.round((acceptable / total) * 100) },
      slow: { count: slow, pct: Math.round((slow / total) * 100) },
      lagging: { count: lagging, pct: Math.round((lagging / total) * 100) },
    };
  }, [results]);

  // Calculate precise percentiles
  const percentiles = useMemo(() => {
    if (results.length === 0) return { p50: 0, p90: 0, p95: 0, p99: 0 };
    const sorted = [...results].map(r => r.responseTime).sort((a, b) => a - b);
    const getP = (p: number) => {
      const idx = Math.floor(sorted.length * p);
      return sorted[Math.min(idx, sorted.length - 1)] || 0;
    };
    return {
      p50: getP(0.50),
      p90: getP(0.90),
      p95: getP(0.95),
      p99: getP(0.99)
    };
  }, [results]);

  // Assertion evaluator
  const checkAssertion = (res: CurlResult, assertion: { type: string, value: string }) => {
    if (assertion.type === 'STATUS_CODE') {
      return res.status.toString() === assertion.value;
    }
    if (assertion.type === 'LATENCY_LESS_THAN') {
      const limit = parseInt(assertion.value) || 1000;
      return res.responseTime < limit;
    }
    if (assertion.type === 'CONTAINS_TEXT') {
      return !!(res.body && res.body.toLowerCase().includes(assertion.value.toLowerCase()));
    }
    return true;
  };

  const getFailedAssertionsCount = (res: CurlResult) => {
    let failCount = 0;
    assertions.forEach(a => {
      if (!checkAssertion(res, a)) failCount++;
    });
    return failCount;
  };

  const startTest = () => {
    onStart(selectedModule, {
      iterations: totalIterations,
      concurrency,
      retries,
      assertions: assertions.map(a => ({ type: a.type, value: a.value }))
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const addAssertion = () => {
    setAssertions([...assertions, { id: Date.now().toString(), type: 'STATUS_CODE', value: '200' }]);
  };

  const removeAssertion = (id: string) => {
    if (assertions.length > 1) {
      setAssertions(assertions.filter(a => a.id !== id));
    }
  };

  const updateAssertion = (id: string, updates: Partial<{ type: string, value: string }>) => {
    setAssertions(assertions.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0D11] overflow-hidden text-slate-200">
      {/* HUD Header */}
      <div className="p-4 border-b border-[#1E293B] bg-[#0F1115] shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-lg border border-emerald-500/45 shrink-0 flex items-center justify-center">
            <Beaker size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xs font-black tracking-widest text-white uppercase leading-none font-sans">TEST LAB WORKSPACE</h2>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold font-mono">Performance Orchestration & Attack Simulator</p>
          </div>
        </div>

        {/* Dynamic Interactive Endpoint Changer - Direct Access */}
        <div className="flex-1 max-w-2xl bg-black/50 border border-slate-800 rounded-xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-755 rounded-lg px-2.5 shrink-0 h-10">
            <span className="text-xs font-mono text-slate-400 uppercase font-black tracking-wider select-none whitespace-nowrap">METHOD:</span>
            <select
              value={config.method || 'GET'}
              onChange={(e) => onChangeConfig?.({ method: e.target.value as any })}
              className={cn(
                "bg-transparent text-sm font-black font-mono cursor-pointer outline-none border-none py-1 focus:ring-0",
                config.method === 'GET' ? "text-emerald-400" :
                config.method === 'POST' ? "text-blue-400" :
                config.method === 'DELETE' ? "text-rose-400" : "text-amber-400"
              )}
            >
              {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'GRAPHQL'].map(m => (
                <option key={m} value={m} className="bg-[#0B0D11] text-white font-mono font-bold text-xs">{m}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex items-center gap-2.5 bg-slate-900 border border-slate-755 rounded-lg px-3.5 h-10">
            <span className="text-xs font-mono text-slate-400 uppercase font-black tracking-wider select-none">URL:</span>
            <input
              type="text"
              value={config.url || ''}
              onChange={(e) => onChangeConfig?.({ url: e.target.value })}
              placeholder="Enter endpoint target URL..."
              className="flex-grow bg-transparent text-xs sm:text-sm font-mono text-emerald-400 outline-none placeholder-slate-500 min-w-0"
            />
          </div>
        </div>
      </div>

      {/* Main Multi-Pane Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANEL 1: Left Roster Navigation */}
        <div className="w-[300px] bg-[#0A0C10] border-r border-slate-800 flex flex-col overflow-y-auto no-scrollbar shrink-0">
          <div className="p-4 bg-black/50 border-b border-slate-800">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Select attack profile</span>
          </div>
          <div className="p-3 space-y-2">
            {TEST_MODULES.map((module) => {
              const isActive = selectedModule === module.id;
              return (
                <button
                  key={module.id}
                  onClick={() => {
                    setSelectedModule(module.id);
                    setSelectedResult(null); 
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border transition-all flex items-start gap-3.5 group relative overflow-hidden select-none cursor-pointer",
                    isActive 
                      ? "bg-emerald-500/10 border-emerald-500/40 text-white shadow-md shadow-emerald-950/15" 
                      : "bg-transparent border-transparent text-slate-300 hover:bg-slate-900/60 hover:text-white"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded border shrink-0 transition-all",
                    isActive 
                      ? "bg-emerald-500/20 border-emerald-500/50 " + module.color
                      : "bg-black/50 border-slate-850 " + module.color
                  )}>
                    {module.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono tracking-wide truncate">{module.name}</span>
                      {isActive && <div className="w-2 h-4 bg-emerald-500 rounded-sm"></div>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
                      {module.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PANEL 2: Middle Config & Execution Controls */}
        <div className="w-[380px] bg-[#0F1115] border-r border-slate-800 flex flex-col overflow-y-auto custom-scrollbar shrink-0">
          <div className="p-4 bg-black/50 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Properties & Controls</span>
            <span className={cn("text-[9px] font-mono font-extrabold px-2 py-0.5 rounded border uppercase flex items-center gap-1", activeModule.bgColor, activeModule.color, activeModule.borderColor)}>
              {activeModule.strategy}
            </span>
          </div>

          <div className="p-5 space-y-6 flex-grow">
            
            {/* Simulation presets removed */}

            {/* Thread controls */}
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
                    className="w-full bg-black border border-slate-705 hover:border-slate-500 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 font-bold outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-300 uppercase font-extrabold flex items-center gap-1.5">
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
                    className="w-full bg-black border border-slate-705 hover:border-slate-500 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 font-bold outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between bg-black/40 p-3 border border-slate-800 rounded-lg text-xs font-mono">
                <span className="text-slate-350 font-bold">Cumulative Load:</span>
                <span className="text-emerald-400 font-black text-sm">{totalIterations} requests total</span>
              </div>
            </div>

            {/* Error Mitigation */}
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
                className="w-full bg-black border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 outline-none cursor-pointer appearance-none hover:border-slate-700"
              >
                <option value={0} className="bg-slate-900 text-white">NO RETRY (FAIL_FAST)</option>
                <option value={1} className="bg-slate-900 text-white">1X RETRY (RAPID_REATTEMPT)</option>
                <option value={2} className="bg-slate-900 text-white">2X RETRY (LINEAR_BACKOFF)</option>
              </select>
            </div>

            {/* Custom inputs based on module */}
            {selectedModule === 'fuzzer' && (
              <div className="p-4 bg-cyan-950/30 rounded-lg border border-cyan-500/30 space-y-3">
                <div className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  <Cpu size={14} /> Mutation engine parameters
                </div>
                <div className="space-y-2">
                  {[
                    { key: 'keyDeletions', label: 'STRIP JSON PAIRS' },
                    { key: 'typeMutations', label: 'TYPE MUTATION PROBE' },
                    { key: 'bufferOverflow', label: 'INJECT STR BUFFER EXPAND' }
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-3.5 text-xs font-mono text-slate-300 hover:text-white cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={(fuzzerChecks as any)[item.key]} 
                        onChange={(e) => setFuzzerChecks({ ...fuzzerChecks, [item.key]: e.target.checked })}
                        className="w-4 h-4 accent-cyan-500 bg-black border-slate-700 rounded transition-all" 
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {selectedModule === 'chaos' && (
              <div className="p-4 bg-rose-950/30 rounded-lg border border-rose-500/30 space-y-4">
                <div className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                  <Flame size={14} /> Chaos engine entropy amplitude
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-slate-300">
                    <span>CONNECTION LOSS JITTER</span>
                    <span className="text-rose-400 font-extrabold">{chaosAmplitude}ms</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="1500" 
                    value={chaosAmplitude}
                    onChange={(e) => setChaosAmplitude(parseInt(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer bg-black rounded-lg h-1.5"
                  />
                </div>
              </div>
            )}

            {/* Assertions Roster */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Verification Criteria</span>
                <button
                  type="button"
                  onClick={addAssertion}
                  disabled={loading}
                  className="px-2.5 py-1 text-xs font-mono text-emerald-450 hover:text-white flex items-center gap-1.5 border border-slate-700 bg-black hover:border-emerald-500 transition-all rounded-lg font-bold"
                >
                  <Plus size={12} /> ADD_RULE
                </button>
              </div>
              <div className="space-y-2">
                {assertions.map(item => (
                  <div key={item.id} className="flex gap-2 items-center">
                    <select
                      value={item.type}
                      onChange={(e) => {
                        updateAssertion(item.id, { type: e.target.value });
                        setSelectedPresetId('');
                      }}
                      disabled={loading}
                      className="bg-black border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300"
                    >
                      <option value="STATUS_CODE" className="text-white bg-slate-900">STATUS ===</option>
                      <option value="LATENCY_LESS_THAN" className="text-white bg-slate-900">LATENCY &lt;</option>
                      <option value="CONTAINS_TEXT" className="text-white bg-slate-900">CONTAINS</option>
                    </select>
                    <input
                      value={item.value}
                      onChange={(e) => {
                        updateAssertion(item.id, { value: e.target.value });
                        setSelectedPresetId('');
                      }}
                      type="text"
                      disabled={loading}
                      placeholder="e.g. 200"
                      className="flex-1 min-w-0 bg-black border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-450 font-black focus:border-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        removeAssertion(item.id);
                        setSelectedPresetId('');
                      }}
                      disabled={loading || assertions.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-450 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Transmission previews */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Target curl strategy</span>
                <button 
                  onClick={() => setShowLabCurl(!showLabCurl)}
                  className={cn(
                    "text-xs font-mono flex items-center gap-1.5 uppercase transition-all px-2.5 py-1 rounded-lg border",
                    showLabCurl ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200"
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

          <div className="p-4 bg-black/55 border-t border-slate-800 space-y-3 shrink-0">
            <button
              onClick={loading ? onAbort : startTest}
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

        {/* PANEL 3: Right Live Telemetry Screen */}
        <div className="flex-1 bg-[#07080A] flex flex-col overflow-hidden">
          {/* Telemetry values with clean typography and robust accessibility sizing */}
          <div className="p-5 border-b border-slate-800 bg-black/60 grid grid-cols-2 md:grid-cols-4 gap-6 select-none shadow-[inset_0_-2px_10px_rgba(0,0,0,0.5)] shrink-0">
             <div className="space-y-1.5 border-r border-slate-900 pr-4">
                <div className="text-[10px] font-black text-slate-405 uppercase tracking-wider flex items-center gap-1.5">
                   <Activity size={12} className="text-emerald-400" /> Current RPS
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
                   {progress ? ((progress.completed / ((Date.now() - (progress as any).startTime || 1) / 1000)).toFixed(1)) : '0.0'}
                   <span className="text-xs text-slate-500 ml-1">/sec</span>
                </div>
             </div>
             <div className="space-y-1.5 border-r border-slate-900 pr-4">
                <div className="text-[10px] font-black text-slate-405 uppercase tracking-wider flex items-center gap-1.5">
                   <Clock size={12} className="text-blue-400" /> P95 Latency
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
                   {results.length > 0 ? results[Math.floor(results.length * 0.95)]?.responseTime || '0' : '0'}
                   <span className="text-xs text-slate-500 ml-1">ms</span>
                </div>
             </div>
             <div className="space-y-1.5 border-r border-slate-900 pr-4">
                <div className="text-[10px] font-black text-slate-405 uppercase tracking-wider flex items-center gap-1.5">
                   <Server size={12} className="text-amber-400" /> Success Rate
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
                   {results.length > 0 ? Math.round((results.filter(r => r.status < 400).length / results.length) * 100) : '0'}
                   <span className="text-xs text-slate-500 ml-1">%</span>
                </div>
             </div>
             <div className="space-y-1.5">
                <div className="text-[10px] font-black text-rose-450 uppercase tracking-wider flex items-center gap-1.5">
                   <ShieldAlert size={12} className="text-rose-455" /> Errors
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-455 font-mono leading-none">
                   {results.filter(r => r.status >= 400).length}
                </div>
             </div>
          </div>

          {/* Navigation headers */}
          <div className="flex border-b border-slate-800 bg-[#0B0D11]/95 px-4 shrink-0 shadow">
             {[
               { id: 'logs', label: 'TELEMETRY LIVE LOGS' },
               { id: 'curl', label: 'CURL ORCHESTRATION' },
               { id: 'theory', label: 'THEORETICAL FRAMEWORK' }
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => {
                   setLabTab(tab.id as any);
                 }}
                 className={cn(
                   "px-4.5 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 font-mono outline-none focus:ring-0 select-none cursor-pointer",
                   labTab === tab.id ? "border-emerald-500 text-white font-black" : "border-transparent text-slate-400 hover:text-slate-200"
                 )}
               >
                 {tab.label}
               </button>
             ))}
          </div>

          {/* Active Tab Screen Area */}
          <div className="flex-1 overflow-hidden relative flex">
             <AnimatePresence mode="wait">
                {labTab === 'logs' && (
                  <div className="flex-1 flex overflow-hidden relative">
                    {/* Log list with proper text sizes for great legibility */}
                    <div className={cn("flex-grow overflow-y-auto p-5 custom-scrollbar space-y-2 bg-[#050608]/50", selectedResult ? "hidden xl:block" : "block")}>
                       
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
                                 <p className="text-[10px] text-slate-450 mt-1 uppercase font-mono font-bold">Analysis Profile for real life verification</p>
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
                                 gradeColor = "text-rose-450 border-rose-500/30 bg-rose-500/10 h shadow-rose-500/5";
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

                       {/* Latency Distribution Graph always available above logs */}
                       {false && results.length > 0 && (
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

                       {results.length === 0 && !loading && (
                         <div className="h-full flex flex-col items-center justify-center p-20 opacity-40 text-center space-y-4">
                           <div className="w-16 h-16 border border-slate-700 border-dashed rounded-full flex items-center justify-center animate-spin-slow">
                              <Activity size={24} className="text-emerald-400" />
                           </div>
                           <div className="uppercase tracking-widest font-mono text-xs text-white font-black">Standby Stream Init</div>
                           <p className="text-xs text-slate-350 max-w-sm leading-relaxed font-sans">
                             Press <span className="font-bold text-emerald-400">"INITIATE STRESS SEQUENCE"</span> or click on a Preset to dispatch mock concurrent workflows and verify endpoints.
                           </p>
                         </div>
                       )}

                       {[...results].reverse().map((res, i) => {
                         const currentIdx = (progress?.completed ?? results.length) - i;
                         const isSelected = selectedResult?.id === res.id;
                         const fails = getFailedAssertionsCount(res);
                         const passedAll = fails === 0;
                         return (
                           <div 
                             key={res.id} 
                             onClick={() => setSelectedResult(res)}
                             className={cn(
                               "group flex border-l-4 py-3 pl-4 pr-3.5 rounded-lg transition-all cursor-pointer items-center min-h-[44px] select-none text-xs font-mono mb-1.5",
                               isSelected 
                                 ? "bg-slate-800 text-white border-emerald-500 shadow-md" 
                                 : passedAll 
                                   ? "border-slate-850 hover:border-emerald-500/70 hover:bg-[#10b981]/10 bg-black/20"
                                   : "border-rose-950 hover:border-rose-500/70 hover:bg-rose-500/5 bg-rose-950/10"
                             )}
                           >
                             <span className="text-slate-400 w-20 shrink-0 font-bold group-hover:text-amber-400 transition-colors">➔ {res.responseTime}ms</span>
                             <span className={cn("w-14 font-black", res.status < 300 ? "text-emerald-400" : "text-rose-400")}>
                               [{res.status}]
                             </span>
                             <span className="text-slate-200 flex-1 truncate uppercase tracking-tight group-hover:text-white transition-colors">
                               <span className="text-slate-500 opacity-90 mr-2 font-bold">#{currentIdx}</span>
                               {selectedModule === 'fuzzer' && <span className="text-cyan-400 font-extrabold mr-1.5">[MUTATED]</span>}
                               {selectedModule === 'replay' && <span className="text-blue-400 font-extrabold mr-1.5">[CLONED]</span>}
                               {selectedModule === 'chaos' && <span className="text-rose-455 font-extrabold mr-1.5">[CORRUPTED]</span>}
                               {activeModule.name}
                             </span>
                             <div className="flex items-center shrink-0 ml-2">
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

                    {/* Side-by-Side inline description details */}
                    {selectedResult && (
                      <div className="w-full xl:w-[420px] border-l border-slate-800 bg-[#0F1115] flex flex-col overflow-hidden shrink-0 shadow-2xl relative z-10 animate-in fade-in slide-in-from-right-5 duration-150">
                        <div className="p-4 bg-black flex items-center justify-between border-b border-slate-800">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-mono font-black px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">LOG DETAIL</span>
                             <span className="text-xs font-mono text-slate-400">#{selectedResult.id.slice(0, 8)}</span>
                          </div>
                          <button 
                            onClick={() => setSelectedResult(null)}
                            className="text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                          >
                            <X size={15} />
                          </button>
                        </div>

                        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 font-mono text-xs text-slate-200 space-y-5">
                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-black/50 p-3 rounded-lg border border-slate-800">
                                <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1 font-bold">Status Code</div>
                                <div className={cn("text-lg font-black", selectedResult.status < 300 ? "text-emerald-400" : "text-rose-400")}>
                                  {selectedResult.status}
                                </div>
                             </div>
                             <div className="bg-black/50 p-3 rounded-lg border border-slate-800">
                                <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1 font-bold">Latency</div>
                                <div className="text-lg font-black text-blue-400">{selectedResult.responseTime}ms</div>
                             </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-slate-350 text-xs uppercase tracking-wider font-extrabold block border-b border-slate-800 pb-1.5">Verification Asserts</span>
                            <div className="bg-black/45 p-3 rounded-lg border border-slate-800 space-y-2">
                              {assertions.map(a => {
                                const ok = checkAssertion(selectedResult, a);
                                return (
                                  <div key={a.id} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-bold">{a.type} ({a.value})</span>
                                    {ok ? (
                                      <span className="text-emerald-400 font-black flex items-center gap-1">✓ PASSED</span>
                                    ) : (
                                      <span className="text-rose-450 font-black flex items-center gap-1">✗ FAILED</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-slate-350 text-xs uppercase tracking-wider font-extrabold block border-b border-slate-800 pb-1.5">Response Headers</span>
                            <div className="bg-black p-3.5 rounded-lg border border-slate-800 space-y-2 h-40 overflow-y-auto text-xs text-slate-300 custom-scrollbar select-text">
                              {Object.entries(selectedResult.headers).map(([k, v]) => (
                                <div key={k} className="flex flex-col gap-0.5 border-b border-slate-900 pb-1.5">
                                  <span className="text-blue-400 font-extrabold uppercase text-[10px]">{k}:</span>
                                  <span className="text-slate-200 break-all pl-1 select-all">{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2 flex-grow">
                            <span className="text-slate-350 text-xs uppercase tracking-wider font-extrabold block border-b border-slate-800 pb-1.5">Response Payload</span>
                            <pre className="bg-black p-3.5 rounded-lg border border-slate-800 text-xs text-emerald-450/90 whitespace-pre-wrap overflow-x-hidden min-h-[140px] max-h-72 overflow-y-auto custom-scrollbar select-all">
                              {selectedResult.body || 'Empty Payload.'}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {labTab === 'curl' && (
                  <motion.div 
                    key="curlTab"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar bg-black"
                  >
                     <div className="max-w-2xl space-y-6">
                        <div className="space-y-2 select-text">
                           <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <Globe size={15} className="text-blue-400" /> Endpoint HTTP curl snippet
                              </span>
                              <button 
                                onClick={() => copyToClipboard(`curl -X ${config.method} "${config.url || 'http://localhost:3000/api'}"`)}
                                className="text-slate-400 hover:text-white transition-colors p-1"
                              >
                                <Copy size={15} />
                              </button>
                           </div>
                           <pre className="bg-[#0F1115] p-3.5 rounded-lg border border-slate-800 text-xs font-mono text-blue-350 break-all whitespace-pre-wrap leading-relaxed select-all">
                              {`curl -X ${config.method} "${config.url || 'http://localhost:3000/api'}" \\\n  ${Object.entries(config.headers || {}).map(([k, v]) => `-H "${k}: ${v}"`).join(' \\\n  ')}${config.body ? ` \\\n  -d '${config.body}'` : ''}`}
                           </pre>
                        </div>

                        <div className="space-y-2 select-text">
                           <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <Code2 size={15} className="text-emerald-400" /> Orchestrated bash script template
                              </span>
                              <button 
                                onClick={() => copyToClipboard(curlStrategy)}
                                className="text-slate-400 hover:text-white transition-colors p-1"
                              >
                                <Copy size={15} />
                              </button>
                           </div>
                           <pre className="bg-[#0F1115] p-4 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto custom-scrollbar leading-relaxed">
                              {curlStrategy}
                           </pre>
                           <p className="text-xs text-slate-400 font-mono uppercase italic leading-normal">
                              Note: This script initializes concurrent worker nodes to match the backend runner sequence.
                           </p>
                        </div>
                     </div>
                  </motion.div>
                )}

                {labTab === 'theory' && (
                  <motion.div 
                    key="theoryTab"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute inset-0 p-8 overflow-y-auto custom-scrollbar bg-black"
                  >
                     <div className="max-w-xl space-y-8 select-text">
                        <section className="space-y-3">
                           <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
                              <Info size={18} className="text-emerald-400 animate-pulse" /> Scientific attack framework theory
                           </h2>
                           <p className="text-slate-300 font-serif italic text-base leading-relaxed border-l-4 border-[#10b981]/50 pl-4 py-2 bg-slate-950/20 rounded-r">
                              "{activeModule.theory}"
                           </p>
                        </section>

                        <section className="space-y-4">
                           <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest block">Recommended Application & Audit Scenarios</h3>
                           <div className="grid grid-cols-1 gap-4">
                              {[
                                { t: 'Performance & Scalability mapping', d: 'Identify exactly when container CPU allocations scale, and check request starvation thresholds.' },
                                { t: 'Transactional integrity testing', d: 'Isolate database deadlock states and trace write locks across concurrent tables.' },
                                { t: 'Cache consistent queries validation', d: 'Verify if overlapping cache writes successfully invalidate redundant memory states.' }
                              ].map(use => (
                                <div key={use.t} className="p-4 border border-slate-800 bg-[#0F1115] hover:bg-slate-900/40 rounded-lg transition-all select-none">
                                   <div className="text-white font-bold text-xs sm:text-sm mb-1">{use.t}</div>
                                   <div className="text-slate-450 text-xs font-mono uppercase leading-normal">{use.d}</div>
                                </div>
                              ))}
                           </div>
                        </section>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          {/* Progress gauge area */}
          {progress && (
            <div className="bg-[#0F1115] border-t border-slate-800 p-5 space-y-3 shrink-0 select-none">
               <div className="flex justify-between text-xs font-black uppercase font-mono tracking-wider relative">
                  <span className="text-emerald-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    STRESS RUNNING ACTIVE_PROBE
                  </span>
                  <span className="text-white">
                     {progress.completed} <span className="text-slate-500">/</span> {progress.total} Completed
                  </span>
               </div>
               <div className="h-2 bg-slate-950 rounded-full overflow-hidden p-[1px] border border-slate-800">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress.completed / progress.total) * 100}%` }}
                    transition={{ type: 'spring', damping: 25, stiffness: 45 }}
                  />
               </div>
               <div className="flex gap-4 text-xs font-mono font-bold">
                 <div className="flex-1 bg-black/50 rounded-lg p-2.5 border border-slate-800 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-450 uppercase tracking-wider mb-1 font-bold">RPS RATE</span>
                    <span className="text-emerald-400 text-sm font-black">{((progress.completed / ((Date.now() - (progress as any).startTime || 1) / 1000)).toFixed(1))}</span>
                 </div>
                 <div className="flex-1 bg-black/50 rounded-lg p-2.5 border border-slate-800 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-450 uppercase tracking-wider mb-1 font-bold">EST TIME DUE</span>
                    <span className="text-blue-400 text-sm font-black">~{Math.max(0, Math.round((progress.total - progress.completed) / ( (progress.completed || 1) / ((Date.now() - (progress as any).startTime || 1) / 1000) )))}s</span>
                 </div>
                 <div className="flex-1 bg-black/50 rounded-lg p-2.5 border border-slate-800 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-450 uppercase tracking-wider mb-1 font-bold">P95 LATENCY</span>
                    <span className="text-amber-400 text-sm font-black">{results.length > 0 ? results[Math.floor(results.length * 0.95)]?.responseTime || '0' : '0'}ms</span>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
