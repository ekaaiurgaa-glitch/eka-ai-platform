
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
        <div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center font-black text-black text-xl shadow-[0_0_15px_rgba(255,102,0,0.3)]">
          G4
        </div>
        <div className="flex flex-col">
          <span className="text-white font-black tracking-tighter text-xl leading-tight uppercase">EKA-AI</span>
          <span className="text-[#FF6600] text-[9px] font-black uppercase tracking-[0.2em]">Automobile Intelligence</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {isLocked && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FF6600]/5 border border-[#FF6600]/20 rounded-full animate-in fade-in zoom-in">
            <svg className="w-3 h-3 text-[#FF6600]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
            <span className="text-[10px] text-white font-black uppercase tracking-widest">
              {vehicle.brand} {vehicle.model}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#262626] px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF6600] animate-pulse"></div>
          <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">
            Agent State: <span className="text-white">{status.replace(/_/g, ' ')}</span>
          </span>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Audit-Grade Active</span>
          <span className="text-zinc-800 text-[8px] font-mono">v1.4.2-PHASE1</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
