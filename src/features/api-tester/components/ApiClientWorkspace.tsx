import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, 
  Zap, 
  Play, 
  RefreshCw, 
  Save, 
  Copy, 
  List, 
  FileJson, 
  Database, 
  Layers,
  Plus
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { Tab, Collection } from '@/features/api-tester/types';
import { HeaderRow } from './HeaderRow';
import { BatchViewer } from './BatchViewer';
import { NetworkLogViewer } from './NetworkLogViewer';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'GRAPHQL'];

interface ApiClientWorkspaceProps {
  activeTab: Tab;
  activeTabId: string;
  updateActiveTab: (updates: Partial<Tab>) => void;
  updateActiveConfig: (updates: any) => void;
  saveToCollection: () => void;
  handleAbort: () => void;
  handleRun: () => void;
  getResolvedConfig: (tab: Tab) => any;
  showCustomAlert: (title: string, message: string) => void;
  
  splitPercent: number;
  setIsDraggingSplit: (dragging: boolean) => void;
  theme: 'dark' | 'light';

  graphqlQueryHeight: number;
  graphqlVariablesHeight: number;
  payloadJsonHeight: number;
  
  startResizeQuery: (e: React.MouseEvent) => void;
  startResizeVariables: (e: React.MouseEvent) => void;
  startResizePayloadJson: (e: React.MouseEvent) => void;
}

