
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[#000000] border-b border-[#262626] sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FF6600] rounded-md flex items-center justify-center font-bold text-black text-xl">
          G4
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold tracking-tighter text-lg leading-tight">EKA-AI</span>
          <span className="text-[#FF6600] text-[10px] font-semibold uppercase tracking-widest">By Go4Garage</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden md:block text-[#737373] text-xs font-medium uppercase tracking-widest">Phase-1 Live</span>
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
      </div>
    </header>
  );
};

export default Header;
