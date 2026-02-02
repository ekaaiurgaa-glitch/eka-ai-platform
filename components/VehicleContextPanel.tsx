
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
          }, 400);
          return 100;
        }
        return prev + 5;
      });
    }, 40);
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
      <div className="mx-4 mb-8 p-12 bg-[#0A0A0A] border-2 border-[#f18a22]/30 rounded-3xl flex flex-col items-center justify-center gap-6 animate-pulse">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full text-[#f18a22] animate-spin-slow" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="20, 10" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-white font-black text-xl">{syncProgress}%</span>
          </div>
        </div>
        <div className="text-center">
          <h4 className="text-[#f18a22] font-black text-sm uppercase tracking-[0.3em] mb-2">Synchronizing Dossier</h4>
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">G4G Central Governance Sync in Progress</p>
        </div>
        <div className="w-full max-w-xs h-1 bg-zinc-900 rounded-full overflow-hidden">
          <div className="h-full bg-[#f18a22] transition-all duration-100" style={{ width: `${syncProgress}%` }}></div>
        </div>
      </div>
    );
  }

  if (!isEditing && isContextComplete(context)) {
    return (
      <div className="mx-4 mb-8">
        <div className="relative group overflow-hidden p-[1px] rounded-3xl bg-[#262626] hover:bg-gradient-to-r hover:from-green-500 hover:via-[#f18a22] hover:to-green-500 transition-all duration-700 shadow-2xl">
          <div className="bg-[#050505] border border-transparent rounded-[23px] p-8 flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10 overflow-hidden">
            {/* Background Texture */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#f18a22]/5 blur-3xl rounded-full pointer-events-none -mr-32 -mt-32"></div>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 w-full lg:w-auto">
              <div className="relative shrink-0">
                <div className="absolute -inset-4 bg-green-500/10 rounded-full blur-xl animate-pulse"></div>
                <div className="w-24 h-24 bg-black border-2 border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.3)] rounded-3xl flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                   {context.vehicleType === '2W' ? (
                      <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" /></svg>
                   ) : (
                      <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-1/2 w-full animate-[scan_3s_linear_infinite]"></div>
                </div>
                <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full border-4 border-black bg-green-500 flex items-center justify-center shadow-2xl">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>

              <div className="flex flex-col text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <div className="px-2 py-0.5 bg-green-500 text-black text-[8px] font-black uppercase tracking-widest rounded">Authenticated</div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">Dossier ID: #G4G-{context.brand.slice(0,3).toUpperCase()}-{Math.floor(Math.random()*9000)+1000}</span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-3">
                  <span className="text-zinc-600">{context.year}</span> <span className="text-[#f18a22]">{context.brand}</span> {context.model}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 uppercase tracking-tight">
                    {getFuelIcon(context.fuelType)}
                    <span>{context.fuelType} Engine</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 uppercase tracking-tight">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <span>G4G Verified</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <button onClick={onScanRecalls} className="w-full sm:w-auto px-10 py-5 bg-green-600 text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-green-500 hover:shadow-[0_15px_30px_rgba(34,197,94,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Safety Audit
              </button>
              <button onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-8 py-5 bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-black uppercase tracking-widest rounded-2xl hover:border-[#f18a22] hover:text-white transition-all active:scale-95">Update Identity</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-8 p-12 bg-[#0A0A0A] border-2 border-[#f18a22]/15 rounded-[40px] shadow-2xl relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#f18a22]/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="flex items-center gap-6 mb-12">
        <div className="w-3 h-10 bg-[#f18a22] shadow-[0_0_20px_rgba(241,138,34,0.5)] rounded-full animate-pulse"></div>
        <div className="flex flex-col">
          <h3 className="text-xl font-black text-white uppercase tracking-[0.4em]">Initialize digital twin</h3>
          <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-1">EKA-Ai Central Governance Intake</p>
        </div>
      </div>

      <div className="mb-12">
         <label className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2 mb-6 block">Section A: Architectural Category</label>
         <div className="flex flex-col sm:flex-row gap-6">
            <button onClick={() => handleTypeSelect('2W')} className={`flex-1 py-8 rounded-[30px] border-2 flex flex-col items-center gap-4 transition-all active:scale-[0.97] group ${context.vehicleType === '2W' ? 'bg-[#f18a22] border-[#f18a22] text-black shadow-2xl' : 'bg-[#050505] border-[#262626] text-zinc-600 hover:border-[#f18a22]/40'}`}>
               <svg className={`w-12 h-12 transition-transform duration-500 group-hover:scale-110 ${context.vehicleType === '2W' ? 'text-black' : 'text-zinc-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" /></svg>
               <span className="text-[12px] uppercase font-black tracking-[0.25em]">2-Wheeler Platform</span>
            </button>
            <button onClick={() => handleTypeSelect('4W')} className={`flex-1 py-8 rounded-[30px] border-2 flex flex-col items-center gap-4 transition-all active:scale-[0.97] group ${context.vehicleType === '4W' ? 'bg-[#f18a22] border-[#f18a22] text-black shadow-2xl' : 'bg-[#050505] border-[#262626] text-zinc-600 hover:border-[#f18a22]/40'}`}>
               <svg className={`w-12 h-12 transition-transform duration-500 group-hover:scale-110 ${context.vehicleType === '4W' ? 'text-black' : 'text-zinc-700'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/></svg>
               <span className="text-[12px] uppercase font-black tracking-[0.25em]">4-Wheeler Platform</span>
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <div className="flex flex-col gap-3">
          <label className="text-[11px] font-black text-zinc-600 uppercase tracking-widest ml-2">Manufacturer Brand</label>
          <input name="brand" list="brand-list" value={context.brand} onChange={handleChange} placeholder="e.g. Maruti Suzuki" className="bg-[#050505] border border-[#262626] rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all placeholder:text-zinc-800" />
          <datalist id="brand-list">{brandSuggestions.map(b => <option key={b} value={b} />)}</datalist>
        </div>
        <div className="flex flex-col gap-3">
          <label className="text-[11px] font-black text-zinc-600 uppercase tracking-widest ml-2">Series / Model</label>
          <input name="model" list="model-list" value={context.model} onChange={handleChange} placeholder="e.g. Swift" className="bg-[#050505] border border-[#262626] rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all placeholder:text-zinc-800" />
          <datalist id="model-list">{DATA_STORE.models_common.map(m => <option key={m} value={m} />)}</datalist>
        </div>
        <div className="flex flex-col gap-3">
          <label className="text-[11px] font-black text-zinc-600 uppercase tracking-widest ml-2">Manufacturing Era</label>
          <input name="year" list="year-list" value={context.year} onChange={handleChange} placeholder="2024" className="bg-[#050505] border border-[#262626] rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all placeholder:text-zinc-800" />
          <datalist id="year-list">{DATA_STORE.years.map(y => <option key={y} value={y} />)}</datalist>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex items-center gap-4 mb-6">
           <label className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2 block">Section B: Propulsion Type</label>
           {context.fuelType && (
             <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full animate-in fade-in zoom-in duration-300">
               {getFuelIcon(context.fuelType, "w-4 h-4")}
               <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{context.fuelType} Active</span>
             </div>
           )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {DATA_STORE.fuelOptions.map((fuel) => (
            <button
              key={fuel.id}
              onClick={() => handleFuelSelect(fuel.id)}
              className={`flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all duration-500 group ${context.fuelType === fuel.id ? `${fuel.bg} border-[#f18a22] shadow-[0_15px_30px_rgba(241,138,34,0.1)]` : 'bg-[#050505] border-[#262626] hover:border-[#f18a22]/40'}`}
            >
              <div className={`mb-4 transition-all duration-500 ${context.fuelType === fuel.id ? 'scale-125' : 'scale-100 group-hover:scale-110'}`}>
                {getFuelIcon(fuel.id, "w-10 h-10")}
              </div>
              <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${context.fuelType === fuel.id ? 'text-white' : 'text-zinc-600'}`}>{fuel.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isContextComplete(context) && (
        <div className="relative pt-8">
           <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
           <button onClick={handleLockIdentity} className="w-full py-7 bg-[#f18a22] text-black text-[14px] font-black uppercase tracking-[0.5em] rounded-3xl hover:bg-[#d97a1d] active:scale-[0.98] transition-all shadow-[0_25px_50px_-12px_rgba(241,138,34,0.5)] flex items-center justify-center gap-6 group overflow-hidden">
            <span className="relative z-10 flex items-center gap-6">
              <svg className="w-7 h-7 group-hover:rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Finalize & Lock Profile
            </span>
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-24 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shine_1.5s_infinite]"></div>
          </button>
        </div>
      )}
      <style>{`
        @keyframes shine { 
          0% { transform: translateX(-200%) skewX(-24deg); } 
          100% { transform: translateX(300%) skewX(-24deg); } 
        } 
        @keyframes scan { 
          0% { transform: translateY(-100%); opacity: 0; } 
          50% { opacity: 0.5; }
          100% { transform: translateY(200%); opacity: 0; } 
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
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
