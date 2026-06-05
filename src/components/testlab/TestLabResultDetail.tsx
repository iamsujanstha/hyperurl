import React from 'react';
import { 
  X, Globe, ShieldAlert, Layout, FileJson, Repeat 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurlResult, RequestConfig } from '@/server/modules/curl-engine';
import { LabJsonInteractiveNode } from './LabJsonInteractiveNode';

interface ExtendedCurlResult extends CurlResult {
  retriesApplied?: number;
}

interface TestLabResultDetailProps {
  selectedResult: ExtendedCurlResult;
  setSelectedResult: (res: ExtendedCurlResult | null) => void;
  payloadTab: 'pretty' | 'raw';
  setPayloadTab: (tab: 'pretty' | 'raw') => void;
  logDetailWidth: number;
  setIsDraggingLogDetail: (val: boolean) => void;
  config: RequestConfig;
}

export function TestLabResultDetail({
  selectedResult,
  setSelectedResult,
  payloadTab,
  setPayloadTab,
  logDetailWidth,
  setIsDraggingLogDetail,
  config
}: TestLabResultDetailProps): React.JSX.Element {
  
  return (
    <div 
      style={{ width: typeof window !== 'undefined' && window.innerWidth < 1024 ? '100%' : `${logDetailWidth}px` }}
      className="w-full lg:w-auto border-l border-slate-800 bg-[#0F1115] flex flex-col overflow-hidden shrink-0 shadow-2xl relative z-10 animate-in fade-in slide-in-from-right-5 duration-150"
    >
      {/* Desktop Drag Handle */}
      <div 
        onMouseDown={() => setIsDraggingLogDetail(true)}
        className="hidden lg:flex absolute left-0 top-0 bottom-0 w-1.5 bg-[#12161E] hover:bg-emerald-500 cursor-col-resize items-center justify-center transition-all z-20 group"
        title="Drag to resize Log Detail panel"
      >
        <div className="w-[2px] h-14 bg-slate-700 group-hover:bg-emerald-300 rounded" />
      </div>

      <div className="p-4 bg-black flex items-center justify-between border-b border-slate-800 pl-6 lg:pl-8">
        <div className="flex items-center gap-2 select-none">
           <span className="text-xs font-mono font-black px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">LOG DETAIL</span>
        </div>
        <button 
          onClick={() => setSelectedResult(null)}
          className="text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      <div className="p-5 overflow-y-auto custom-scrollbar flex-1 font-mono text-xs text-slate-200 space-y-5">
         {selectedResult.simulatedIp && (
           <div className="bg-violet-955/20 p-3.5 rounded-lg border border-violet-500/30 space-y-2 animate-in fade-in zoom-in-95 duration-150 mb-4 select-text">
             <div className="text-[10px] font-black text-violet-404 uppercase tracking-widest flex items-center gap-1.5">
               <Globe size={12} /> Simulated Origin Edge Node
             </div>
             <div className="grid grid-cols-2 gap-3 text-[11px]">
               <div>
                 <span className="text-slate-500 font-bold block mb-1 text-[9px]">IP ADDRESS</span>
                 <div className="text-white font-bold select-all">{selectedResult.simulatedIp}</div>
               </div>
               <div>
                 <span className="text-slate-400 font-bold block mb-1 text-[9px]">LOCATION</span>
                 <div className="text-white font-extrabold">{selectedResult.simulatedFlag} {selectedResult.simulatedCountry}</div>
               </div>
             </div>
             <div className="text-[10px] text-slate-500 border-t border-violet-500/10 pt-2 font-bold flex items-center justify-between">
               <span>ROUTING:</span>
               <span className="text-violet-300 font-black">{selectedResult.simulatedRegion}</span>
             </div>
           </div>
         )}

        {/* Compact Telemetry Dashboard */}
        <div className="grid grid-cols-4 gap-2 bg-[#090B0E] p-2.5 rounded-lg border border-slate-800/80">
           <div className="flex flex-col justify-between py-1 px-2 border-r border-slate-800/60 last:border-0">
              <span className="text-slate-500 text-[9px] uppercase font-black tracking-wider block">Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn("text-xs font-black font-mono", selectedResult.status < 300 ? "text-emerald-400" : "text-rose-400")}>
                  {selectedResult.status}
                </span>
                {selectedResult.retriesApplied !== undefined && selectedResult.retriesApplied > 0 && (
                  <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1 rounded border border-amber-500/20" title={`${selectedResult.retriesApplied} retries applied`}>
                    R:{selectedResult.retriesApplied}
                  </span>
                )}
              </div>
           </div>
           <div className="flex flex-col justify-between py-1 px-2 border-r border-slate-800/60 last:border-0">
              <span className="text-slate-500 text-[9px] uppercase font-black tracking-wider block">Latency</span>
              <span className="text-xs font-black font-mono text-blue-400 mt-0.5">{selectedResult.responseTime}ms</span>
           </div>
           <div className="flex flex-col justify-between py-1 px-2 border-r border-slate-800/60 last:border-0">
              <span className="text-slate-500 text-[9px] uppercase font-black tracking-wider block">Req Size</span>
              <span className="text-xs font-black font-mono text-slate-300 mt-0.5">
                {selectedResult.requestSize !== undefined && selectedResult.requestSize > 0 ? (
                  selectedResult.requestSize > 1024 ? `${(selectedResult.requestSize / 1024).toFixed(1)} KB` : `${selectedResult.requestSize} B`
                ) : '0 B'}
              </span>
           </div>
           <div className="flex flex-col justify-between py-1 px-2 last:border-0">
              <span className="text-slate-500 text-[9px] uppercase font-black tracking-wider block">Res Size</span>
              <span className="text-xs font-black font-mono text-emerald-500/95 mt-0.5">
                {(() => {
                  const bodyLen = selectedResult.body ? selectedResult.body.length : 0;
                  return bodyLen > 1024 ? `${(bodyLen / 1024).toFixed(1)} KB` : `${bodyLen} B`;
                })()}
              </span>
           </div>
        </div>

        {selectedResult.status === 429 && (
          <div className="bg-rose-950/20 p-4 rounded-lg border border-rose-500/30 space-y-3.5 select-text mb-4">
            <div className="text-[10px] font-black text-rose-450 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <ShieldAlert size={14} className="text-rose-400" /> API THROTTLING DETECTION (HTTP 429)
            </div>
            <div className="text-[10.5px] text-slate-350 leading-relaxed space-y-2 font-sans select-text">
              <p>
                The target server responded with <span className="text-white font-bold select-all font-mono">Too Many Requests (429)</span>. Even though client proxy headers are randomized dynamically, the server has rejected the test requests.
              </p>
              <p className="font-bold text-rose-300">
                Why is this happening in NestJS / Express?
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[10px]">
                <li>
                  <strong className="text-slate-200">Disabled 'trust proxy':</strong> By default, Express/Fastify NestJS bootstrap models completely ignore <span className="text-slate-300 font-mono">X-Forwarded-For</span> headers unless proxy-trusting is explicitly enabled. The throttler then falls back to our physical container IP.
                </li>
                <li>
                  <strong className="text-slate-200">Upstream CDN Restrictions:</strong> Edge reverse proxies (e.g., Cloudflare, AWS CloudFront) filter out or overwrite incoming client-spoofing headers for safety before reaching your app.
                </li>
              </ul>
              <div className="bg-black/60 p-2.5 rounded border border-rose-500/15 text-[9.5px] font-mono text-amber-305 space-y-1.5 leading-snug">
                <div className="text-slate-400 font-bold select-none">// NestJS (Express) Rate Limitation Fix:</div>
                <div>
                  app.getHttpAdapter().getInstance().set(&apos;trust proxy&apos;, true);
                </div>
                <div className="text-slate-400 font-bold select-none mt-2">// NestJS (Fastify) Rate Limitation Fix:</div>
                <div>
                  {"const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ trustProxy: true }));"}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 flex-grow">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5 select-none">
            <span className="text-slate-350 text-xs uppercase tracking-wider font-extrabold block">Response</span>
             <div className="flex gap-1 bg-black/60 p-0.5 rounded border border-slate-800/80">
               <button
                 onClick={() => setPayloadTab('pretty')}
                 className={cn(
                   "px-2 py-0.5 rounded text-[10px] font-black font-mono transition-all cursor-pointer",
                   payloadTab === 'pretty'
                     ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                     : "text-slate-500 hover:text-slate-300 border border-transparent"
                 )}
               >
                 PRETTY
               </button>
               <button
                 onClick={() => setPayloadTab('raw')}
                 className={cn(
                   "px-2 py-0.5 rounded text-[10px] font-black font-mono transition-all cursor-pointer",
                   payloadTab === 'raw'
                     ? "bg-slate-800/80 text-slate-205 border border-slate-700/60"
                     : "text-slate-500 hover:text-slate-300 border border-transparent"
                 )}
               >
                 RAW
               </button>
             </div>
          </div>
          <div className="bg-black/35 p-3.5 rounded-lg border border-slate-800 text-xs text-emerald-450/90 min-h-[360px] max-h-[750px] overflow-y-auto custom-scrollbar select-text space-y-3">
            {payloadTab === 'pretty' ? (() => {
               const bodyStr = (selectedResult.body || '').trim();
               if (!bodyStr) {
                 return (
                   <div className="text-slate-500 italic text-xs">
                     Empty Response
                   </div>
                 );
               }

               // HTML or SVG/Image Previews
               const contentType = (selectedResult.headers['content-type'] || selectedResult.headers['Content-Type'] || '').toLowerCase();
               if (contentType.includes('text/html') || bodyStr.startsWith('<!DOCTYPE') || bodyStr.startsWith('<html') || bodyStr.startsWith('<div')) {
                 return (
                   <div className="space-y-2">
                     <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono uppercase bg-slate-950/40 p-1.5 border border-slate-900 rounded">
                       <span className="font-bold text-emerald-400 flex items-center gap-1">
                         <Layout size={10} /> sandboxed_html_frame
                       </span>
                     </div>
                     <iframe 
                       title="HTML Response Preview"
                       srcDoc={selectedResult.body || ''} 
                       sandbox="allow-scripts" 
                       loading="lazy"
                       className="w-full h-80 bg-white rounded-lg border border-slate-800"
                     />
                   </div>
                 );
               }

               if (contentType.includes('image/') || bodyStr.startsWith('<svg')) {
                 return (
                   <div className="space-y-2">
                     <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono uppercase bg-slate-950/40 p-1.5 border border-slate-900 rounded">
                       <span className="font-bold text-blue-400 flex items-center gap-1">
                          rendered_asset
                       </span>
                     </div>
                     <div className="flex items-center justify-center p-4 bg-slate-950/60 border border-slate-900 rounded-lg min-h-[240px]">
                       {bodyStr.startsWith('<svg') ? (
                         <div dangerouslySetInnerHTML={{ __html: selectedResult.body || '' }} className="max-w-full max-h-[300px]" />
                       ) : (
                         <img 
                           src={bodyStr.startsWith('data:') ? bodyStr : `data:${contentType};base64,${bodyStr}`} 
                           alt="Response Asset" 
                           className="max-w-full max-h-[300px] object-contain border border-slate-850 rounded" 
                           referrerPolicy="no-referrer"
                         />
                       )}
                     </div>
                   </div>
                 );
               }

               try {
                 const json = JSON.parse(bodyStr);
                 return (
                   <div className="space-y-2 select-text font-mono">
                     <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono uppercase bg-slate-950/40 p-1.5 border border-slate-900 rounded select-none">
                       <span className="font-bold text-emerald-500 flex items-center gap-1">
                         <FileJson size={10} /> Response
                       </span>
                     </div>
                     <div className="bg-slate-950/30 border border-slate-900/60 p-2.5 rounded-lg overflow-x-auto max-h-[650px] custom-scrollbar text-emerald-100/90 leading-relaxed text-xs">
                       <LabJsonInteractiveNode val={json} isLast={true} />
                     </div>
                   </div>
                 );
               } catch {
                 return (
                   <pre className="text-emerald-455/90 whitespace-pre-wrap overflow-x-hidden min-h-[140px] max-h-[650px] overflow-y-auto custom-scrollbar select-all text-xs font-mono select-text">
                     {selectedResult.body}
                   </pre>
                 );
               }
             })() : (
               <pre className="text-emerald-455/95 whitespace-pre-wrap overflow-x-hidden min-h-[140px] max-h-[650px] overflow-y-auto custom-scrollbar select-all leading-relaxed text-xs font-mono select-text">
                 {selectedResult.body || 'Empty Response.'}
               </pre>
             )}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-slate-350 text-xs uppercase tracking-wider font-extrabold block border-b border-slate-800 pb-1.5">Response Headers</span>
          <div className="bg-black p-3.5 rounded-lg border border-slate-800 space-y-2 h-40 overflow-y-auto text-xs text-slate-300 custom-scrollbar select-text">
            {Object.entries(selectedResult.headers).map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 border-b border-slate-900 pb-1.5">
                <span className="text-blue-400 font-extrabold uppercase text-[10px]">{k}:</span>
                <span className="text-slate-205 break-all pl-1 select-all">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluated Assertions Report Block in Lab Detail */}
        {(() => {
          const assertionResults = (selectedResult as any).assertions || [];
          if (assertionResults.length === 0) return null;
          const passedCount = assertionResults.filter((r: any) => r.passed).length;
          const failedCount = assertionResults.length - passedCount;
          return (
            <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <span className="text-slate-350 text-xs uppercase tracking-wider font-extrabold block border-b border-slate-800 pb-1.5 flex items-center justify-between">
                <span>Validation Assertions ({assertionResults.length})</span>
                <span className={cn(
                  "text-[9px] font-black px-2 py-0.5 rounded uppercase leading-none font-mono tracking-wider border",
                  failedCount === 0 
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" 
                    : "bg-rose-500/15 text-rose-400 border-rose-500/20 animate-pulse"
                )}>
                  {failedCount === 0 ? '✓ ALL PASSED' : `✗ ${failedCount} FAILED`}
                </span>
              </span>

              <div className="space-y-2 bg-black/40 p-3.5 rounded-lg border border-slate-850 max-h-56 overflow-y-auto custom-scrollbar">
                {assertionResults.map((assert: any, rIdx: number) => {
                  return (
                    <div 
                      key={assert.ruleId || rIdx} 
                      className={cn(
                        "p-2.5 rounded border font-mono text-[11px] mb-2 last:mb-0 space-y-1.5",
                        assert.passed 
                          ? "bg-emerald-950/10 border-emerald-950/30 text-emerald-305" 
                          : "bg-rose-955/10 border-rose-950/30 text-rose-300"
                      )}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-white text-xs">
                          {assert.type === 'status' ? 'Status Code Match' :
                           assert.type === 'latency' ? 'Max Latency SLA Check' :
                           assert.type === 'body_contains' ? 'String Check' :
                           assert.type === 'json_path' ? 'JSON Path Evaluator' :
                           assert.type === 'header_matches' ? 'Headers Matcher' :
                           'GraphQL Error Check'}
                        </span>
                        <span className={cn(
                          "text-[8px] font-black px-1.5 py-0.5 rounded tracking-wide leading-none",
                          assert.passed ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        )}>
                          {assert.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 leading-snug">
                        Expected: <span className="text-blue-400 font-extrabold">{assert.expected}</span>
                        <span className="mx-1 px-1 text-slate-650 font-black">•</span>
                        Actual: <span className={assert.passed ? "text-emerald-400 font-extrabold" : "text-rose-400 font-extrabold"}>{assert.actual === '' ? 'empty response' : assert.actual}</span>
                      </div>

                      {assert.error && (
                        <div className="text-[10px] text-rose-400/85 font-mono italic bg-black/40 px-2 py-1 rounded border border-rose-950/25 mt-1 select-text">
                          {assert.error}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
