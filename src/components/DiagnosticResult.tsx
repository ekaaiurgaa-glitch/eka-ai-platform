
import React from 'react';
import { DiagnosticData } from '../types';

interface DiagnosticResultProps {
  data: DiagnosticData;
}

const DiagnosticResult: React.FC<DiagnosticResultProps> = ({ data }) => {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500',
          text: 'text-red-500',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
          icon: '⚠️'
        };
      case 'MODERATE':
        return {
          bg: 'bg-[#f18a22]/10',
          border: 'border-[#f18a22]',
          text: 'text-[#f18a22]',
          glow: 'shadow-[0_0_20px_rgba(241,138,34,0.3)]',
          icon: '🔧'
        };
      default:
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500',
          text: 'text-blue-500',
          glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
          icon: 'ℹ️'
        };
    }
  };

  const style = getSeverityStyle(data.severity);

  return (
    <div className={`mt-6 rounded-xl border-2 ${style.border} ${style.bg} ${style.glow} overflow-hidden animate-in zoom-in-95 duration-500`}>
      <div className={`px-6 py-4 border-b-2 ${style.border} flex justify-between items-center bg-black/40`}>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">DTC Logic Analysis</span>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-black font-mono tracking-widest ${style.text}`}>{data.code}</span>
            <span className={`px-3 py-0.5 rounded text-[9px] font-black uppercase font-mono border ${style.border} ${style.text}`}>
              {data.severity}
            </span>
          </div>
        </div>
        <span className="text-3xl">{style.icon}</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono block mb-2">Technical Definition</span>
          <p className="text-white font-mono text-[14px] font-bold leading-relaxed">{data.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono block mb-1">Causality Mapping</span>
            <ul className="space-y-2">
              {data.possible_causes.map((cause, i) => (
                <li key={i} className="flex items-start gap-2 text-zinc-300 text-[12px] font-mono">
                  <span className={`${style.text} mt-1`}>•</span>
                  {cause}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono block mb-1">Recommended Remediation</span>
            <ul className="space-y-2">
              {data.recommended_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-zinc-300 text-[12px] font-mono">
                  <span className="text-green-500 mt-1">✓</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {data.systems_affected && data.systems_affected.length > 0 && (
          <div className="pt-4 border-t border-white/5">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest font-mono block mb-2">Node Systems Affected</span>
            <div className="flex flex-wrap gap-2">
              {data.systems_affected.map((system, i) => (
                <span key={i} className="px-2 py-1 bg-black/60 rounded border border-white/10 text-[10px] font-mono text-zinc-500 uppercase">
                  {system}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticResult;
