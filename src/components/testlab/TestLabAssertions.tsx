import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface AssertionItem {
  id: string;
  type: string;
  value: string;
}

interface TestLabAssertionsProps {
  assertions: AssertionItem[];
  loading: boolean;
  addAssertion: () => void;
  updateAssertion: (id: string, updates: Partial<{ type: string; value: string }>) => void;
  removeAssertion: (id: string) => void;
  setSelectedPresetId: (id: string) => void;
}

export function TestLabAssertions({
  assertions,
  loading,
  addAssertion,
  updateAssertion,
  removeAssertion,
  setSelectedPresetId
}: TestLabAssertionsProps): React.JSX.Element {
  return (
    <div className="space-y-3 pt-4 border-t border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Verification Criteria</span>
        <button
          type="button"
          onClick={addAssertion}
          disabled={loading}
          className="px-2.5 py-1 text-xs font-mono text-emerald-450 hover:text-white flex items-center gap-1.5 border border-slate-700 bg-black hover:border-emerald-500 transition-all rounded-lg font-bold select-none cursor-pointer"
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
              className="bg-black border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 outline-none select-none"
            >
              <option value="STATUS_CODE" className="text-white bg-slate-900">STATUS ===</option>
              <option value="LATENCY_LESS_THAN" className="text-white bg-slate-900">LATENCY &lt;</option>
              <option value="CONTAINS_TEXT" className="text-white bg-slate-900">CONTAINS</option>
              <option value="HEADER_EXISTS" className="text-white bg-slate-900">HDR EXISTS</option>
              <option value="HEADER_VALUE" className="text-white bg-slate-900">HDR MATCH</option>
              <option value="SCHEMA_KEY" className="text-white bg-slate-900">JSON PATH</option>
              <option value="HTTPS_ENFORCED" className="text-white bg-slate-900">HTTPS CHECK</option>
              <option value="IDEMPOTENCY_MATCH" className="text-white bg-slate-900">IDEMPOTENT</option>
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
  );
}
