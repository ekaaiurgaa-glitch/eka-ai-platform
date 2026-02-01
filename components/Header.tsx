
import React from 'react';
import { JobStatus, VehicleContext, isContextComplete } from '../types';

interface HeaderProps {
  status?: JobStatus;
  vehicle?: VehicleContext;
}

const Header: React.FC<HeaderProps> = ({ status = 'CREATED', vehicle }) => {
  const isLocked = vehicle && isContextComplete(vehicle);

  return (
    <header className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-[#000000] border-b border-[#262626] sticky top-0 z-50 gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-[#f18a22] rounded-lg flex items-center justify-center font-black text-black text-xl shadow-[0_0_20px_rgba(241,138,34,0.4)]">
          G4
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-black tracking-tighter text-xl leading-tight uppercase">EKA-AI</span>
            <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[7px] font-black text-zinc-400 tracking-widest uppercase">G4G Original</span>
          </div>
          <span className="text-[#f18a22] text-[9px] font-black uppercase tracking-[0.2em]">Automobile Intelligence</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {isLocked && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f18a22]/5 border border-[#f18a22]/20 rounded-full animate-in fade-in zoom-in">
            <svg className="w-3 h-3 text-[#f18a22]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
            <span className="text-[10px] text-white font-black uppercase tracking-widest">
              {vehicle.brand} {vehicle.model}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#262626] px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f18a22] animate-pulse"></div>
          <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">
            Protocol: <span className="text-white">{status.replace(/_/g, ' ')}</span>
          </span>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">G4G Governance Engine</span>
          <span className="text-zinc-800 text-[8px] font-mono">PHASE-1.AUDIT.G4G</span>
        </div>
      </div>
    </header>
  );
};

export default Header;