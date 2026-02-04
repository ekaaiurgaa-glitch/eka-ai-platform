
import React from 'react';
import { RecallData } from '../types';

interface RecallReportProps {
  data: RecallData;
}

const RecallReport: React.FC<RecallReportProps> = ({ data }) => {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      case 'MEDIUM': return 'bg-[#f18a22]/10 border-[#f18a22] text-[#f18a22] shadow-[0_0_15px_rgba(241,138,34,0.2)]';
      case 'LOW': return 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
      default: return 'bg-zinc-900 border-zinc-800 text-zinc-500';
    }
  };

  return (
    <div className="mt-6 space-y-8 animate-in fade-in zoom-in-95 duration-700">
      {/* RECALL SECTION */}
      <div className="bg-[#050505] border-4 border-[#f18a22] rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-zinc-900/50 border-b-2 border-[#f18a22]/20 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-1">Safety Recall Registry</span>
            <span className="text-[14px] font-black text-white font-mono uppercase">Official Manufacturer Advisories</span>
          </div>
          <span className="text-2xl">🛡️</span>
        </div>

        <div className="p-6 space-y-4">
          {data.recalls.length === 0 ? (
            <div className="py-8 text-center bg-zinc-900/10 rounded-lg border-2 border-dashed border-zinc-900">
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest font-mono">No Active Recalls Detected For This Node</span>
            </div>
          ) : (
            data.recalls.map((recall, i) => (
              <div key={i} className={`p-5 rounded-xl border-2 ${getSeverityStyle(recall.severity)}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black uppercase font-mono tracking-tight">{recall.title}</span>
                    <span className="text-[8px] font-bold opacity-60 uppercase font-mono tracking-widest">{recall.id} • {recall.date}</span>
                  </div>
                  <span className="text-[9px] font-black border-2 border-current px-2 py-0.5 rounded uppercase font-mono">{recall.severity}</span>
                </div>
                <p className="text-[11px] font-mono leading-relaxed mb-4 opacity-90">{recall.description}</p>
                <div className="bg-black/40 p-3 rounded border border-current/20">
                  <span className="text-[8px] font-black uppercase font-mono block mb-1">Required Remedy</span>
                  <p className="text-[10px] font-bold font-mono">{recall.remedy}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COMMON ISSUES SECTION */}
      <div className="bg-[#050505] border-4 border-blue-500/40 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-zinc-900/50 border-b-2 border-blue-500/20 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-1">Technical Vulnerability Map</span>
            <span className="text-[14px] font-black text-white font-mono uppercase">Reported Common Mechanical Failures</span>
          </div>
          <span className="text-2xl">⚙️</span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.common_issues.map((issue, i) => (
            <div key={i} className="p-4 bg-zinc-900/30 border-2 border-zinc-800 rounded-xl hover:border-blue-500/50 transition-all group">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-black text-white uppercase font-mono">{issue.component}</span>
                <span className="text-[8px] font-black text-blue-400 uppercase font-mono tracking-widest">{issue.prevalence}</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono leading-tight mb-3 group-hover:text-zinc-200">{issue.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {issue.symptoms.map((sym, j) => (
                  <span key={j} className="text-[7px] font-black bg-blue-500/5 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase font-mono">{sym}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecallReport;
