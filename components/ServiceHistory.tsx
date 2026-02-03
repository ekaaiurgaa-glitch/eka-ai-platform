
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
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] font-mono">Dossier: Service Records</label>
          <span className="text-[12px] font-bold text-white uppercase font-mono">{regNo}</span>
        </div>
        <div className="flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${hasHistory ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-zinc-700'}`}></div>
           <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{hasHistory ? 'Records Found' : 'No History'}</span>
        </div>
      </div>

      <div className={`rounded-xl border ${hasHistory ? 'bg-[#080808] border-zinc-800' : 'bg-transparent border-dashed border-zinc-900 p-8 text-center'}`}>
        {!hasHistory ? (
          <div className="flex flex-col items-center gap-2 opacity-40">
            <svg className="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">No Previous Architecture Found</span>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {history.map((item, idx) => (
              <div key={idx} className="p-4 flex gap-4 hover:bg-zinc-900/40 transition-colors group">
                <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-[#f18a22] group-hover:bg-[#f18a22] transition-colors shadow-[0_0_5px_rgba(241,138,34,0.3)]"></div>
                  {idx < history.length - 1 && <div className="w-[1px] flex-1 bg-zinc-800"></div>}
                </div>
                <div className="flex-1 flex flex-col gap-1.5 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#f18a22] uppercase tracking-tighter font-mono">{item.service_type}</span>
                    <span className="text-[9px] font-bold text-zinc-600 font-mono">{item.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-white font-mono tracking-tight">{item.odometer} KM</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed italic line-clamp-1 group-hover:line-clamp-none transition-all">
                      {item.notes}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
