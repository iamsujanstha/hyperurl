import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ChevronUp, ChevronDown, Globe, Zap, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequestConfig } from '@/server/modules/curl-engine';
import { TestModuleId } from '../TestLabData';

interface TestLabPresetsProps {
  config: RequestConfig;
  onChangeConfig?: (updates: Partial<RequestConfig>) => void;
  setConcurrency: (val: number) => void;
  setIterationsPerUser: (val: number) => void;
  setSelectedPresetId: (id: string) => void;
  setSelectedModule: (id: TestModuleId) => void;
  selectedPresetId: string;
}

export function TestLabPresets({
  config,
  onChangeConfig,
  setConcurrency,
  setIterationsPerUser,
  setSelectedPresetId,
  setSelectedModule,
  selectedPresetId
}: TestLabPresetsProps): React.JSX.Element {
  const [showPresets, setShowPresets] = useState(false);

  const presets = [
    {
      id: 'PRESET_PERFORMANCE',
      name: 'SLA Performance Test (Blast Load)',
      desc: 'Evaluates peak API latencies under a concentrated concurrent load to measure SLA limits.',
      icon: <Zap size={12} className="text-orange-400" />,
      setup: () => {
        setConcurrency(12);
        setIterationsPerUser(5);
        setSelectedPresetId('PRESET_PERFORMANCE');
        setSelectedModule('blast');
      }
    },
    {
      id: 'PRESET_DISTRIBUTED_RATE_LIMIT',
      name: 'Distributed Rate-Limit Check',
      desc: 'Tests IP-rate limiting by spawning requests simulated across multiple geographical origin IPs.',
      icon: <Globe size={12} className="text-indigo-400" />,
      setup: () => {
        if (onChangeConfig) {
          onChangeConfig({
            method: 'GET',
            url: config.url || 'http://localhost:3000/api/demo/rate-limited',
            body: '',
            headers: { ...config.headers }
          });
        }
        setConcurrency(6);
        setIterationsPerUser(8);
        setSelectedPresetId('PRESET_DISTRIBUTED_RATE_LIMIT');
        setSelectedModule('distributed');
      }
    },
    {
      id: 'PRESET_SECURITY',
      name: 'Security Shield Audit / Scan',
      desc: 'Injects systematic parameters checks (SQLi, XSS, Path Traversal) to verify input sanitation.',
      icon: <ShieldAlert size={12} className="text-rose-400" />,
      setup: () => {
        setConcurrency(1);
        setIterationsPerUser(6);
        setSelectedPresetId('PRESET_SECURITY');
        setSelectedModule('security_audit');
      }
    }
  ];

  return (
    <div className="space-y-3 bg-slate-900/45 p-4 border border-slate-800 rounded-xl">
      <button
        type="button"
        onClick={() => setShowPresets(!showPresets)}
        aria-expanded={showPresets}
        aria-controls="automated-qa-presets-list"
        className="flex items-center justify-between w-full hover:text-white transition-colors cursor-pointer select-none outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-[#0B0D11] rounded text-left font-sans"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-violet-400" />
          <span className="text-[10px] font-black uppercase text-violet-400 tracking-wider">Automated QA Presets</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-slate-300 font-mono font-bold uppercase">{showPresets ? 'COLLAPSE' : 'EXPAND'}</span>
          {showPresets ? <ChevronUp size={12} className="text-slate-300" /> : <ChevronDown size={12} className="text-slate-300" />}
        </div>
      </button>
      <AnimatePresence>
        {showPresets && (
          <motion.div
            id="automated-qa-presets-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-3 pt-1"
          >
            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
              Select an automated test preset to quickly align concurrency, iterations, and modules with key QA testing routines.
            </p>
            <div className="grid grid-cols-1 gap-2" role="group" aria-label="Available QA Presets">
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
                      "w-full text-left p-2.5 rounded-lg border transition-all text-xs font-mono flex items-start gap-2.5 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0B0D11]",
                      isActive
                        ? "bg-violet-950/40 border-violet-500/40 text-white shadow-lg"
                        : "bg-black/30 border-slate-800/80 text-slate-300 hover:bg-slate-900/60 hover:border-slate-700 hover:text-white"
                    )}
                  >
                    <div className="p-1.5 bg-black/60 rounded border border-slate-850 shrink-0">
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-extrabold text-slate-100 block text-[11px] leading-tight">{p.name}</span>
                      <span className="text-[10px] text-slate-400 leading-relaxed font-sans block mt-0.5">{p.desc}</span>
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
