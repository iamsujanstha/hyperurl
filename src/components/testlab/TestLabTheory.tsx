import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Beaker, Terminal, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TestModuleId, THEORETICAL_FRAMEWORKS } from '../TestLabData';

interface TestLabTheoryProps {
  activeModule: {
    id: TestModuleId;
    name: string;
    icon: React.ReactNode;
    strategy: string;
    theory: string;
  };
}

export function TestLabTheory({ activeModule }: TestLabTheoryProps): React.JSX.Element {
  const framework = THEORETICAL_FRAMEWORKS[activeModule.id] || {
    problem: "System components must withstand unexpected volumes or structural requests. Under high pressure, system boundary limits leak raw thread failures or state corruption.",
    solution: "Systematically stress endpoints under isolated test protocols to measure threshold boundaries prior to production exposure.",
    realLifeExample: "Normal production spikes triggering unexpected service failures due to lack of pre-production validation.",
    staffEngineeringDepth: "Implement strict timeout margins, secure error handling routines, and dynamic query bounds on all mutable actions."
  };

  return (
    <motion.div 
      key="theoryTab"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="absolute inset-0 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-[#07090C] select-text"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border",
              activeModule.id === 'security_audit' || activeModule.id === 'chaos'
                ? "bg-rose-500/10 border-rose-500/20 text-rose-455"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-450"
            )}>
              {activeModule.icon}
            </div>
            <div>
              <h2 className="text-sm font-black text-white font-mono tracking-wider uppercase leading-none">{activeModule.name}</h2>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono font-bold leading-none">Theoretical Attack & Safety Framework</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-black border border-slate-800 px-2 py-1 bg-black rounded text-slate-400 uppercase tracking-widest">
              {activeModule.strategy}
            </span>
          </div>
        </div>

        {/* Quick Summary Banner */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850/60 leading-relaxed font-sans text-xs md:text-sm text-slate-300">
          <span className="font-mono text-emerald-400 font-black mr-2 uppercase tracking-wide">CORE PARADIGM:</span>
          {activeModule.theory}
        </div>

        {/* 2x2 Grid for Problem/Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Card 1: The Problem (Vulnerability) */}
          <div className="bg-[#090D14] border border-rose-950/35 rounded-xl p-5 hover:border-rose-900/30 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle size={15} />
                <span className="text-xs font-black font-mono uppercase tracking-widest">The Production Underworld (The Problem)</span>
              </div>
              <p className="text-xs text-slate-350 leading-relaxed font-sans select-text">
                {framework.problem}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-900/50 flex justify-between items-center text-[10px] text-rose-550/80 font-mono font-bold">
              <span>THREAT SIGNATURE: CRITICAL EXCESS</span>
              <span>STATUS: DANGER</span>
            </div>
          </div>

          {/* Card 2: The Solution (Mitigation) */}
          <div className="bg-[#090D14] border border-emerald-950/35 rounded-xl p-5 hover:border-emerald-900/30 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Beaker size={15} />
                <span className="text-xs font-black font-mono uppercase tracking-widest">Engineering Mitigation (The Solution)</span>
              </div>
              <p className="text-xs text-slate-350 leading-relaxed font-sans select-text">
                {framework.solution}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-900/50 flex justify-between items-center text-[10px] text-emerald-555/80 font-mono font-bold">
              <span>MITIGATION SEQUENCE: SHIELD-INIT</span>
              <span>STATUS: DEPLOYED</span>
            </div>
          </div>

        </div>

        {/* Real World Production Incident Case Study */}
        <div className="bg-[#0F1217]/50 border border-slate-850/80 rounded-xl p-5 space-y-3 select-text">
          <div className="flex items-center gap-2 text-blue-400 border-b border-slate-800/50 pb-2">
            <Terminal size={14} />
            <span className="text-xs font-black font-mono uppercase tracking-widest">Real-World Incident Analysis</span>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-white leading-relaxed font-sans font-bold">
              Production Impact Scenario:
            </p>
            <p className="text-xs text-slate-350 leading-relaxed font-sans italic border-l-2 border-slate-705 pl-3">
              "{framework.realLifeExample}"
            </p>
          </div>
        </div>

        {/* Staff-Level Architecture Guide */}
        <div className="bg-gradient-to-r from-emerald-950/10 to-transparent border border-emerald-500/20 rounded-xl p-5 space-y-3.5 shadow-lg select-text">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <Layout size={15} />
            <span className="text-xs font-black font-mono uppercase tracking-widest">Architectural Guardrails (Staff Engineering Depth)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans font-bold">
            How to scale protection cleanly:
          </p>
          <p className="text-xs text-slate-350 leading-relaxed font-sans font-medium">
            {framework.staffEngineeringDepth}
          </p>
        </div>

      </div>
    </motion.div>
  );
}
