
import React from 'react';
import { ServiceHistoryItem } from '../types';

interface ServiceHistoryProps {
  history?: ServiceHistoryItem[];
  regNo: string;
}

const ServiceHistory: React.FC<ServiceHistoryProps> = ({ history, regNo }) => {
  const hasHistory = history && history.length > 0;

  return (
    <div className="service-history-container mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex flex-col">
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono">Registry: Service Archive</label>
          <span className="text-[14px] font-black text-white uppercase font-mono tracking-widest">{regNo}</span>
        </div>
        <div className="flex items-center gap-3">
           <div className={`w-3 h-3 rounded-full ${hasHistory ? 'bg-green-500 shadow-[0_0_12px_#22c55e]' : 'bg-zinc-900'}`}></div>
           <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono">{hasHistory ? 'Archive Synchronized' : 'No Data'}</span>
        </div>
      </div>

      <div className={`flex flex-col gap-4 ${!hasHistory ? 'rounded-xl border-4 border-dashed border-zinc-900 p-12 text-center' : ''}`}>
        {!hasHistory ? (
          <div className="flex flex-col items-center gap-4 opacity-30">
            <svg className="w-12 h-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-[12px] font-black text-zinc-600 uppercase tracking-[0.3em] font-mono">Historical Record Vacant</span>
          </div>
        ) : (
          history.map((item, idx) => (
            <div key={idx} className="bg-[#0A0A0A] border-4 border-[#f18a22] rounded-xl p-4 flex flex-col gap-4 group hover:shadow-[0_0_20px_rgba(241,138,34,0.15)] transition-all">
              <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-2">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-zinc-500 uppercase font-mono leading-none">Protocol Type</span>
                  <span className="text-[12px] font-black text-[#f18a22] uppercase font-mono tracking-tighter">{item.service_type}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-zinc-500 uppercase font-mono leading-none">Timeline</span>
                  <span className="text-[12px] font-bold text-white font-mono tracking-tight">{item.date}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 p-2 bg-black rounded-lg border-2 border-zinc-900">
                  <span className="text-[8px] font-black text-zinc-500 uppercase font-mono leading-none">Odometer Reading</span>
                  <span className="text-[13px] font-black text-white font-mono">{item.odometer} KM</span>
                </div>
                <div className="flex flex-col gap-1 p-2 bg-black rounded-lg border-2 border-zinc-900 flex-1">
                  <span className="text-[8px] font-black text-zinc-500 uppercase font-mono leading-none">Architectural Notes</span>
                  <p className="text-[11px] text-zinc-400 font-medium font-mono leading-tight italic truncate group-hover:whitespace-normal">
                    {item.notes}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .service-history-container {
          position: relative;
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export default ServiceHistory;
