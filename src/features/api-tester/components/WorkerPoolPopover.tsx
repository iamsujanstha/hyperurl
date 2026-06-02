import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, X, Plus, Minus } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Telemetry } from '../types';

interface WorkerPoolPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: Telemetry;
  ws: WebSocket | null;
}

export function WorkerPoolPopover({
  isOpen,
  onClose,
  telemetry,
  ws
}: WorkerPoolPopoverProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute right-4 top-13 w-80 bg-[#12161E] border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden font-mono text-xs text-slate-300"
        >
          <div className="p-3 border-b border-slate-800 bg-[#161B25] flex justify-between items-center select-none">
            <span className="text-[9px] font-black text-white tracking-widest uppercase flex items-center gap-2">
              <Cpu size={12} className="text-emerald-500" /> WORKER_THREAD_POOL
            </span>
            <button 
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Control Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => ws?.send(JSON.stringify({ type: 'spawn-worker' }))}
                className="flex-1 py-1.5 bg-emerald-600/25 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white text-[9px] font-black rounded transition-all uppercase flex items-center justify-center gap-1 shadow-sm h-7 cursor-pointer active:scale-95"
              >
                <Plus size={10} /> Spawn Worker
              </button>
              <button
                type="button"
                onClick={() => ws?.send(JSON.stringify({ type: 'terminate-worker' }))}
                className="flex-1 py-1.5 bg-rose-600/25 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white text-[9px] font-black rounded transition-all uppercase flex items-center justify-center gap-1 shadow-sm h-7 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                disabled={(!telemetry.spawnedWorkers || telemetry.spawnedWorkers.length === 0)}
              >
                <Minus size={10} /> Kill Last
              </button>
            </div>

            {/* Capacity Adjuster */}
            <div className="space-y-1.5 select-none">
              <div className="flex justify-between text-[8px] text-slate-500 uppercase">
                <span>Pool max capacity</span>
                <span className="text-white font-bold">{telemetry.maxWorkers} THREADS</span>
              </div>
              <input 
                type="range"
                min="10"
                max="128"
                step="5"
                value={telemetry.maxWorkers}
                onChange={(e) => ws?.send(JSON.stringify({ type: 'set-max-workers', limit: parseInt(e.target.value) }))}
                className="w-full accent-emerald-500 bg-slate-800 h-1 rounded outline-none cursor-ew-resize border-none"
              />
            </div>

            {/* Thread pool stats banner */}
            <div className="text-[8px] bg-slate-900/50 p-2 rounded border border-slate-800/40 flex justify-between text-slate-400 select-none">
              <span>THREADS: {telemetry.activeWorkers}/{telemetry.maxWorkers}</span>
              <span>CLIENTS: {telemetry.clientCount}</span>
            </div>

            {/* Active Worker Grid List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {!telemetry.spawnedWorkers || telemetry.spawnedWorkers.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-slate-800/30 rounded text-slate-600 text-[9px] uppercase">
                  No background active threads.
                </div>
              ) : (
                telemetry.spawnedWorkers.map((worker) => (
                  <div 
                    key={worker.id}
                    className="p-2 bg-slate-900/40 border border-slate-800/60 rounded flex items-center justify-between text-[9px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Cpu size={12} className={cn(
                        worker.status === 'ACTIVE' ? "text-amber-500 animate-pulse" : "text-slate-600"
                      )} />
                      <div className="min-w-0">
                        <div className="text-slate-300 font-bold truncate tracking-tight">{worker.name}</div>
                        <div className="text-[7.5px] text-slate-500 truncate flex items-center gap-1 uppercase tracking-tight">
                          <span className={cn(
                            "w-1 h-1 rounded-full",
                            worker.status === 'ACTIVE' ? "bg-amber-400 animate-pulse" : "bg-slate-500"
                          )}></span>
                          <span>{worker.task}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      <span className="text-[8px] text-slate-600 font-black">{worker.activeTime}s</span>
                      <button
                        type="button"
                        onClick={() => ws?.send(JSON.stringify({ type: 'terminate-worker', id: worker.id }))}
                        className="p-0.5 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 rounded text-slate-650 hover:text-rose-500 transition-all cursor-pointer"
                        title="Kill Thread"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
