import React from 'react';

interface JsonPrettyProps {
  data: any;
  level?: number;
}

export function JsonPretty({ data, level = 0 }: JsonPrettyProps) {
  if (data === null) return <span className="text-slate-500 font-bold italic">null</span>;
  if (typeof data === 'string') return <span className="text-emerald-400 break-all">"{data}"</span>;
  if (typeof data === 'number') return <span className="text-amber-400 font-bold">{data}</span>;
  if (typeof data === 'boolean') return <span className="text-blue-400 font-black">{data.toString()}</span>;
  
  const indent = "  ".repeat(level);
  const nextIndent = "  ".repeat(level + 1);

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-600">[]</span>;
    return (
      <div className="font-mono">
        <span className="text-slate-500">[</span>
        <div className="ml-4">
          {data.map((item, i) => (
            <div key={i} className="py-0.5">
              <JsonPretty data={item} level={level + 1} />{i < data.length - 1 ? <span className="text-slate-600">,</span> : ''}
            </div>
          ))}
        </div>
        <span className="text-slate-500">]</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data);
    if (entries.length === 0) return <span className="text-slate-600">{"{}"}</span>;
    return (
      <div className="font-mono">
        <span className="text-slate-500">{"{"}</span>
        <div className="ml-4">
          {entries.map(([key, value], i) => (
            <div key={key} className="py-0.5 flex gap-2">
              <span className="text-blue-400 shrink-0">"{key}"</span>
              <span className="text-slate-600">:</span>
              <div className="flex-1 min-w-0">
                <JsonPretty data={value} level={level + 1} />{i < entries.length - 1 ? <span className="text-slate-600">,</span> : ''}
              </div>
            </div>
          ))}
        </div>
        <span className="text-slate-500">{"}"}</span>
      </div>
    );
  }
  return <span>{String(data)}</span>;
}
