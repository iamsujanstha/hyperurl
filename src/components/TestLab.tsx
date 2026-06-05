import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Clock, Server, ShieldAlert, ChevronDown, Repeat, Trash2, Globe, Terminal, Code2, Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequestConfig, CurlResult } from '@/server/modules/curl-engine';
import { ProgressUpdate } from '@/server/modules/runner';
import { Telemetry } from '@/features/api-tester/types';

import { 
  TEST_MODULES as STATIC_TEST_MODULES, 
  THEORETICAL_FRAMEWORKS, 
  TestModuleId, 
  TestModule as StaticTestModule 
} from './TestLabData';

import { TestLabSidebar } from './testlab/TestLabSidebar';
import { TestLabResults } from './testlab/TestLabResults';
import { TestLabResultDetail } from './testlab/TestLabResultDetail';
import { TestLabTheory } from './testlab/TestLabTheory';

export type { TestModuleId };

export interface TestModule extends Omit<StaticTestModule, 'category'> {
  icon: React.ReactNode;
  category: 'perf' | 'resilience' | 'security';
}

const getModuleIcon = (id: TestModuleId) => {
  switch (id) {
    case 'basic_query': return <span className="font-sans font-bold">Q</span>;
    case 'blast': return <span className="font-sans font-bold">B</span>;
    case 'race': return <span className="font-sans font-bold">R</span>;
    case 'replay': return <span className="font-sans font-bold">P</span>;
    case 'load': return <span className="font-sans font-bold">L</span>;
    case 'chaos': return <span className="font-sans font-bold">C</span>;
    case 'fuzzer': return <span className="font-sans font-bold">F</span>;
    case 'security_audit': return <span className="font-sans font-bold">S</span>;
    case 'distributed': return <span className="font-sans font-bold">D</span>;
  }
};

const TEST_MODULES: TestModule[] = STATIC_TEST_MODULES.map(mod => ({
  ...mod,
  icon: getModuleIcon(mod.id),
  category: mod.category as 'perf' | 'resilience' | 'security'
}));

interface TestLabProps {
  config: RequestConfig;
  headersList: { id: string, key: string, value: string }[];
  ws: WebSocket | null;
  activeTabId: string;
  loading: boolean;
  progress: ProgressUpdate | null;
  results: CurlResult[];
  onStart: (moduleId: string, settings: any) => void;
  onAbort: () => void;
  onChangeConfig?: (updates: Partial<RequestConfig>) => void;
  onClearLogs?: () => void;
  telemetry: Telemetry;
}

