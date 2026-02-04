
import React from 'react';
import { JobStatus, VehicleContext, isContextComplete, OperatingMode } from '../types';

interface HeaderProps {
  status: JobStatus;
  vehicle: VehicleContext;
  isLoading?: boolean;
  operatingMode: OperatingMode;
}

const getStatusConfig = (status: JobStatus, isLoading: boolean, mode: OperatingMode, vehicle: VehicleContext) => {
  if (isLoading) return { label: 'VERIFYING...', dotClass: 'bg-[#FFEA00] animate-pulse' };
  
  const isIdentified = !!vehicle.registrationNumber;
  if (mode === 1) {
    if (!isIdentified) return { label: 'AWAITING_ID', dotClass: 'bg-[#f18a22] animate-pulse' };
    return { label: 'PROTOCOL: ACTIVE', dotClass: 'bg-[#22c55e]' };
  }
  
  if (mode === 2) {
    if (!isIdentified) return { label: 'FLEET_AWAITING', dotClass: 'bg-[#f18a22] animate-pulse' };
    return { label: 'FLEET: SYNC_ACTIVE', dotClass: 'bg-[#22c55e]' };
  }

  const isComplete = isContextComplete(vehicle);
  return { 
    label: isComplete ? 'SYSTEM: READY' : 'SYSTEM: AUTH', 
    dotClass: isComplete ? 'bg-[#22c55e]' : 'bg-zinc-700' 
  };
};

const Header: React.FC<HeaderProps> = ({ status, vehicle, isLoading = false, operatingMode }) => {
  const isLocked = vehicle && isContextComplete(vehicle);
  const config = getStatusConfig(status, isLoading, operatingMode, vehicle);

  return (
    <header className="flex flex-col md:flex-row items-center justify-between px-8 py-5 bg-[#000000] sticky top-0 z-50 gap-4" style={{ borderBottom: '1px solid rgba(241, 138, 34, 0.25)' }}>
      <div className="flex items-center gap-4 shrink-0">
        <div className="w-12 h-12 bg-[#f18a22] rounded-xl flex items-center justify-center font-black text-black text-2xl shadow-[0_0_20px_rgba(241,138,34,0.4)] font-outfit">
          G4
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-white font-black tracking-tighter text-3xl leading-tight uppercase font-outfit">EKA-AI</h1>
            <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[8px] font-black text-zinc-400 tracking-widest uppercase font-mono">G4G ORIGINAL</span>
          </div>
          <span className="text-[#f18a22] text-[11px] font-bold uppercase tracking-[0.1em] font-outfit">Governed Automobile Intelligence · Go4Garage Private Limited</span>
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        {isLocked && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-[#f18a22]/5 border border-[#f18a22]/20 rounded-full">
            <span className="text-[11px] text-white font-black uppercase tracking-widest font-outfit">
              {vehicle.brand} {vehicle.model}
            </span>
            <div className="w-[1px] h-3 bg-zinc-800"></div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono">{vehicle.registrationNumber}</span>
          </div>
        )}

        <div className="flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full transition-all duration-300">
          <div className={`w-2.5 h-2.5 rounded-full ${config.dotClass}`}></div>
          <span className="text-[11px] text-zinc-400 font-black uppercase tracking-widest font-mono">
            {config.label}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
