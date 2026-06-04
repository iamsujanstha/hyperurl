import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ChevronUp, ChevronDown, Globe, Repeat, Cpu, List, Zap, ShieldAlert, Server, Target 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequestConfig } from '@/server/modules/curl-engine';
import { TestModuleId } from '../TestLabData';

interface TestLabPresetsProps {
  config: RequestConfig;
  onChangeConfig?: (updates: Partial<RequestConfig>) => void;
  setConcurrency: (val: number) => void;
  setIterationsPerUser: (val: number) => void;
  setAssertions: (arr: { id: string; type: string; value: string }[]) => void;
  setSelectedPresetId: (id: string) => void;
  setSelectedModule: (id: TestModuleId) => void;
  selectedPresetId: string;
}

export function TestLabPresets({
  config,
  onChangeConfig,
  setConcurrency,
  setIterationsPerUser,
  setAssertions,
  setSelectedPresetId,
  setSelectedModule,
  selectedPresetId
}: TestLabPresetsProps): React.JSX.Element {
  const [showPresets, setShowPresets] = useState(false);

  const presets = [
    {
      id: 'PRESET_DISTRIBUTED_RATE_LIMIT',
      name: 'Distributed Rate-Limit Sandbox',
      desc: 'Checks IP-based limits (throttles to 429 if the same client hits >3 requests/sec).',
      icon: <Globe size={12} className="text-indigo-400" />,
      setup: () => {
        if (onChangeConfig) {
          onChangeConfig({
            method: 'GET',
            url: 'http://localhost:3000/api/demo/rate-limited',
            body: '',
            headers: { ...config.headers }
          });
        }
        setConcurrency(5);
        setIterationsPerUser(10);
        setAssertions([{ id: '1', type: 'STATUS_CODE', value: '200' }]);
        setSelectedPresetId('PRESET_DISTRIBUTED_RATE_LIMIT');
        setSelectedModule('distributed');
      }
    },
    {
      id: 'PRESET_IDEMPOTENCY',
      name: 'Idempotency Validation',
      desc: 'Checks POST / DELETE attempts with idempotency variables and keys.',
      icon: <Repeat size={12} className="text-blue-400" />,
      setup: () => {
        if (onChangeConfig) {
          onChangeConfig({
            method: 'POST',
            body: config.body || JSON.stringify({ transaction_id: "IDEM_TX_" + Math.floor(Math.random() * 100000), amount: 150.00, user_id: 1024 }),
            headers: {
              ...config.headers,
              'Idempotency-Key': 'IDEM_' + Math.random().toString(36).substring(2, 10),
              'X-Request-ID': 'REQ_' + Math.random().toString(36).substring(2, 10)
            }
          });
        }
        setAssertions([
          { id: '1', type: 'STATUS_CODE', value: '250' },
          { id: '2', type: 'IDEMPOTENCY_MATCH', value: 'true' }
        ]);
        setSelectedPresetId('PRESET_IDEMPOTENCY');
        setSelectedModule('replay');
      }
    },
    {
      id: 'PRESET_SCHEMA',
      name: 'Schema & Field Integrity',
      desc: 'Validates required model fields, type compliance, and data consistency.',
      icon: <Cpu size={12} className="text-cyan-400" />,
      setup: () => {
        setAssertions([
          { id: '1', type: 'STATUS_CODE', value: '200' },
          { id: '2', type: 'SCHEMA_KEY', value: 'id' }
        ]);
        setSelectedPresetId('PRESET_SCHEMA');
        setSelectedModule('fuzzer');
      }
    },
    {
      id: 'PRESET_PAGINATION',
      name: 'Pagination Boundaries',
      desc: 'Checks offset/limit boundaries, sorting directions, and cursors.',
      icon: <List size={12} className="text-amber-400" />,
      setup: () => {
        try {
          const urlObj = new URL(config.url || 'http://localhost:3000/api/endpoint');
          urlObj.searchParams.set('page', '1');
          urlObj.searchParams.set('limit', '10');
          urlObj.searchParams.set('sort', 'desc');
          if (onChangeConfig) {
            onChangeConfig({ url: urlObj.toString() });
          }
        } catch (e) {
          try {
            if (onChangeConfig) {
              onChangeConfig({ url: (config.url || '') + (config.url?.includes('?') ? '&' : '?') + 'page=1&limit=10&sort=desc' });
            }
          } catch {}
        }
        setAssertions([
          { id: '1', type: 'STATUS_CODE', value: '200' },
          { id: '2', type: 'SCHEMA_KEY', value: 'limit' }
        ]);
        setSelectedPresetId('PRESET_PAGINATION');
        setSelectedModule('basic_query');
      }
    },
    {
      id: 'PRESET_PERFORMANCE',
      name: 'SLA Performance Test',
      desc: 'Evaluates peak latencies to keep transactions strictly under 500ms.',
      icon: <Zap size={12} className="text-orange-400" />,
      setup: () => {
        setConcurrency(10);
        setIterationsPerUser(5);
        setAssertions([
          { id: '1', type: 'STATUS_CODE', value: '200' },
          { id: '2', type: 'LATENCY_LESS_THAN', value: '500' }
        ]);
        setSelectedPresetId('PRESET_PERFORMANCE');
        setSelectedModule('blast');
      }
    },
    {
      id: 'PRESET_SECURITY',
      name: 'Security Shield Audit',
      desc: 'Audits unescaped vectors, safe protocols, and missing CORS security headers.',
      icon: <ShieldAlert size={12} className="text-rose-400" />,
      setup: () => {
        setAssertions([
          { id: '1', type: 'HTTPS_ENFORCED', value: 'true' },
          { id: '2', type: 'HEADER_EXISTS', value: 'x-frame-options' }
        ]);
        setSelectedPresetId('PRESET_SECURITY');
        setSelectedModule('security_audit');
      }
    },
    {
      id: 'PRESET_VERSIONING',
      name: 'API Version Verification',
      desc: 'Tests API clients version selectors (Accept or custom HTTP headers).',
      icon: <Server size={12} className="text-violet-400" />,
      setup: () => {
        if (onChangeConfig) {
          onChangeConfig({
            headers: {
              ...config.headers,
              'Accept': 'application/vnd.myapi.v2+json',
              'X-API-Version': '2026-05-31'
            }
          });
        }
        setAssertions([
          { id: '1', type: 'STATUS_CODE', value: '200' },
          { id: '2', type: 'HEADER_EXISTS', value: 'x-api-version' }
        ]);
        setSelectedPresetId('PRESET_VERSIONING');
        setSelectedModule('basic_query');
      }
    },
    {
      id: 'PRESET_ISOLATION',
      name: 'Transactional Isolation Check',
      desc: 'Validates that testing records use dynamic variables and safe boundaries.',
      icon: <Target size={12} className="text-emerald-400" />,
      setup: () => {
        const randVal = Math.floor(Math.random() * 999999);
        try {
          const urlObj = new URL(config.url || 'http://localhost:3000/api/endpoint');
          urlObj.searchParams.set('isolated_tx_id', 'TX_' + randVal);
          if (onChangeConfig) {
            onChangeConfig({ url: urlObj.toString() });
          }
        } catch (e) {
          if (onChangeConfig) {
            onChangeConfig({ url: (config.url || '') + (config.url?.includes('?') ? '&' : '?') + 'isolated_tx_id=TX_' + randVal });
          }
        }
        setAssertions([
          { id: '1', type: 'STATUS_CODE', value: '200' },
          { id: '2', type: 'CONTAINS_TEXT', value: 'TX_' }
        ]);
        setSelectedPresetId('PRESET_ISOLATION');
        setSelectedModule('fuzzer');
      }
    }
  ];

  return (
    <div className="space-y-3 bg-slate-900/45 p-4 border border-slate-800 rounded-xl">
      <button
        type="button"
        onClick={() => setShowPresets(!showPresets)}
        className="flex items-center justify-between w-full hover:text-white transition-colors cursor-pointer select-none outline-none"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-violet-400" />
          <span className="text-[10px] font-black uppercase text-violet-400 tracking-wider">Automated QA Presets</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">{showPresets ? 'COLLAPSE' : 'EXPAND'}</span>
          {showPresets ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
        </div>
      </button>
      <AnimatePresence>
        {showPresets && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-3 pt-1"
          >
            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
              Click a test suite preset to auto-initialize headers, bodies, parameters, and assertions for verification.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {presets.map(p => {
                const isActive = selectedPresetId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      p.setup();
                      setShowPresets(false);
                    }}
                    type="button"
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg border transition-all text-xs font-mono flex items-start gap-2.5 cursor-pointer select-none",
                      isActive
                        ? "bg-violet-950/40 border-violet-500/40 text-white shadow-lg"
                        : "bg-black/30 border-slate-800/80 text-slate-350 hover:bg-slate-900/60 hover:border-slate-700 hover:text-white"
                    )}
                  >
                    <div className="p-1.5 bg-black/60 rounded border border-slate-850 shrink-0">
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-extrabold text-slate-200 block text-[11px] leading-tight select-none">{p.name}</span>
                      <span className="text-[10px] text-slate-455 leading-relaxed font-sans block mt-0.5 select-none">{p.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
