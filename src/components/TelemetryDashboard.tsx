
import React from 'react';
import { JobStatus } from '../types';

interface TelemetryDashboardProps {
  status: JobStatus;
  complianceScore: number;
  systemHealth: number;
}

const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({ status, complianceScore, systemHealth }) => {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6 animate-in slide-in-from-top-4 duration-500">
      <div className="bg-[#050505] border-2 border-zinc-900 rounded-xl p-4 flex flex-col gap-2 group hover:border-[#f18a22]/40 transition-all">
        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest font-mono">Status Node</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f18a22] animate-pulse"></div>
          <span className="text-[10px] font-black text-white font-mono truncate uppercase">{status}</span>
        </div>
      </div>

      <div className="bg-[#050505] border-2 border-zinc-900 rounded-xl p-4 flex flex-col gap-2 group hover:border-green-500/40 transition-all">
        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest font-mono">Compliance</span>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-black text-green-500 font-mono">{complianceScore}%</span>
          <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${complianceScore}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-[#050505] border-2 border-zinc-900 rounded-xl p-4 flex flex-col gap-2 group hover:border-blue-500/40 transition-all">
        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest font-mono">Sys Health</span>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-black text-blue-500 font-mono">{systemHealth}%</span>
          <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" style={{ width: `${systemHealth}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryDashboard;
