
import React, { useState, useEffect } from 'react';
import { VehicleContext, isContextComplete } from '../types';

interface VehicleContextPanelProps {
  context: VehicleContext;
  onUpdate: (updated: VehicleContext) => void;
  onScanRecalls?: () => void;
}

const DATA_STORE = {
  brands_4w: ["Maruti Suzuki", "Hyundai", "Tata Motors", "Mahindra", "Toyota", "Honda", "Kia", "MG", "Volkswagen", "Skoda", "Renault", "Jeep", "Nissan", "Audi", "BMW", "Mercedes-Benz"],
  brands_2w: ["Hero MotoCorp", "Honda", "TVS", "Bajaj", "Royal Enfield", "Yamaha", "Suzuki", "KTM", "Ather", "Ola Electric", "Jawa", "Yezdi"],
  models_common: ["Swift", "Creta", "Nexon", "Scorpio", "City", "Innova", "Seltos", "Hector", "Polo", "Splendor", "Activa", "Pulsar", "Classic 350", "Jupiter", "FZs"],
  fuelOptions: [
    { id: "Petrol", label: "Petrol", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "M19 16V8m0 0a2 2 0 10-4 0v8m4-8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2v-3M13 11l-4-4m0 4l4-4" },
    { id: "Diesel", label: "Diesel", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30", icon: "M19 16V8m0 0a2 2 0 10-4 0v8m4-8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2v-3M9 11h4" },
    { id: "Electric", label: "Electric", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { id: "CNG", label: "CNG", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" },
    { id: "Hybrid", label: "Hybrid", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }
  ],
  years: Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString()) 
};

const VehicleContextPanel: React.FC<VehicleContextPanelProps> = ({ context, onUpdate, onScanRecalls }) => {
  const [isEditing, setIsEditing] = useState(!isContextComplete(context));
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    setBrandSuggestions(context.vehicleType === '2W' ? DATA_STORE.brands_2w : DATA_STORE.brands_4w);
  }, [context.vehicleType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onUpdate({ ...context, [name]: value });
  };

  const handleFuelSelect = (id: string) => {
    onUpdate({ ...context, fuelType: id });
  };

  const handleTypeSelect = (type: '2W' | '4W') => {
    onUpdate({ ...context, vehicleType: type, brand: '', model: '' });
  };

  const handleLockIdentity = () => {
    setIsSyncing(true);
    setSyncProgress(0);
    
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSyncing(false);
            setIsEditing(false);
          }, 600);
          return 100;
        }
        return prev + Math.floor(Math.random() * 8) + 2;
      });
    }, 50);
  };

  const getFuelIcon = (fuelId: string, customClass = "w-4 h-4") => {
    const fuel = DATA_STORE.fuelOptions.find(f => f.id === fuelId);
    if (!fuel) return null;
    return (
      <svg className={`${customClass} ${fuel.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={fuel.icon} />
      </svg>
    );
  };

  if (isSyncing) {
    return (
      <div className="mx-4 mb-8 p-12 bg-[#0A0A0A] border-2 border-[#f18a22]/30 rounded-3xl flex flex-col items-center justify-center gap-8 animate-in fade-in zoom-in duration-500 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#f18a22] to-transparent animate-scan-x"></div>
        <div className="relative w-32 h-32">
          <svg className="w-full h-full text-[#f18a22]/20" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
          <svg className="absolute inset-0 w-full h-full text-[#f18a22] animate-spin-slow" viewBox="0 0 100 100" style={{ transformOrigin: 'center' }}>
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="30 250" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="text-white font-black text-2xl tracking-tighter">{syncProgress}%</span>
             <span className="text-[8px] font-black text-[#f18a22] uppercase tracking-widest mt-1">Synced</span>
          </div>
        </div>
        <div className="text-center">
          <h4 className="text-[#f18a22] font-black text-base uppercase tracking-[0.4em] mb-2 animate-pulse">Syncing Digital Twin</h4>
          <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.3em]">Constructing G4G Unified Governance Dossier</p>
        </div>
        <div className="w-full max-w-sm h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-gradient-to-r from-[#f18a22] to-orange-400 transition-all duration-100 shadow-[0_0_15px_#f18a22]" style={{ width: `${syncProgress}%` }}></div>
        </div>
      </div>
    );
  }

  if (!isEditing && isContextComplete(context)) {
    return (
      <div className="mx-4 mb-8 animate-in slide-in-from-top-4 duration-700">
        <div className="relative group overflow-hidden p-[1px] rounded-[32px] bg-gradient-to-br from-zinc-800 to-black hover:from-[#f18a22]/40 hover:to-green-500/40 transition-all duration-700 shadow-2xl">
          <div className="bg-[#050505] rounded-[31px] p-8 flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 blur-[100px] rounded-full pointer-events-none -mr-48 -mt-48"></div>
            
            <div className="flex flex-col sm:flex-row items-center gap-10 w-full lg:w-auto">
              <div className="relative shrink-0">
                <div className="absolute -inset-6 bg-green-500/10 rounded-full blur-2xl animate-pulse"></div>
                <div className="w-28 h-28 bg-black border-2 border-green-500/40 shadow-[0_0_40px_rgba(34,197,94,0.1)] rounded-[32px] flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-700">
                   {context.vehicleType === '2W' ? (
                      <svg className="w-14 h-14 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" /></svg>
                   ) : (
                      <svg className="w-14 h-14 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent h-full w-full animate-scan-y"></div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-4 border-black bg-green-500 flex items-center justify-center shadow-xl">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>

              <div className="flex flex-col text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                  <div className="px-3 py-1 bg-green-500 text-black text-[9px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(34,197,94,0.4)]">Digital Twin Synchronized</div>
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">ID: #G4G-{context.brand.slice(0,3).toUpperCase()}-{Math.floor(Math.random()*9000)+1000}</span>
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-4 group-hover:text-[#f18a22] transition-colors">
                  <span className="text-zinc-700">{context.year}</span> {context.brand} <span className="text-zinc-500">{context.model}</span>
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-xs font-bold text-zinc-300 uppercase tracking-wide">
                    {getFuelIcon(context.fuelType, "w-5 h-5")}
                    <span>{context.fuelType} Engine</span>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-xs font-bold text-zinc-300 uppercase tracking-wide">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <span>G4G Governance Locked</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto">
              <button onClick={onScanRecalls} className="w-full sm:w-auto px-12 py-6 bg-green-600 text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-green-500 hover:shadow-[0_15px_40px_rgba(34,197,94,0.3)] transition-all active:scale-95 flex items-center justify-center gap-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Safety Triage
              </button>
              <button onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-10 py-6 bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-black uppercase tracking-widest rounded-2xl hover:border-[#f18a22] hover:text-white transition-all active:scale-95">Re-Architect Identity</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-8 p-12 bg-[#0A0A0A] border-2 border-[#f18a22]/15 rounded-[48px] shadow-3xl relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#f18a22]/5 blur-[150px] rounded-full pointer-events-none"></div>
      
      <div className="flex items-center gap-6 mb-12">
        <div className="w-3 h-12 bg-[#f18a22] shadow-[0_0_20px_rgba(241,138,34,0.5)] rounded-full animate-pulse"></div>
        <div className="flex flex-col">
          <h3 className="text-2xl font-black text-white uppercase tracking-[0.5em]">Architect Vehicle Dossier</h3>
          <p className="text-[12px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-1">EKA-Ai Central Governance Initialization</p>
        </div>
      </div>

      <div className="mb-14">
         <label className="text-[13px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-2 mb-8 block">01. Architectural Class</label>
         <div className="flex flex-col sm:flex-row gap-8">
            <button onClick={() => handleTypeSelect('2W')} className={`flex-1 py-10 rounded-[40px] border-2 flex flex-col items-center gap-6 transition-all active:scale-[0.97] group ${context.vehicleType === '2W' ? 'bg-[#f18a22] border-[#f18a22] text-black shadow-3xl scale-[1.02]' : 'bg-[#050505] border-[#262626] text-zinc-700 hover:border-[#f18a22]/40'}`}>
               <svg className={`w-16 h-16 transition-all duration-700 group-hover:scale-110 ${context.vehicleType === '2W' ? 'text-black' : 'text-zinc-800'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" /></svg>
               <span className="text-[14px] uppercase font-black tracking-[0.35em]">2-Wheeler Fleet</span>
            </button>
            <button onClick={() => handleTypeSelect('4W')} className={`flex-1 py-10 rounded-[40px] border-2 flex flex-col items-center gap-6 transition-all active:scale-[0.97] group ${context.vehicleType === '4W' ? 'bg-[#f18a22] border-[#f18a22] text-black shadow-3xl scale-[1.02]' : 'bg-[#050505] border-[#262626] text-zinc-700 hover:border-[#f18a22]/40'}`}>
               <svg className={`w-16 h-16 transition-all duration-700 group-hover:scale-110 ${context.vehicleType === '4W' ? 'text-black' : 'text-zinc-800'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/></svg>
               <span className="text-[14px] uppercase font-black tracking-[0.35em]">4-Wheeler Fleet</span>
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-14">
        <div className="flex flex-col gap-4">
          <label className="text-[12px] font-black text-zinc-600 uppercase tracking-widest ml-2">Manufacturer Brand</label>
          <input name="brand" list="brand-list" value={context.brand} onChange={handleChange} placeholder="e.g. Maruti Suzuki" className="bg-[#050505] border-2 border-zinc-900 rounded-[24px] px-8 py-6 text-base text-white focus:outline-none focus:border-[#f18a22] transition-all placeholder:text-zinc-800 font-bold" />
          <datalist id="brand-list">{brandSuggestions.map(b => <option key={b} value={b} />)}</datalist>
        </div>
        <div className="flex flex-col gap-4">
          <label className="text-[12px] font-black text-zinc-600 uppercase tracking-widest ml-2">Series / Model</label>
          <input name="model" list="model-list" value={context.model} onChange={handleChange} placeholder="e.g. Swift" className="bg-[#050505] border-2 border-zinc-900 rounded-[24px] px-8 py-6 text-base text-white focus:outline-none focus:border-[#f18a22] transition-all placeholder:text-zinc-800 font-bold" />
          <datalist id="model-list">{DATA_STORE.models_common.map(m => <option key={m} value={m} />)}</datalist>
        </div>
        <div className="flex flex-col gap-4">
          <label className="text-[12px] font-black text-zinc-600 uppercase tracking-widest ml-2">Manufacturing Year</label>
          <input name="year" list="year-list" value={context.year} onChange={handleChange} placeholder="2024" className="bg-[#050505] border-2 border-zinc-900 rounded-[24px] px-8 py-6 text-base text-white focus:outline-none focus:border-[#f18a22] transition-all placeholder:text-zinc-800 font-bold" />
          <datalist id="year-list">{DATA_STORE.years.map(y => <option key={y} value={y} />)}</datalist>
        </div>
      </div>

      <div className="mb-14">
        <div className="flex items-center gap-5 mb-8">
           <label className="text-[13px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-2 block">02. Propulsion Type</label>
           {context.fuelType && (
             <div className="flex items-center gap-3 px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full animate-in fade-in slide-in-from-left-4 duration-500">
               {getFuelIcon(context.fuelType, "w-5 h-5")}
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{context.fuelType} Logic Engaged</span>
             </div>
           )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {DATA_STORE.fuelOptions.map((fuel) => (
            <button
              key={fuel.id}
              onClick={() => handleFuelSelect(fuel.id)}
              className={`flex flex-col items-center justify-center p-10 rounded-[36px] border-2 transition-all duration-700 group ${context.fuelType === fuel.id ? `${fuel.bg} border-[#f18a22] shadow-[0_20px_40px_rgba(241,138,34,0.1)] scale-105` : 'bg-[#050505] border-[#262626] hover:border-[#f18a22]/30'}`}
            >
              <div className={`mb-6 transition-all duration-700 ${context.fuelType === fuel.id ? 'scale-125' : 'scale-100 group-hover:scale-110'}`}>
                {getFuelIcon(fuel.id, "w-12 h-12")}
              </div>
              <span className={`text-[12px] font-black uppercase tracking-[0.25em] transition-colors duration-700 ${context.fuelType === fuel.id ? 'text-white' : 'text-zinc-700'}`}>{fuel.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isContextComplete(context) && (
        <div className="relative pt-10">
           <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
           <button onClick={handleLockIdentity} className="w-full py-8 bg-[#f18a22] text-black text-[16px] font-black uppercase tracking-[0.6em] rounded-[32px] hover:bg-[#d97a1d] active:scale-[0.98] transition-all shadow-[0_30px_60px_-12px_rgba(241,138,34,0.6)] flex items-center justify-center gap-8 group overflow-hidden">
            <span className="relative z-10 flex items-center gap-8">
              <svg className="w-8 h-8 group-hover:rotate-12 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Finalize Digital Twin Dossier
            </span>
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-24 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shine"></div>
          </button>
        </div>
      )}
      <style>{`
        @keyframes shine { 
          0% { transform: translateX(-200%) skewX(-24deg); } 
          100% { transform: translateX(300%) skewX(-24deg); } 
        } 
        .animate-shine {
          animation: shine 1.5s infinite;
        }
        @keyframes scan-y { 
          0% { transform: translateY(-100%); opacity: 0; } 
          50% { opacity: 0.8; }
          100% { transform: translateY(200%); opacity: 0; } 
        }
        .animate-scan-y {
          animation: scan-y 3s linear infinite;
        }
        @keyframes scan-x { 
          0% { transform: translateX(-100%); opacity: 0; } 
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; } 
        }
        .animate-scan-x {
          animation: scan-x 2.5s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VehicleContextPanel;
