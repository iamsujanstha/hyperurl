import React, { useState, useEffect } from 'react';
import { Terminal, Copy, AlertTriangle, Layout, Activity, Info, RefreshCw, FileJson } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { CurlResult } from '../../../server/modules/curl-engine';
import { JsonInteractiveNode } from './JsonInteractiveNode';
import { JsonPretty } from './JsonPretty';

interface ResponseViewerProps {
  result: CurlResult | null;
  loading: boolean;
  onAbort: () => void;
  theme?: 'dark' | 'light';
  defaultTab?: 'response' | 'preview' | 'headers' | 'log';
}

export function ResponseViewer({ 
  result, 
  loading, 
  onAbort, 
  theme = 'dark',
  defaultTab = 'response'
}: ResponseViewerProps) {
  const [activeResTab, setActiveResTab] = useState<'response' | 'preview' | 'headers'>(
    defaultTab === 'log' ? 'response' : (defaultTab as any || 'response')
  );

  const [responseBoxHeight, setResponseBoxHeight] = useState<number>(450);

  const startResizeResponse = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = responseBoxHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      setResponseBoxHeight(Math.max(150, Math.min(1200, startHeight + deltaY)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    setActiveResTab(defaultTab === 'log' ? 'response' : (defaultTab as any || 'response'));
  }, [defaultTab, result?.id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-black/80 space-y-8">
        <div className="text-center space-y-4 relative z-10">
          <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
            <RefreshCw size={24} className="text-emerald-500 animate-spin" />
            <div className="absolute inset-0 bg-emerald-500/10 blur-2xl animate-pulse"></div>
          </div>
          <div className="space-y-1">
            <p className="text-emerald-500/80 font-black text-[12px] tracking-[0.3em] uppercase">EXECUTING_CALL</p>
            <p className="text-slate-600 font-mono text-[9px] uppercase tracking-widest">Awaiting_Server_Response...</p>
          </div>
        </div>
        <button 
          onClick={onAbort}
          className="px-8 py-2.5 border border-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all rounded active:scale-95 relative z-10"
        >
          SIGINT_ABORT
        </button>

        {/* Cinematic background scanline */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-700 bg-[#07080A]">
        <div className="p-4 rounded-full border-2 border-dashed border-slate-800/50 mb-8 opacity-20">
          <Terminal size={40} />
        </div>
        <h3 className="font-black text-slate-600 text-[11px] tracking-[0.4em] uppercase mb-3">STDIN_AWAITING</h3>
        <p className="text-[9px] max-w-[200px] font-mono uppercase leading-relaxed text-slate-700 tracking-tighter">
          Instrument your request configurations to begin automated telemetry capture.
        </p>
      </div>
    );
  }

  const isSuccess = result.status >= 200 && result.status < 300;
  
  // Calculate size in readable format
  const bodyLength = result.body ? result.body.length : 0;
  const formattedSize = bodyLength > 1024 
    ? `${(bodyLength / 1024).toFixed(1)} KB` 
    : `${bodyLength} B`;

  const reqLength = result.requestSize !== undefined ? result.requestSize : 0;
  const formattedReqSize = reqLength > 1024
    ? `${(reqLength / 1024).toFixed(1)} KB`
    : `${reqLength} B`;

  return (
    <div className="flex flex-col bg-black">
      <div className="flex flex-col border-b border-slate-900 bg-[#0F1115] shrink-0">
        {/* Bottom Section: Tabs bar and actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 px-4 bg-black/40">
          <div className="flex flex-wrap gap-1 bg-black/60 p-1 rounded border border-slate-900/60 overflow-x-auto">
            {(['response', 'preview', 'headers'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveResTab(tab)}
                className={cn(
                  "text-[9px] px-2.5 py-1 rounded-[1px] font-black transition-all uppercase tracking-widest cursor-pointer select-none", 
                  activeResTab === tab ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-400"
                )}
              >
                {tab === 'response' ? 'RESPONSE' : tab === 'preview' ? 'PREVIEW' : 'HEADERS'}
              </button>
            ))}
          </div>

          {/* Compact Telemetry Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono select-none">
            <div className="flex items-center gap-1.5 bg-[#07080A]/80 px-2.5 py-1.2 rounded shadow-sm border border-slate-900/40 leading-none">
              <span className="text-slate-500 uppercase font-bold tracking-wider">Status:</span>
              <span className={cn("font-black", isSuccess ? "text-emerald-400" : "text-rose-450")}>
                {result.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#07080A]/80 px-2.5 py-1.2 rounded shadow-sm border border-slate-900/40 leading-none">
              <span className="text-slate-500 uppercase font-bold tracking-wider">Time:</span>
              <span className="font-black text-blue-400">{result.responseTime}ms</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#07080A]/80 px-2.5 py-1.2 rounded shadow-sm border border-slate-900/40 leading-none">
              <span className="text-slate-500 uppercase font-bold tracking-wider">Req:</span>
              <span className="font-black text-slate-350">{formattedReqSize}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#07080A]/80 px-2.5 py-1.2 rounded shadow-sm border border-slate-900/40 leading-none">
              <span className="text-slate-505 uppercase font-bold tracking-wider">Res:</span>
              <span className="font-black text-emerald-450">{formattedSize}</span>
            </div>
          </div>

          {/* QA Quick Copy Helper */}
          <button
            onClick={() => {
              let text = '';
              if (activeResTab === 'response' || activeResTab === 'preview') {
                text = result.body || '';
              } else if (activeResTab === 'headers') {
                text = Object.entries(result.headers).map(([k, v]) => `${k}: ${v}`).join('\n');
              }
              navigator.clipboard.writeText(text);
            }}
            className="p-1 px-3 bg-[#12161E] text-[9px] text-slate-400 hover:text-emerald-400 rounded flex items-center gap-1.5 transition-colors font-mono font-bold cursor-pointer hover:bg-slate-900"
            title="Copy active tab content to clipboard"
          >
            <Copy size={10} />
            <span>COPY</span>
          </button>
        </div>
      </div>

      <div 
        style={{ height: `${responseBoxHeight}px` }}
        className="overflow-auto p-6 font-mono text-xs leading-relaxed custom-scrollbar selection:bg-emerald-500/20 text-emerald-500/90"
      >
        {result.error && activeResTab !== 'headers' ? (
           <div className="text-rose-400 bg-rose-500/5 p-6 rounded border border-rose-500/10 backdrop-blur-sm">
             <div className="text-[11px] font-black mb-4 uppercase tracking-[0.2em] opacity-80 flex items-center gap-3">
                <AlertTriangle size={16} /> EXCEPTION_CAUGHT
             </div>
             <pre className="whitespace-pre-wrap break-all text-[11px] leading-relaxed opacity-90 font-medium">{result.error}</pre>
           </div>
        ) : (
           <div className="space-y-0 break-all">
             {activeResTab === 'preview' && (() => {
                const bodyStr = (result.body || '').trim();
                const contentType = (result.headers['content-type'] || result.headers['Content-Type'] || '').toLowerCase();
                
                // HTML Preview Selection
                if (contentType.includes('text/html') || bodyStr.startsWith('<!DOCTYPE') || bodyStr.startsWith('<html') || bodyStr.startsWith('<div')) {
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono uppercase bg-slate-900/30 p-2.5 border border-slate-900/80 rounded">
                        <span className="font-bold flex items-center gap-2 text-emerald-500">
                          <Layout size={12} /> BROWSER_RENDER_FRAME
                        </span>
                        <span className="font-bold text-slate-500">SANDBOXED_HTML</span>
                      </div>
                      <iframe 
                        title="HTML Response Preview"
                        srcDoc={result.body || ''} 
                        sandbox="allow-scripts" 
                        loading="lazy"
                        className="w-full h-[600px] bg-white rounded-lg border border-slate-900/15 dark:border-slate-800/40"
                      />
                    </div>
                  );
                }

                // Vector or Image Asset Preview Selection
                if (contentType.includes('image/') || bodyStr.startsWith('<svg')) {
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono uppercase bg-slate-900/30 p-2.5 border border-slate-900/80 rounded">
                        <span className="font-bold flex items-center gap-2 text-blue-400">
                          <Activity size={12} /> VECTOR_OR_IMAGE_ASSET
                        </span>
                        <span className="font-semibold text-slate-500">RENDERED_PREVIEW</span>
                      </div>
                      <div className="flex items-center justify-center p-8 bg-slate-900/10 border border-slate-900 rounded-lg min-h-[500px]">
                        {bodyStr.startsWith('<svg') ? (
                          <div dangerouslySetInnerHTML={{ __html: result.body || '' }} className="max-w-full max-h-[550px]" />
                        ) : (
                          <img 
                            src={bodyStr.startsWith('data:') ? bodyStr : `data:${contentType};base64,${bodyStr}`} 
                            alt="Response Asset" 
                            className="max-w-full max-h-[550px] object-contain border border-slate-900/15 dark:border-slate-800/40 rounded" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                    </div>
                  );
                }

                // Interactive Collapsible browser-like JSON Explorer
                try {
                  const json = JSON.parse(bodyStr);
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono uppercase bg-slate-900/30 p-2.5 border border-slate-900/80 rounded">
                        <span className="font-bold text-emerald-500 flex items-center gap-2">
                          <FileJson size={12} /> Response
                        </span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-lg">
                        <JsonInteractiveNode val={json} isLast={true} />
                      </div>
                    </div>
                  );
                } catch {
                  // Fallback to beautiful text preview
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono uppercase bg-slate-900/30 p-2.5 border border-slate-900/80 rounded">
                        <span className="font-bold flex items-center gap-2 text-slate-400">
                          <Info size={12} /> PLAIN_TEXT_PREVIEW
                        </span>
                      </div>
                      <div className="p-4 bg-slate-950/20 border border-slate-900 rounded-lg font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all text-slate-300">
                        {result.body || <span className="italic text-slate-500 uppercase font-black">Empty Response Body</span>}
                      </div>
                    </div>
                  );
                }
              })()}

             {activeResTab === 'response' && (() => {
                const bodyStr = (result.body || '').trim();
                try {
                  const json = JSON.parse(bodyStr);
                  return (
                    <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-lg">
                      <JsonInteractiveNode val={json} isLast={true} defaultCollapsed={false} />
                    </div>
                  );
                } catch {
                  // Check if it looks like HTML
                  if (bodyStr.startsWith('<!DOCTYPE') || bodyStr.startsWith('<html') || bodyStr.startsWith('<div')) {
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-2 bg-amber-500/10 border border-amber-500/20 rounded">
                          <div className="flex items-center gap-2 text-amber-500 text-[10px] uppercase font-bold tracking-widest">
                            <AlertTriangle size={12} /> HTML_DOCUMENT_DETECTED
                          </div>
                          <button 
                            onClick={() => {
                              const blob = new Blob([result.body || ''], { type: 'text/html' });
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                            }}
                            className="text-[9px] font-bold text-amber-600 hover:text-amber-500 underline uppercase"
                          >
                            Render_Page
                          </button>
                        </div>
                        <div className="opacity-60 font-sans text-[10px] bg-slate-900/50 p-4 rounded border border-slate-800 break-words whitespace-pre-wrap max-h-[400px] overflow-y-auto custom-scrollbar">
                          {result.body || ''}
                        </div>
                      </div>
                    );
                  }
                  return <span className="opacity-80 block whitespace-pre-wrap">{result.body || ''}</span>;
                }
              })()}
              
             {activeResTab === 'headers' && (
                <div className="space-y-2">
                  {(Object.entries(result.headers) as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex gap-4 border-b border-slate-905 pb-2">
                       <span className="text-blue-500 font-black w-1/3 shrink-0 uppercase text-[9px] tracking-tight">{k}</span>
                       <span className="text-slate-400 flex-1 break-all">{v}</span>
                    </div>
                  ))}
                </div>
             )}
           </div>
        )}
      </div>
      <div 
        onMouseDown={startResizeResponse}
        className="h-2 hover:h-2 bg-[#11141A] border-t border-slate-900 hover:bg-emerald-500 cursor-row-resize flex items-center justify-center transition-all group z-10 shrink-0"
        title="Drag down to resize Response box"
      >
        <div className="h-[2px] w-12 bg-slate-700 group-hover:bg-emerald-350 rounded" />
      </div>
    </div>
  );
}