export function ApiClientWorkspace({
  activeTab,
  activeTabId,
  updateActiveTab,
  updateActiveConfig,
  saveToCollection,
  handleAbort,
  handleRun,
  getResolvedConfig,
  showCustomAlert,
  
  splitPercent,
  setIsDraggingSplit,
  theme,

  graphqlQueryHeight,
  graphqlVariablesHeight,
  payloadJsonHeight,

  startResizeQuery,
  startResizeVariables,
  startResizePayloadJson
}: ApiClientWorkspaceProps) {
  const resolvedWidthStyle = useMemo(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 1024 
      ? { width: `${splitPercent}%` } 
      : { width: '100%' };
  }, [splitPercent]);

  const resolvedRightWidthStyle = useMemo(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 1024 
      ? { width: `${100 - splitPercent}%` } 
      : { width: '100%' };
  }, [splitPercent]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 flex flex-col lg:flex-row gap-0 overflow-hidden font-sans"
    >
      {/* LHS: Request Config Panel */}
      <div 
        style={resolvedWidthStyle}
        className="w-full lg:w-auto lg:flex-none border-r border-slate-850 flex flex-col bg-[#0B0D11] overflow-y-auto no-scrollbar"
      >
        <div className="p-4 border-b border-slate-900/60 flex flex-col gap-4 shrink-0 relative bg-[#090C11]/30">
          {/* REST vs GraphQL Selection Grid Toggle */}
          <div className="flex bg-[#07090C] rounded-lg p-1 w-full font-mono font-bold select-none border border-slate-900/40">
            <button
              onClick={() => updateActiveConfig({ method: 'GET' })}
              type="button"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded text-xs uppercase tracking-wider transition-all cursor-pointer",
                activeTab.config.method !== 'GRAPHQL'
                  ? "bg-[#141822] text-emerald-400 font-semibold"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Terminal size={12} className={activeTab.config.method !== 'GRAPHQL' ? "text-emerald-400 animate-pulse" : "text-slate-500"} /> REST CLIENT
            </button>
            <button
              onClick={() => {
                updateActiveConfig({ method: 'GRAPHQL' });
                if (!activeTab.config.url || activeTab.config.url.includes('race-demo') || activeTab.config.url.includes('orders')) {
                  updateActiveConfig({ url: 'https://countries.trevorblades.com/' });
                }
              }}
              type="button"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded text-xs uppercase tracking-wider transition-all cursor-pointer",
                activeTab.config.method === 'GRAPHQL'
                  ? "bg-[#181528] text-violet-400 font-semibold"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Zap size={12} className={activeTab.config.method === 'GRAPHQL' ? "text-violet-400 animate-pulse" : "text-slate-505"} /> GraphQL Playground
            </button>
          </div>
          
          {/* Main URL Bar, dropdown and execution controls */}
          <div className="flex gap-0 rounded-lg bg-[#0F1115] overflow-hidden transition-all border border-slate-900 focus-within:border-emerald-500/35">
            <select
              value={activeTab.config.method}
              onChange={(e) => updateActiveConfig({ method: e.target.value as any })}
              className="bg-transparent text-amber-500 font-extrabold font-mono text-xs sm:text-sm px-4 outline-none cursor-pointer border-r border-slate-900/40 h-11 appearance-none text-center select-none"
            >
              {METHODS.map(m => (
                <option key={m} value={m} className="bg-slate-900 border-none font-bold text-slate-300">
                  {m}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={activeTab.config.url}
              onChange={(e) => updateActiveConfig({ url: e.target.value })}
              placeholder="URL_ENDPOINT_INPUT"
              className="flex-1 bg-transparent px-4 text-xs sm:text-sm font-mono text-emerald-400 placeholder:text-slate-700 outline-none h-11 font-semibold tracking-wide"
            />
            <button
              type="button"
              onClick={activeTab.loading ? handleAbort : handleRun}
              className={cn(
                "px-7 text-xs font-mono font-black tracking-wider transition-all text-white active:scale-95 h-11 flex items-center justify-center gap-2 border-l border-slate-900/40 cursor-pointer select-none",
                activeTab.loading ? "bg-[#B91C1C] hover:bg-red-655" : "bg-emerald-600/90 hover:bg-emerald-600"
              )}
            >
              {activeTab.loading ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
              {activeTab.loading ? 'ABORT' : 'EXEC'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 pb-1 select-none font-sans">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={saveToCollection}
                className="px-3 py-1.5 bg-[#0F1115] hover:bg-slate-900 rounded-lg text-xs font-bold font-mono text-[#94A3B8] hover:text-white flex items-center gap-2 uppercase transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Save size={12} className="text-emerald-500" /> SAVE
              </button>
              <div className="h-4 w-px bg-slate-900/80 mx-1"></div>
              {['Single', 'Batch'].map(mode => {
                const isActive = (mode === 'Batch' && activeTab.batchMode) || (mode === 'Single' && !activeTab.batchMode);
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateActiveTab({ batchMode: mode === 'Batch' })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black font-mono transition-all uppercase tracking-wider cursor-pointer active:scale-95",
                      isActive
                        ? "bg-slate-205 text-black shadow font-bold"
                        : "bg-transparent text-slate-500 hover:text-slate-200 hover:bg-[#12161F]"
                    )}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => updateActiveTab({ showCurl: !activeTab.showCurl })}
                className={cn(
                  "text-xs font-bold font-mono flex items-center gap-1.5 uppercase tracking-wider transition-colors cursor-pointer",
                  activeTab.showCurl ? "text-emerald-400" : "text-slate-500 hover:text-slate-202"
                )}
              >
                <Terminal size={12} /> {activeTab.showCurl ? 'HIDE_CURL' : 'SHOW_CURL'}
              </button>
              <div className="h-4 w-px bg-slate-900/80"></div>
              <button 
                type="button"
                onClick={() => {
                  const resolved = getResolvedConfig(activeTab);
                  const curlMessage = `curl -X ${resolved.method} "${resolved.url}" ${Object.entries(resolved.headers).map(([k,v]) => `-H "${k}: ${v}"`).join(' ')} ${resolved.body ? `-d '${resolved.body}'` : ''}`;
                  navigator.clipboard.writeText(curlMessage);
                }}
                className="text-xs font-bold font-mono text-slate-500 hover:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
              >
                <Copy size={12} /> COPY_CURL
              </button>
            </div>
          </div>

          {activeTab.showCurl && (
            <div className="h-32 p-3.5 bg-slate-950/70 rounded-lg font-mono flex flex-col gap-2 relative group overflow-hidden shadow shrink-0 border border-slate-900/60">
              <div className="absolute top-0 left-0 w-[1.5px] h-full bg-emerald-500/60"></div>
              <div className="flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity shrink-0 select-none">
                <span className="text-emerald-500 font-bold text-[9px] tracking-[0.2em]">CURL_ORCHESTRATION_PREVIEW</span>
                <span className="text-slate-500 text-[9px] font-black">{activeTab.batchMode ? 'CONCURRENT_BATCH' : 'SINGLE_THREAD'}</span>
              </div>
              <pre className="text-emerald-400 text-xs whitespace-pre-wrap break-all leading-relaxed flex-1 overflow-y-auto custom-scrollbar selection:bg-emerald-500/30">
                {(() => {
                  const resolved = getResolvedConfig(activeTab);
                  const isGraphql = resolved.method === 'GRAPHQL';
                  const method = isGraphql ? 'POST' : resolved.method;
                  const finalHeaders = { ...resolved.headers };
                  if (isGraphql && !finalHeaders['Content-Type']) {
                    finalHeaders['Content-Type'] = 'application/json';
                  }
                  
                  const headerString = Object.entries(finalHeaders)
                    .map(([k,v]) => `-H "${k}: ${v}"`)
                    .join(' ');
                    
                  const baseCurl = `curl -X ${method} "${resolved.url}" ${headerString} ${resolved.body ? `-d '${resolved.body.replace(/'/g, "'\\''")}'` : ''}`;
                  
                  if (activeTab.batchMode) {
                    const iters = activeTab.batchIterations || 10;
                    const threads = activeTab.batchConcurrency || 5;
                    return `# CONCURRENT_BATCH_MODE (${iters} REQS / ${threads} THREADS)\nseq ${iters} | xargs -I {} -P ${threads} ${baseCurl}`;
                  }
                  return baseCurl;
                })()}
              </pre>
            </div>
          )}
        </div>

        {/* Detailed inputs parameters list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-[#0B0D11]">
          {/* LHS Batch Mode Customizer Settings */}
          {activeTab.batchMode && (
            <div className="grid grid-cols-2 gap-3.5 bg-slate-950/20 p-4 rounded-xl border border-slate-900/40 mb-1 animate-fadeIn select-none font-mono">
              <div>
                <label className="text-[9.5px] uppercase font-black text-[#556987] tracking-wider block mb-1.5">
                  Iterations (Requests)
                </label>
                <input
                  type="number"
                  min="1"
                  max="2000"
                  placeholder="10"
                  value={activeTab.batchIterations ?? ''}
                  onChange={(e) => {
                    const valueStr = parseInt(e.target.value, 10);
                    updateActiveTab({ batchIterations: isNaN(valueStr) ? undefined : valueStr });
                  }}
                  className="w-full bg-[#11141C] border border-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-emerald-500/30 text-emerald-400 font-bold"
                />
              </div>
              <div>
                <label className="text-[9.5px] uppercase font-black text-[#556987] tracking-wider block mb-1.5">
                  Concurrency (Threads)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="5"
                  value={activeTab.batchConcurrency ?? ''}
                  onChange={(e) => {
                    const valueStr = parseInt(e.target.value, 10);
                    updateActiveTab({ batchConcurrency: isNaN(valueStr) ? undefined : valueStr });
                  }}
                  className="w-full bg-[#11141C] border border-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-emerald-500/30 text-emerald-400 font-bold"
                />
              </div>
            </div>
          )}

          {/* Headers Matrix section */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between select-none font-sans">
              <label className="text-xs uppercase font-black text-slate-400 tracking-widest flex items-center gap-2 font-bold select-none">
                 <List size={12} className="text-emerald-500 animate-pulse" /> Headers_Matrix
              </label>
              <button 
                type="button"
                onClick={() => updateActiveTab({ headersList: [...activeTab.headersList, { id: uuidv4(), key: '', value: '' }] })}
                className="text-emerald-400 hover:text-white transition-colors p-1.5 bg-[#12161F] hover:bg-slate-900 rounded-lg shadow-sm active:scale-90 cursor-pointer"
                title="Add custom header key-value entry"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {activeTab.headersList.map((h) => (
                <HeaderRow
                  key={h.id}
                  h={h}
                  onUpdateKey={(newKey) => {
                    const updatedList = activeTab.headersList.map(item => item.id === h.id ? { ...item, key: newKey } : item);
                    updateActiveTab({ headersList: updatedList });
                  }}
                  onUpdateValue={(newVal) => {
                    const updatedList = activeTab.headersList.map(item => item.id === h.id ? { ...item, value: newVal } : item);
                    updateActiveTab({ headersList: updatedList });
                  }}
                  onDelete={() => {
                    const filteredList = activeTab.headersList.filter(item => item.id !== h.id);
                    updateActiveTab({ headersList: filteredList });
                  }}
                />
              ))}
            </div>
          </section>

          {/* Method Bodys / JSON payloads section */}
          {['POST', 'PUT', 'PATCH'].includes(activeTab.config.method) && (
            <section className="space-y-3 pt-1">
              <div className="flex items-center justify-between select-none">
                <label className="text-xs uppercase font-black text-slate-400 tracking-widest flex items-center gap-2 font-bold font-sans">
                   <FileJson size={12} className="text-emerald-500 animate-pulse" /> Payload_JSON
                </label>
                <button 
                  type="button"
                  onClick={() => {
                     try {
                       const parsedObj = JSON.parse(activeTab.config.body || '');
                       updateActiveConfig({ body: JSON.stringify(parsedObj, null, 2) });
                     } catch (e) {
                       showCustomAlert('INVALID JSON', 'Malformed syntax in request payload. Check formatting strings.');
                     }
                  }}
                  className="text-xs font-bold font-mono text-slate-500 hover:text-emerald-400 uppercase transition-colors cursor-pointer"
                >
                  Prettify_JSON
                </button>
              </div>
              <div className="relative flex flex-col" style={{ height: `${payloadJsonHeight}px` }}>
                <textarea
                  value={activeTab.config.body}
                  onChange={(e) => updateActiveConfig({ body: e.target.value })}
                  className="w-full flex-1 bg-slate-950/40 border border-slate-900/60 rounded-t-lg p-4 font-mono text-xs text-emerald-400/90 outline-none resize-none focus:border-emerald-500/30 leading-relaxed shadow-inner"
                  placeholder='{ "key": "value" }'
                />
                <div 
                  onMouseDown={startResizePayloadJson}
                  className="h-2 hover:h-2.5 bg-[#12161E] cursor-row-resize flex items-center justify-center transition-all group z-10 rounded-b-lg shrink-0 border-t border-slate-950"
                  title="Drag down to resize Payload JSON box"
                >
                  <div className="h-[2px] w-12 bg-slate-800 group-hover:bg-emerald-500/80 rounded" />
                </div>
              </div>
            </section>
          )}

          {/* GraphQL playground section - CLEAN and optimized with ZERO gaps! */}
          {activeTab.config.method === 'GRAPHQL' && (
            <section className="space-y-0 pt-1 animate-fadeIn">
              <div className="border border-slate-900/60 rounded-lg overflow-hidden bg-slate-950/20 flex flex-col shadow-inner">
                {/* Query Pane */}
                <div className="relative flex flex-col shrink-0" style={{ height: `${graphqlQueryHeight}px` }}>
                  <div className="px-3.5 py-2.5 bg-[#0F1115] border-b border-slate-950 select-none flex items-center justify-between shrink-0">
                    <span className="text-[10px] uppercase font-black text-violet-400 tracking-widest flex items-center gap-2 font-mono">
                      <Layers size={12} className="text-violet-500 animate-pulse" /> GraphQL_Query
                    </span>
                  </div>
                  <textarea
                    value={activeTab.graphqlQuery || ''}
                    onChange={(e) => updateActiveTab({ graphqlQuery: e.target.value })}
                    placeholder="query MyQuery { ... }"
                    className="w-full flex-1 bg-transparent p-4 font-mono text-[11.5px] text-violet-400/90 outline-none resize-none leading-relaxed"
                  />
                  {/* Draggable Query Divider */}
                  <div 
                    onMouseDown={startResizeQuery}
                    className="h-1 bg-slate-950 hover:bg-violet-500 cursor-row-resize flex items-center justify-center transition-all group z-10 shrink-0 border-b border-slate-900/60"
                    title="Drag down to resize Query box"
                  />
                </div>

                {/* Variables Pane with zero gaps */}
                <div className="relative flex flex-col shrink-0" style={{ height: `${graphqlVariablesHeight}px` }}>
                  <div className="px-3.5 py-2.5 bg-[#0F1115] border-b border-slate-950 select-none flex items-center justify-between shrink-0">
                    <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest flex items-center gap-2 font-mono">
                      <Database size={11} className="text-blue-500" /> Variables_JSON
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                         try {
                           const parsedObj = JSON.parse(activeTab.graphqlVariables || '{}');
                           updateActiveTab({ graphqlVariables: JSON.stringify(parsedObj, null, 2) });
                         } catch (e) {
                           showCustomAlert('INVALID JSON', 'Malformed syntax in GraphQL variables detector. Ensure keys and values are properly quoted.');
                         }
                      }}
                      className="text-[9px] font-bold font-mono text-slate-500 hover:text-blue-400 uppercase transition-colors cursor-pointer"
                    >
                      Format_Vars
                    </button>
                  </div>
                  <textarea
                    value={activeTab.graphqlVariables || ''}
                    onChange={(e) => updateActiveTab({ graphqlVariables: e.target.value })}
                    placeholder='{ "id": 1 }'
                    className="w-full flex-1 bg-transparent p-4 font-mono text-[11.5px] text-blue-400/90 outline-none resize-none leading-relaxed"
                  />
                  {/* Draggable Variables resizer at bottom */}
                  <div 
                    onMouseDown={startResizeVariables}
                    className="h-1 bg-slate-950 hover:bg-blue-500 cursor-row-resize flex items-center justify-center transition-all group z-10 shrink-0"
                    title="Drag down to resize Variables box"
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Vertical split draggable slider resizer bar */}
      <div 
        onMouseDown={() => setIsDraggingSplit(true)}
        className="hidden lg:flex w-1.5 hover:w-1.5 bg-[#12161E] hover:bg-emerald-500 cursor-col-resize items-center justify-center transition-all shrink-0 border-x border-slate-850 group z-20"
        title="Drag left or right to resize panels"
      >
        <div className="w-[1.5px] h-12 bg-slate-700 group-hover:bg-emerald-300 rounded" />
      </div>

      {/* RHS output viewer wrapper */}
      <div 
        style={resolvedRightWidthStyle}
        className="w-full lg:w-auto lg:flex-1 flex flex-col bg-black overflow-hidden border-t lg:border-t-0 border-slate-850"
      >
        {activeTab.batchMode ? (
          <BatchViewer 
            results={activeTab.batchResults} 
            progress={activeTab.progress} 
            concurrency={activeTab.batchConcurrency || 5} 
            onAbort={handleAbort} 
            theme={theme}
          />
        ) : (
          <NetworkLogViewer
            results={activeTab.results || []}
            loading={activeTab.loading}
            onAbort={handleAbort}
            theme={theme}
            activeTabId={activeTabIDResolver(activeTabId, activeTab)}
            onClearLogs={() => updateActiveTab({ results: [], result: null })}
          />
        )}
      </div>
    </motion.div>
  );
}

function activeTabIDResolver(id: string, tab: Tab) {
  // Safe helper key
  return id || tab?.id || '';
}
