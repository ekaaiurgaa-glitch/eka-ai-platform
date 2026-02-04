
import React from 'react';
import { JobStatus, VehicleContext, isContextComplete, OperatingMode } from '../types';

interface HeaderProps {
  status: JobStatus;
  vehicle: VehicleContext;
  isLoading?: boolean;
  operatingMode: OperatingMode;
}

const FUEL_ICONS: Record<string, string> = {
  Petrol: "M19 16V8m0 0a2 2 0 10-4 0v8m4-8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2v-3M13 11l-4-4m0 4l4-4",
  Diesel: "M19 16V8m0 0a2 2 0 10-4 0v8m4-8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2v-3M9 11h4",
  Electric: "M13 10V3L4 14h7v7l9-11h-7z",
  CNG: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9",
  Hybrid: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
};

interface StatusConfig {
  label: string;
  dotClass: string;
}

const getStatusConfig = (status: JobStatus, isLoading: boolean, mode: OperatingMode, isIdentified: boolean): StatusConfig => {
  if (isLoading) {
    return { label: 'STATUS: VERIFYING...', dotClass: 'bg-[#FFEA00] animate-flicker shadow-[0_0_8px_#FFEA00]' };
  }

  // Workshop Mode Logic
  if (mode === 1) {
    if (!isIdentified) {
      return { 
        label: 'STATUS: AWAITING_ID', 
        dotClass: 'bg-[#f18a22] animate-pulse shadow-[0_0_10px_rgba(241,138,34,0.5)]' 
      };
    }
    return { 
      label: 'PROTOCOL: ACTIVE', 
      dotClass: 'bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.4)]' 
    };
  }

  // Fleet Mode Logic
  if (mode === 2) {
    if (!isIdentified) {
      return { 
        label: 'FLEET: AWAITING_ID', 
        dotClass: 'bg-[#f18a22] animate-pulse shadow-[0_0_10px_rgba(241,138,34,0.5)]' 
      };
    }
    return { 
      label: 'FLEET: SYNC_ACTIVE', 
      dotClass: 'bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.4)]' 
    };
  }

  // Ignition Mode (0) Logic
  if (status === 'RSA_ACTIVE') {
    return { 
      label: 'STATUS: RSA_ACTIVE', 
      dotClass: 'bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]' 
    };
  }
  
  if (status === 'IGNITION_TRIAGE') {
    return { 
      label: 'IGNITION: TRIAGE', 
      dotClass: 'bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.5)]' 
    };
  }

  if (status === 'CLOSED' || status === 'MG_COMPLETE') {
    return { label: 'PROTOCOL: COMPLETE', dotClass: 'bg-blue-500 shadow-[0_0_8px_#3B82F6]' };
  }

  return { 
    label: isIdentified ? 'SYSTEM: READY' : 'SYSTEM: AWAITING_AUTH', 
    dotClass: isIdentified ? 'bg-[#22c55e] shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-zinc-600' 
  };
};

const Header: React.FC<HeaderProps> = ({ status, vehicle, isLoading = false, operatingMode }) => {
  const isLocked = vehicle && isContextComplete(vehicle);
  const config = getStatusConfig(status, isLoading, operatingMode, !!isLocked);

  const renderFuelIcon = () => {
    if (!vehicle?.fuelType || !FUEL_ICONS[vehicle.fuelType]) return null;
    return (
      <svg className="w-3 h-3 text-[#f18a22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={FUEL_ICONS[vehicle.fuelType]} />
      </svg>
    );
  };

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
          <div className="flex items-center gap-3 px-4 py-2 bg-[#f18a22]/5 border border-[#f18a22]/20 rounded-full animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-1.5">
               {renderFuelIcon()}
               <span className="text-[10px] text-white font-black uppercase tracking-widest">
                {vehicle.brand} {vehicle.model}
              </span>
            </div>
            <div className="w-[1px] h-3 bg-zinc-800"></div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase">{vehicle.year}</span>
          </div>
        )}

        <div className="flex items-center gap-2.5 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full transition-all duration-300 shadow-sm group hover:border-[#f18a22]/30">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${config.dotClass}`}></div>
          <span className="text-[10px] text-zinc-400 font-black uppercase tracking-[1px] font-mono group-hover:text-white transition-colors">
            {config.label}
          </span>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">G4G Governance Engine</span>
          <span className="text-zinc-800 text-[8px] font-mono">PHASE-1.AUDIT.G4G</span>
        </div>
      </div>
      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; filter: brightness(1.2); }
          50% { opacity: 0.3; filter: brightness(0.8); }
        }
        .animate-flicker {
          animation: flicker 0.6s infinite linear;
        }
      `}</style>
    </header>
  );
};

export default Header;
