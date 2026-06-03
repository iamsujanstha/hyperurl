import React, { useState } from 'react';

interface LabJsonInteractiveNodeProps {
  label?: string;
  val: any;
  isLast?: boolean;
  key?: any;
}

export function LabJsonInteractiveNode({ label, val, isLast = true }: LabJsonInteractiveNodeProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(label !== undefined);

  if (val === null) {
    return (
      <div className="pl-4 py-0.5 select-text font-mono text-[11px] leading-relaxed">
        {label && <span className="text-blue-400 font-bold">"{label}"</span>}
        {label && <span className="text-slate-505 mx-1">:</span>}
        <span className="text-slate-500 font-semibold italic">null</span>
        {!isLast && <span className="text-slate-500">,</span>}
      </div>
    );
  }

  const type = typeof val;

  if (type === 'string') {
    return (
      <div className="pl-4 py-0.5 select-text font-mono text-[11px] break-all leading-relaxed">
        {label && <span className="text-blue-400 font-bold">"{label}"</span>}
        {label && <span className="text-slate-550 mx-1">:</span>}
        <span className="text-emerald-400">"{val}"</span>
        {!isLast && <span className="text-slate-500">,</span>}
      </div>
    );
  }

  if (type === 'number') {
    return (
      <div className="pl-4 py-0.5 select-text font-mono text-[11px] leading-relaxed font-semibold">
        {label && <span className="text-blue-400 font-bold">"{label}"</span>}
        {label && <span className="text-slate-500 mr-1">:</span>}
        <span className="text-amber-500">{val}</span>
        {!isLast && <span className="text-slate-500">,</span>}
      </div>
    );
  }

  if (type === 'boolean') {
    return (
      <div className="pl-4 py-0.5 select-text font-mono text-[11px] leading-relaxed font-bold">
        {label && <span className="text-blue-400 font-bold">"{label}"</span>}
        {label && <span className="text-slate-500 mr-1">:</span>}
        <span className="text-violet-400">{val.toString()}</span>
        {!isLast && <span className="text-slate-500">,</span>}
      </div>
    );
  }

  if (Array.isArray(val)) {
    const itemsCount = val.length;
    const itemsText = itemsCount === 1 ? '1 item' : `${itemsCount} items`;

    if (itemsCount === 0) {
      return (
        <div className="pl-4 py-0.5 font-mono text-[11px] leading-relaxed">
          {label && <span className="text-blue-400 font-bold">"{label}"</span>}
          {label && <span className="text-slate-500 mr-1">:</span>}
          <span className="text-slate-600">[]</span>
          {!isLast && <span className="text-slate-500">,</span>}
        </div>
      );
    }

    return (
      <div className="pl-4 py-0.5 font-mono text-[11px] leading-relaxed">
        <div 
          className="flex items-center gap-1 cursor-pointer select-none hover:bg-slate-800/10 dark:hover:bg-slate-800/25 rounded px-1 -ml-1 transition-colors py-0.5" 
          onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
        >
          <span className="text-slate-505 text-[9px] font-sans w-3 text-center inline-block">
            {collapsed ? '▶' : '▼'}
          </span>
          {label && <span className="text-blue-400 font-bold">"{label}"</span>}
          {label && <span className="text-slate-525 mr-1">:</span>}
          {collapsed ? (
            <span className="text-slate-400">
              {"[...]"} <span className="text-slate-500 text-[10px] italic font-sans pl-1">{itemsText}</span>
            </span>
          ) : (
            <span className="text-slate-300">
              {"["} <span className="text-slate-500 text-[10px] italic font-sans pl-1">{itemsText}</span>
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="border-l border-slate-800/40 ml-1 pl-3 transition-all space-y-0.5">
            {val.map((item, idx) => (
              <LabJsonInteractiveNode key={idx} val={item} isLast={idx === itemsCount - 1} />
            ))}
          </div>
        )}
        {!collapsed && (
          <div className="text-slate-500 pl-4 py-0.5">
            {"]"}
            {!isLast && ","}
          </div>
        )}
      </div>
    );
  }

  if (type === 'object') {
    const keys = Object.keys(val);
    const itemsCount = keys.length;
    const itemsText = itemsCount === 1 ? '1 item' : `${itemsCount} items`;

    if (itemsCount === 0) {
      return (
        <div className="pl-4 py-0.5 font-mono text-[11px] leading-relaxed">
          {label && <span className="text-blue-400 font-bold">"{label}"</span>}
          {label && <span className="text-slate-505 mr-1">:</span>}
          <span className="text-slate-600">{"{}"}</span>
          {!isLast && <span className="text-slate-505">,</span>}
        </div>
      );
    }

    return (
      <div className="pl-4 py-0.5 font-mono text-[11px] leading-relaxed">
        <div 
          className="flex items-center gap-1 cursor-pointer select-none hover:bg-slate-800/10 dark:hover:bg-slate-800/25 rounded px-1 -ml-1 transition-colors py-0.5" 
          onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
        >
          <span className="text-slate-505 text-[9px] font-sans w-3 text-center inline-block">
            {collapsed ? '▶' : '▼'}
          </span>
          {label && <span className="text-blue-400 font-bold">"{label}"</span>}
          {label && <span className="text-slate-505 mr-1">:</span>}
          {collapsed ? (
            <span className="text-slate-400">
              {"{...}"} <span className="text-slate-500 text-[10px] italic font-sans pl-1">{itemsText}</span>
            </span>
          ) : (
            <span className="text-slate-300">
              {"{"} <span className="text-slate-500 text-[10px] italic font-sans pl-1">{itemsText}</span>
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="border-l border-slate-800/40 ml-1 pl-3 transition-all space-y-0.5">
            {keys.map((k, idx) => (
              <LabJsonInteractiveNode key={k} label={k} val={val[k]} isLast={idx === itemsCount - 1} />
            ))}
          </div>
        )}
        {!collapsed && (
          <div className="text-slate-500 pl-4 py-0.5">
            {"}"}
            {!isLast && ","}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pl-4 py-0.5 font-mono text-[11px] leading-relaxed">
      {label && <span className="text-blue-400 font-bold">"{label}"</span>}
      {label && <span className="text-slate-505 mr-1">:</span>}
      <span className="text-slate-400">{String(val)}</span>
      {!isLast && <span className="text-slate-505">,</span>}
    </div>
  );
}
