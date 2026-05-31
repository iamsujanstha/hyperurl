import React from 'react';
import { Plus, X, Box, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export interface EnvVar {
  key: string;
  value: string;
}

interface VariablesManagerProps {
  variables: Record<string, string>;
  onVariablesChange: (variables: Record<string, string>) => void;
}

export function VariablesManager({ variables, onVariablesChange }: VariablesManagerProps) {
  const addVar = () => {
    onVariablesChange({ ...variables, '': '' });
  };

  const updateVar = (oldKey: string, newKey: string, value: string) => {
    const next = { ...variables };
    if (oldKey !== newKey) {
      delete next[oldKey];
    }
    next[newKey] = value;
    onVariablesChange(next);
  };

  const removeVar = (key: string) => {
    const next = { ...variables };
    delete next[key];
    onVariablesChange(next);
  };

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
        <div className="flex flex-col">
          <h2 className="text-base font-black text-white font-mono tracking-widest uppercase flex items-center gap-2">
            <Box size={16} className="text-emerald-450 animate-pulse" /> Global_Environments
          </h2>
          <span className="text-xs text-slate-400 font-sans mt-1.5 leading-relaxed">
            Reference variables securely across URL, Headers, and Payloads using the <span className="text-emerald-400 font-mono font-bold">{"{{KEY}}"}</span> syntax.
          </span>
        </div>
        <button 
          onClick={addVar} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase px-4.5 py-2.5 rounded-lg tracking-wider flex items-center gap-2 transition-all cursor-pointer select-none shadow-lg shadow-emerald-950/20 active:scale-95 border border-emerald-555"
        >
          <Plus size={15} /> Add_Var
        </button>
      </div>

      <div className="flex-1 card-slate p-5 overflow-y-auto space-y-3.5 custom-scrollbar bg-black/40 border border-slate-800/80 rounded-xl">
        {Object.entries(variables).length === 0 ? (
          <div className="text-center py-24 text-slate-500 font-mono text-sm italic tracking-wide">
            NO_ACTIVE_ENVIRONMENT_VARIABLES_DEFINED
          </div>
        ) : (
          (Object.entries(variables) as [string, string][]).map(([key, value], idx) => (
            <div key={idx} className="flex gap-3 items-center group animate-fadeIn">
              <div className="flex-1 flex gap-2">
                <input
                  value={key}
                  onChange={(e) => updateVar(key, e.target.value, value)}
                  placeholder="VARIABLE_NAME"
                  className="flex-1 border border-slate-800 bg-slate-900/60 px-4 py-2.5 rounded-lg focus:border-emerald-500/50 outline-none transition-all text-emerald-400 font-mono text-xs sm:text-sm font-semibold tracking-wide"
                />
                <input
                  value={value}
                  onChange={(e) => updateVar(key, key, e.target.value)}
                  placeholder="Value"
                  className="flex-1 border border-slate-800 bg-slate-900/60 px-4 py-2.5 rounded-lg focus:border-emerald-500/50 outline-none transition-all text-slate-100 font-mono text-xs sm:text-sm font-medium"
                />
              </div>
              <button 
                onClick={() => removeVar(key)}
                className="text-slate-500 hover:text-rose-500 transition-colors p-2.5 hover:bg-slate-900/50 rounded-lg border border-transparent hover:border-slate-800/50"
                title="Remove variable"
              >
                <X size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-blue-950/20 border border-blue-500/25 rounded-xl flex gap-3 items-start">
         <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
         <div className="space-y-1">
           <span className="text-[10px] font-black uppercase text-blue-400 font-mono block tracking-wider">VARIABLE_RESOLUTION_ENGINE</span>
           <p className="text-xs text-slate-350 leading-relaxed font-sans">
              Variables are automatically resolved client-side at submission. You can construct nested endpoints or populate common credentials: e.g. <span className="text-emerald-400 font-mono font-bold">{"{{BASE_URL}}"}/v1/users</span> or auth headers referencing <span className="text-emerald-400 font-mono font-bold">{"{{API_TOKEN}}"}</span> keys securely.
           </p>
         </div>
      </div>
    </div>
  );
}
