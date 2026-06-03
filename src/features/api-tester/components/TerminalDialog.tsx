import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X } from 'lucide-react';
import { DialogState, Collection } from '@/features/api-tester/types';

interface TerminalDialogProps {
  dialog: DialogState;
  setDialog: React.Dispatch<React.SetStateAction<DialogState>>;
  collections: Collection[];
}

export function TerminalDialog({
  dialog,
  setDialog,
  collections
}: TerminalDialogProps) {
  return (
    <AnimatePresence>
      {dialog.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-mono select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-sm bg-[#12161E] border border-slate-800 rounded-lg shadow-2xl overflow-hidden text-slate-300"
          >
            {/* Modal Header */}
            <div className="px-4 py-3 bg-[#161B25] border-b border-slate-800 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-black tracking-widest text-emerald-400 flex items-center gap-2 uppercase">
                <Terminal size={12} /> {dialog.title}
              </span>
              <button
                type="button"
                onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <p className="text-[10px] text-slate-400 leading-normal uppercase font-mono">
                {dialog.message}
              </p>

              {/* PROMPT_TEXT Field */}
              {dialog.type === 'PROMPT_TEXT' && (
                <input
                  type="text"
                  value={dialog.inputVal || ''}
                  onChange={(e) => setDialog(prev => ({ ...prev, inputVal: e.target.value }))}
                  className="w-full bg-black border border-slate-800 rounded p-2 text-[11px] font-mono text-emerald-400 focus:border-slate-700 outline-none uppercase"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      dialog.onConfirm(dialog.inputVal);
                    }
                  }}
                />
              )}

              {/* SAVE_REQUEST Multi-Field layout */}
              {dialog.type === 'SAVE_REQUEST' && (
                <div className="space-y-3 font-mono">
                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">Request Identifier</label>
                    <input
                      type="text"
                      value={dialog.inputVal || ''}
                      onChange={(e) => setDialog(prev => ({ ...prev, inputVal: e.target.value }))}
                      className="w-full bg-black border border-slate-800 rounded p-2 text-[11px] text-emerald-400 focus:border-slate-700 outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">Target Collection</label>
                    <select
                      value={dialog.selectedColId || ''}
                      onChange={(e) => setDialog(prev => ({ ...prev, selectedColId: e.target.value }))}
                      className="w-[#100%] bg-black border border-slate-800 rounded p-2 text-[11px] text-slate-300 focus:border-slate-700 outline-none"
                    >
                      {collections.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer / Interactive Buttons */}
            <div className="px-5 py-3.5 bg-[#10141C] border-t border-slate-850 flex justify-end gap-2.5">
              {dialog.type !== 'ALERT' && (
                <button
                  type="button"
                  onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                  className="px-3 py-1 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-[9px] font-bold text-slate-400 hover:text-white rounded uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (dialog.type === 'SAVE_REQUEST') {
                    dialog.onConfirm(dialog.inputVal, dialog.selectedColId);
                  } else if (dialog.type === 'PROMPT_TEXT') {
                    dialog.onConfirm(dialog.inputVal);
                  } else {
                    dialog.onConfirm();
                  }
                }}
                className="px-4 py-1 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white text-[9px] font-black uppercase tracking-wider rounded transition-all shadow-sm cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