export function TestLab({ config, headersList, ws, activeTabId, loading, progress, results, onStart, onAbort, onChangeConfig, onClearLogs, telemetry }: TestLabProps) {
  const [selectedModule, setSelectedModule] = useState<TestModuleId>('basic_query');
  const [selectedResult, setSelectedResult] = useState<CurlResult | null>(null);
  const [payloadTab, setPayloadTab] = useState<'pretty' | 'raw'>('pretty');
  const [iterationsPerUser, setIterationsPerUser] = useState(5);
  const [concurrency, setConcurrency] = useState(5);
  const [retries, setRetries] = useState(0);
  const [labTab, setLabTab] = useState<'logs' | 'curl' | 'theory'>('logs');

  const [fuzzerChecks, setFuzzerChecks] = useState({ keyDeletions: true, typeMutations: true, bufferOverflow: false });
  const [securityChecks, setSecurityChecks] = useState({ sqli: true, xss: true, pathTraversal: true, headersAuditor: true });
  const [chaosAmplitude, setChaosAmplitude] = useState(60);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['us', 'eu', 'apac', 'latam']);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'perf' | 'resilience' | 'security'>('all');
  const [logDetailWidth, setLogDetailWidth] = useState(560);
  const [isDraggingLogDetail, setIsDraggingLogDetail] = useState(false);

  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [activeMobileTab, setActiveMobileTab] = useState<'config' | 'results'>('config');

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (loading) {
      setActiveMobileTab('results');
    }
  }, [loading]);

  useEffect(() => {
    if (!isDraggingLogDetail) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 380 && newWidth <= 850) {
        setLogDetailWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsDraggingLogDetail(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLogDetail]);

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
      case 'basic_query':
        return baseCurl;
      case 'blast':
      case 'load':
        return `seq ${totalIterations} | xargs -P ${concurrency} -I {} ${baseCurl}`;
      case 'race':
        return `# Race Condition Collision Test\n# Launches sub-millisecond thread waves\nseq ${totalIterations} | xargs -P ${concurrency} -I {} ${baseCurl}`;
      case 'replay':
        return `# Replay Guard & Idempotency Audit\n# Submits duplicate transaction parameters sequentially\n${baseCurl}`;
      case 'chaos':
        return `# Chaos Entropy Injection\n# Randomly mutates HTTP streams & corrupts headers\n${baseCurl}`;
      case 'fuzzer':
        return `# Payload Mutation Schema Fuzzer\n# Dynamic type mutator and buffer limits checks\n${baseCurl}`;
      case 'security_audit':
        return `# Security Auditor Vulnerability Prober\n# Scans parameters for SQL Injection & Cross-Site Scripting\n${baseCurl}`;
      case 'distributed':
        return `# Geographically Distributed Global CDN Simulation\n# Spoofs geo-located IP headers & tests global CDN routing rules\n${baseCurl}`;
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

  // Geographical distributed metrics breakdown
  const regionalBreakdown = useMemo(() => {
    if (selectedModule !== 'distributed' || results.length === 0) return null;
    const regions: Record<string, { count: number; ok: number; sumTime: number; flag: string; label: string }> = {
      'us': { count: 0, ok: 0, sumTime: 0, flag: '🇺🇸', label: 'North America (US)' },
      'eu': { count: 0, ok: 0, sumTime: 0, flag: '🇩🇪', label: 'Europe (EU)' },
      'apac': { count: 0, ok: 0, sumTime: 0, flag: '🇯🇵', label: 'Asia-Pacific (APAC)' },
      'latam': { count: 0, ok: 0, sumTime: 0, flag: '🇧🇷', label: 'Latin America (LATAM)' }
    };

    results.forEach(r => {
      let key = 'us';
      const c = r.simulatedCountry?.toLowerCase() || '';
      const regName = r.simulatedRegion?.toLowerCase() || '';
      if (regName.includes('frankfurt') || regName.includes('london') || regName.includes('france') || regName.includes('belgium') || regName.includes('italy') || c === 'germany' || c.includes('united kingdom') || c === 'france' || c === 'italy' || c === 'belgium') {
        key = 'eu';
      } else if (regName.includes('tokyo') || regName.includes('singapore') || regName.includes('india') || regName.includes('australia') || c === 'japan' || c === 'singapore' || c === 'india' || c === 'australia') {
        key = 'apac';
      } else if (regName.includes('são paulo') || regName.includes('brazil') || regName.includes('argentina') || regName.includes('mexico') || regName.includes('colombia') || c === 'brazil' || c === 'argentina' || c === 'mexico' || c === 'colombia') {
        key = 'latam';
      }

      const reg = regions[key];
      if (reg) {
        reg.count++;
        if (r.status < 400) reg.ok++;
        reg.sumTime += r.responseTime;
      }
    });

    return Object.entries(regions).map(([id, val]) => ({
      id,
      ...val,
      avgTime: val.count > 0 ? Math.round(val.sumTime / val.count) : 0,
      successPct: val.count > 0 ? Math.round((val.ok / val.count) * 100) : 0
    }));
  }, [results, selectedModule]);

  const startTest = () => {
    let backendModuleId: string = selectedModule;
    let finalIterations = totalIterations;
    let finalConcurrency = concurrency;

    if (selectedModule === 'basic_query') {
      backendModuleId = 'blast';
      finalIterations = 1;
      finalConcurrency = 1;
    } else if (selectedModule === 'load') {
      backendModuleId = 'blast';
    }

    onStart(backendModuleId, {
      iterations: finalIterations,
      concurrency: finalConcurrency,
      retries,
      assertions: [],
      fuzzerChecks,
      securityChecks,
      regions: selectedRegions,
      rotateIps: selectedModule === 'distributed'
    });
  };

  const handleClearLogs = () => {
    setSelectedResult(null);
    if (onClearLogs) {
      onClearLogs();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const securityAudit = useMemo(() => {
    if (selectedModule !== 'security_audit' || results.length === 0) return null;

    let totalAlerts = 0;
    const items: { name: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'PASS'; status: string; detail: string; recommendation: string }[] = [];

    let sqliVulnerable = false;
    let xssVulnerable = false;
    let authBypassed = false;
    let corsInsecure = false;
    let pathTraversalLeak = false;

    results.forEach(r => {
      const curlLower = r.curlCommand.toLowerCase();
      const resBody = r.body || '';
      const resStatus = r.status;
      const resHeaders = r.headers || {};

      if (curlLower.includes('sqli_test') || curlLower.includes("' or '1'='1'")) {
        const hasSqlError = /sql|mysql|sqlite|postgresql|mariadb|syntax error/i.test(resBody);
        const badStatus = resStatus === 500;
        if (hasSqlError || (badStatus && resBody.toLowerCase().includes('database'))) {
          sqliVulnerable = true;
        }
      }

      if (curlLower.includes('qaxss') || curlLower.includes('<script>')) {
        if (resBody.includes('qaxss') && resBody.includes('<script>')) {
          xssVulnerable = true;
        }
      }

      const isNoAuthProbe = curlLower.includes('x-security-test-type: no_auth');
      if (isNoAuthProbe && resStatus < 300) {
        authBypassed = true;
      }

      const lowerResHeaders = Object.keys(resHeaders).reduce((acc, k) => {
        acc[k.toLowerCase()] = String(resHeaders[k]).toLowerCase();
        return acc;
      }, {} as Record<string, string>);

      if (lowerResHeaders['access-control-allow-origin'] === '*' || lowerResHeaders['access-control-allow-origin'] === 'https://evil-attacker.com') {
        if (lowerResHeaders['access-control-allow-credentials'] === 'true') {
          corsInsecure = true;
        }
      }

      if (curlLower.includes('passwd') || curlLower.includes('etc/passwd')) {
        if (/root:x:0/i.test(resBody) || /\[boot loader\]/i.test(resBody)) {
          pathTraversalLeak = true;
        }
      }
    });

    const firstResult = results[0];
    const firstHeaders = firstResult ? Object.keys(firstResult.headers).reduce((acc, k) => {
      acc[k.toLowerCase()] = String(firstResult.headers[k]);
      return acc;
    }, {} as Record<string, string>) : {};

    const missingCsp = !firstHeaders['content-security-policy'];
    const missingXFrame = !firstHeaders['x-frame-options'];
    const missingXContentType = !firstHeaders['x-content-type-options'];

    if (securityChecks.sqli) {
      if (sqliVulnerable) {
        totalAlerts++;
        items.push({
          name: 'SQL Injection Vulnerability',
          severity: 'HIGH',
          status: 'VULNERABLE',
          detail: 'Database engine leaked syntax or internal query logs in raw response stream.',
          recommendation: 'Use parameterized query builders, escape inputs, and disable detailed backend exception displays in production.'
        });
      } else {
        items.push({
          name: 'SQL Injection Shield',
          severity: 'PASS',
          status: 'SECURE',
          detail: 'System handled dynamic escape patterns safely without raw database exception reflections.',
          recommendation: 'Maintain current ORM and input query serialization practices.'
        });
      }
    }

    if (securityChecks.xss) {
      if (xssVulnerable) {
        totalAlerts++;
        items.push({
          name: 'Reflective Cross-Site Scripting (XSS)',
          severity: 'HIGH',
          status: 'VULNERABLE',
          detail: 'Injected HTML elements reflected literally inside reply stream. High execution hijack potential.',
          recommendation: 'Sanitize script tags, use safe text binding helpers, and mandate content validation frameworks.'
        });
      } else {
        items.push({
          name: 'XSS Escape Filtering',
          severity: 'PASS',
          status: 'SECURE',
          detail: 'No unescaped tags or reflective DOM execution patterns were detected.',
          recommendation: 'Continue context-aware HTML entity encoding on user entries.'
        });
      }
    }

    if (securityChecks.pathTraversal) {
      if (pathTraversalLeak) {
        totalAlerts++;
        items.push({
          name: 'Local Directory Path Traversal',
          severity: 'CRITICAL',
          status: 'VULNERABLE',
          detail: 'Privileged file identifiers returned. Confirmed access bypass.',
          recommendation: 'Sanitise file path separators and avoid dynamic filename lookups against system streams.'
        });
      } else {
        items.push({
          name: 'Directory Escaping Protection',
          severity: 'PASS',
          status: 'SECURE',
          detail: 'Path traversals rejected or sanitised. System configurations kept secure.',
          recommendation: 'Keep file assets under bounded static lookup catalogs.'
        });
      }
    }

    if (authBypassed) {
      totalAlerts++;
      items.push({
        name: 'Authentication Bypass Risk',
        severity: 'MEDIUM',
        status: 'WARNING',
        detail: 'Request still resolved successfully after credentials headers were stripped to probe Auth coverage.',
        recommendation: 'Ensure all transactional endpoints require JWT token or active authorization cookies explicitly.'
      });
    }

    if (corsInsecure) {
      totalAlerts++;
      items.push({
        name: 'Insecure CORS Policy',
        severity: 'MEDIUM',
        status: 'VULNERABLE',
        detail: 'Wildcard or dynamic origin reflection detected with credentials allowed. Third-party read execution exploit vector.',
        recommendation: 'Avoid echoing Origin back inside Access-Control-Allow-Origin when Credentials mode is enabled.'
      });
    }

    if (securityChecks.headersAuditor) {
      if (missingCsp || missingXFrame || missingXContentType) {
        const missing: string[] = [];
        if (missingCsp) missing.push('CSP');
        if (missingXFrame) missing.push('X-Frame-Options');
        if (missingXContentType) missing.push('X-Content-Type-Options');
        totalAlerts++;
        items.push({
          name: 'HTTP Security Headers Hygiene',
          severity: 'LOW',
          status: 'WARN',
          detail: `Missing critical security headers: ${missing.join(', ')}. Safe client protection is decreased.`,
          recommendation: 'Configure middleware like helmet.js to inject CSP policies, X-Frame-Options values, and X-Content-Type-Options.'
        });
      } else {
        items.push({
          name: 'HTTP Security Headers Audit',
          severity: 'PASS',
          status: 'SECURE',
          detail: 'All vital sandbox safety headers (CSP, X-Frame, X-Content-Type) were correctly present.',
          recommendation: 'Regularly audit policy scopes to avoid relaxed origins over time.'
        });
      }
    }

    return { totalAlerts, items };
  }, [results, selectedModule, securityChecks]);

  return (
    <div className="flex flex-col h-full bg-[#0B0D11] overflow-hidden text-slate-205">
      {/* HUD Header */}
      <div className="p-4 border-b border-[#1E293B] bg-[#0F1115] shrink-0 flex flex-col md:flex-row md:items-center justify-start gap-4">
        {/* Dynamic Interactive Endpoint Changer - Direct Access */}
        <div className="flex-1 w-full bg-[#0F1115] border border-slate-800 rounded-xl overflow-hidden focus-within:border-emerald-500/50 transition-all flex flex-col sm:flex-row items-stretch sm:items-center">
          <div className="flex items-center gap-2 px-3 border-b sm:border-b-0 sm:border-r border-slate-800 shrink-0 bg-slate-900/30 h-11 select-none">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider select-none whitespace-nowrap">METHOD</span>
            <select
              value={config.method || 'GET'}
              onChange={(e) => onChangeConfig?.({ method: e.target.value as any })}
              className={cn(
                "bg-transparent text-xs font-bold font-mono cursor-pointer outline-none border-none py-1 focus:ring-0 appearance-none pr-1 text-center min-w-[70px]",
                config.method === 'GET' ? "text-emerald-400" :
                config.method === 'POST' ? "text-blue-500" :
                config.method === 'DELETE' ? "text-rose-500" : "text-amber-500"
              )}
            >
              {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'GRAPHQL'].map(m => (
                <option key={m} value={m} className="bg-[#0B0D11] text-white font-mono font-bold text-xs">{m}</option>
              ))}
            </select>
            <ChevronDown size={11} className="text-slate-500 -ml-1.5 pointer-events-none" />
          </div>

          <div className="flex-grow flex items-center gap-2 px-4 h-11">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider select-none shrink-0">URL</span>
            <input
              type="text"
              value={config.url || ''}
              onChange={(e) => onChangeConfig?.({ url: e.target.value })}
              placeholder="Enter endpoint target URL..."
              className="flex-grow bg-transparent text-xs sm:text-sm font-mono text-emerald-400 outline-none placeholder-slate-600 min-w-0 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Mobile view sub-segmented control tabs (Config vs Results) */}
      <div className="lg:hidden flex bg-[#0E121A] border-b border-slate-850 p-1.5 shrink-0 h-11 items-center gap-1.5 select-none w-full">
        <button
          onClick={() => setActiveMobileTab('config')}
          className={cn(
            "flex-1 py-1.5 px-3 rounded text-[11px] font-mono font-black uppercase transition-all tracking-wider text-center cursor-pointer",
            activeMobileTab === 'config'
              ? "bg-[#1E293B] text-emerald-400 border border-emerald-500/25 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          )}
          type="button"
        >
          TEST CONFIG
        </button>
        <button
          onClick={() => setActiveMobileTab('results')}
          className={cn(
            "flex-1 py-1.5 px-3 rounded text-[11px] font-mono font-black uppercase transition-all tracking-wider text-center cursor-pointer relative",
            activeMobileTab === 'results'
              ? "bg-[#1E293B] text-emerald-400 border border-emerald-500/25 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          )}
          type="button"
        >
          LIVE FEED
          {loading && (
            <span className="absolute right-3.5 top-2.5 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* Main Multi-Pane Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PANEL 2: Left Sidebar Config & Controls */}
        <motion.div 
          initial={false}
          animate={windowWidth >= 1024 ? { x: 0, opacity: 1, pointerEvents: "auto" as const } : { 
            x: activeMobileTab === 'config' ? 0 : '-100%',
            opacity: activeMobileTab === 'config' ? 1 : 0,
            pointerEvents: activeMobileTab === 'config' ? "auto" as const : "none" as const
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className={cn(
            "bg-[#0F1115] transition-shadow duration-200",
            windowWidth >= 1024 
              ? "w-[420px] shrink-0 border-r border-[#1E293B] h-full overflow-hidden" 
              : "absolute inset-0 w-full h-full overflow-hidden z-20 shadow-2xl"
          )}
        >
          <TestLabSidebar 
            config={config}
            loading={loading}
            selectedModule={selectedModule}
            setSelectedModule={setSelectedModule}
            setSelectedResult={setSelectedResult}
            concurrency={concurrency}
            setConcurrency={setConcurrency}
            iterationsPerUser={iterationsPerUser}
            setIterationsPerUser={setIterationsPerUser}
            retries={retries}
            setRetries={setRetries}
            securityChecks={securityChecks}
            setSecurityChecks={setSecurityChecks}
            fuzzerChecks={fuzzerChecks}
            setFuzzerChecks={setFuzzerChecks}
            chaosAmplitude={chaosAmplitude}
            setChaosAmplitude={setChaosAmplitude}
            selectedRegions={selectedRegions}
            setSelectedRegions={setSelectedRegions}
            selectedPresetId={selectedPresetId}
            setSelectedPresetId={setSelectedPresetId}
            curlStrategy={curlStrategy}
            onStartTest={startTest}
            onAbort={onAbort}
            onChangeConfig={onChangeConfig}
            telemetry={telemetry}
          />
        </motion.div>

        {/* PANEL 3: Right Live Telemetry Screen */}
        <motion.div 
          initial={false}
          animate={windowWidth >= 1024 ? { x: 0, opacity: 1, pointerEvents: "auto" as const } : { 
            x: activeMobileTab === 'results' ? 0 : '100%',
            opacity: activeMobileTab === 'results' ? 1 : 0,
            pointerEvents: activeMobileTab === 'results' ? "auto" as const : "none" as const
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className={cn(
            "bg-[#07080A] flex flex-col overflow-hidden",
            windowWidth >= 1024 
              ? "flex-1 h-full" 
              : "absolute inset-0 w-full h-full z-10"
          )}
        >
          {/* Telemetry values with clean typography */}
          <div className="p-5 border-b border-slate-800 bg-black/60 grid grid-cols-2 md:grid-cols-4 gap-6 select-none shadow-[inset_0_-2px_10px_rgba(0,0,0,0.5)] shrink-0">
             <div className="space-y-1.5 border-r border-slate-900 pr-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
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
                   <ShieldAlert size={12} className="text-rose-400" /> Errors
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono leading-none">
                   {results.filter(r => r.status >= 400).length}
                </div>
             </div>
          </div>

          {/* Navigation headers */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#0B0D11]/95 px-4 shrink-0 shadow">
             <div className="flex">
                {[
                  { id: 'logs', label: 'TELEMETRY LIVE LOGS' },
                  { id: 'curl', label: 'CURL ORCHESTRATION' },
                  { id: 'theory', label: 'THEORETICAL FRAMEWORK' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setLabTab(tab.id as any)}
                    className={cn(
                      "px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 font-mono outline-none focus:ring-0 select-none cursor-pointer",
                      labTab === tab.id ? "border-emerald-500 text-white font-black" : "border-transparent text-slate-400 hover:text-slate-255"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
             </div>
             {labTab === 'logs' && results.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 rounded-md hover:bg-slate-850 border border-slate-800 text-[10px] text-rose-400 font-mono font-black uppercase tracking-wider flex items-center gap-1.5 transition-all select-none cursor-pointer"
                >
                  <Trash2 size={12} className="text-rose-400 animate-pulse" /> Clear Telemetry logs
                </button>
             )}
          </div>

          {/* Active Tab Screen Area */}
          <div className="flex-1 overflow-hidden relative flex">
             <AnimatePresence mode="wait">
                {labTab === 'logs' && (
                  <div className="flex-1 flex overflow-hidden relative">
                    <TestLabResults 
                      results={results}
                      loading={loading}
                      progress={progress}
                      selectedModule={selectedModule}
                      
                      percentiles={percentiles}
                      latencyCategories={latencyCategories}
                      regionalBreakdown={regionalBreakdown}
                      securityAudit={securityAudit}
                      activeModule={activeModule}
                      selectedResult={selectedResult}
                      setSelectedResult={setSelectedResult}
                      payloadTab={payloadTab}
                      setPayloadTab={setPayloadTab}
                      logDetailWidth={logDetailWidth}
                      setIsDraggingLogDetail={setIsDraggingLogDetail}
                      
                      handleClearLogs={handleClearLogs}
                      config={config}
                    />

                    {/* Collapsible log detail side panel */}
                    {selectedResult && (
                      <TestLabResultDetail 
                        selectedResult={selectedResult}
                        setSelectedResult={setSelectedResult}
                        payloadTab={payloadTab}
                        setPayloadTab={setPayloadTab}
                        logDetailWidth={logDetailWidth}
                        setIsDraggingLogDetail={setIsDraggingLogDetail}
                        config={config}
                      />
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
                                onClick={() => {
                                  const headersConfig = config.headers || {};
                                  const textToCopy = selectedModule === 'distributed' ? 
                                    `curl -X ${config.method} "${config.url || 'http://localhost:3000/api'}" \\\n  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \\\n  -H "X-Forwarded-For: 54.210.23.42" \\\n  -H "X-Real-IP: 54.210.23.42" \\\n  -H "CF-Connecting-IP: 54.210.23.42" \\\n  -H "True-Client-IP: 54.210.23.42" \\\n  -H "Client-IP: 54.210.23.42"${Object.entries(headersConfig).length > 0 ? ` \\\n  ${Object.entries(headersConfig).map(([k, v]) => `-H "${k}: ${v}"`).join(' \\\n  ')}` : ''}${config.body ? ` \\\n  -d '${config.body}'` : ''}` :
                                    `curl -X ${config.method} "${config.url || 'http://localhost:3000/api'}"${Object.entries(headersConfig).length > 0 ? ` \\\n  ${Object.entries(headersConfig).map(([k, v]) => `-H "${k}: ${v}"`).join(' \\\n  ')}` : ''}${config.body ? ` \\\n  -d '${config.body}'` : ''}`;
                                  copyToClipboard(textToCopy);
                                }}
                                className="text-slate-400 hover:text-white transition-colors p-1"
                              >
                                <Copy size={15} />
                              </button>
                           </div>
                           <pre className="bg-[#0F1115] p-3.5 rounded-lg border border-slate-800 text-xs font-mono text-blue-350 break-all whitespace-pre-wrap leading-relaxed select-all">
                              {selectedModule === 'distributed' ? (
                                `curl -X ${config.method} "${config.url || 'http://localhost:3000/api'}" \\
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \\
  -H "X-Forwarded-For: 54.210.23.42" \\
  -H "X-Real-IP: 54.210.23.42" \\
  -H "CF-Connecting-IP: 54.210.23.42" \\
  -H "True-Client-IP: 54.210.23.42" \\
  -H "Client-IP: 54.210.23.42" ${Object.entries(config.headers || {}).map(([k, v]) => `\\\n  -H "${k}: ${v}"`).join('')}${config.body ? ` \\\n  -d '${config.body}'` : ''}`
                              ) : (
                                `curl -X ${config.method} "${config.url || 'http://localhost:3000/api'}" \\\n  ${Object.entries(config.headers || {}).map(([k, v]) => `-H "${k}: ${v}"`).join(' \\\n  ')}${config.body ? ` \\\n  -d '${config.body}'` : ''}`
                              )}
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
                  <TestLabTheory activeModule={activeModule} />
                )}
             </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
