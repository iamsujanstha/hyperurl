import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface HeaderRowProps {
  h: { id: string, key: string, value: string };
  onUpdateKey: (key: string) => void;
  onUpdateValue: (val: string) => void;
  onDelete: () => void;
  key?: string;
}

export function HeaderRow({ 
  h, 
  onUpdateKey, 
  onUpdateValue, 
  onDelete 
}: HeaderRowProps) {
  const commonHeaders = [
    "Content-Type",
    "Authorization",
    "Accept",
    "Accept-Encoding",
    "Accept-Language",
    "Cache-Control",
    "Cookie",
    "Host",
    "Origin",
    "Referer",
    "User-Agent",
    "X-API-Key",
    "X-Request-ID",
    "Idempotency-Key"
  ];
  
  const isPreset = commonHeaders.includes(h.key) || h.key === '';
  const [customMode, setCustomMode] = useState(!isPreset);
  const [tempCustomVal, setTempCustomVal] = useState(h.key);

  return (
    <div className="flex gap-2 items-center group animate-fadeIn">
      {customMode ? (
        <div className="flex-1 flex gap-1 bg-slate-950/70 border border-slate-900/60 rounded-lg px-2.5 py-0.5 items-center transition-all focus-within:border-emerald-500/35">
          <input
            value={tempCustomVal}
            onChange={(e) => {
              setTempCustomVal(e.target.value);
              onUpdateKey(e.target.value);
            }}
            placeholder="Custom Header Key"
            className="flex-1 bg-transparent text-xs font-mono outline-none text-slate-200 py-1.5 focus:ring-0"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              setCustomMode(false);
              onUpdateKey('');
              setTempCustomVal('');
            }}
            className="text-[10px] text-slate-450 hover:text-emerald-400 font-mono px-2.1 py-0.8 bg-slate-900/50 rounded hover:bg-slate-850 transition-colors"
            title="Switch back to presets"
          >
            Presets
          </button>
        </div>
      ) : (
        <select
          value={h.key}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '__custom__') {
              setCustomMode(true);
            } else {
              onUpdateKey(val);
              setTempCustomVal(val);
            }
          }}
          className="flex-1 bg-slate-950/70 border border-slate-900/60 rounded-lg px-3 py-2.5 text-xs font-mono outline-none focus:border-emerald-500/35 text-slate-200 cursor-pointer transition-colors"
        >
          <option value="">-- Choose Header Key --</option>
          {commonHeaders.map(ch => (
            <option key={ch} value={ch}>{ch}</option>
          ))}
          <option value="__custom__" className="text-emerald-400 font-bold">✏️ Custom Header Key...</option>
        </select>
      )}

      <input
        value={h.value}
        onChange={(e) => {
          onUpdateValue(e.target.value);
        }}
        placeholder="Value"
        className="flex-1 bg-slate-950/70 border border-slate-900/60 rounded-lg px-3 py-2.5 text-xs font-mono outline-none focus:border-emerald-500/35 text-slate-200 transition-colors"
      />
      <button 
        type="button"
        onClick={onDelete}
        className="text-slate-500 hover:text-rose-450 p-2 hover:bg-slate-950/40 rounded-lg transition-all"
        title="Remove"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
