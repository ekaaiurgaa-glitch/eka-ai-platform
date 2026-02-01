
import React from 'react';
import { JobStatus } from '../types';

interface HeaderProps {
  status?: JobStatus;
}

const Header: React.FC<HeaderProps> = ({ status = 'CREATED' }) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[#000000] border-b border-[#262626] sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FF6600] rounded-md flex items-center justify-center font-bold text-black text-xl">
          G4
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold tracking-tighter text-lg leading-tight uppercase">EKA-AI</span>
          <span className="text-[#FF6600] text-[10px] font-semibold uppercase tracking-widest">Intelligence Agent</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#262626] px-3 py-1.5 rounded-full">
        <div className="w-2 h-2 rounded-full bg-[#FF6600] animate-pulse"></div>
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
          State: <span className="text-white">{status.replace(/_/g, ' ')}</span>
        </span>
      </div>

      <div className="hidden md:flex items-center gap-2">
        <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">Audit-Grade Active</span>
      </div>
    </header>
  );
};

export default Header;
