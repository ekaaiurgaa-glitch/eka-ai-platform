
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
    { id: "Petrol", label: "Petrol", color: "text-orange-400", icon: "M19 16V8m0 0a2 2 0 10-4 0v8m4-8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2v-3M13 11l-4-4m0 4l4-4" },
    { id: "Diesel", label: "Diesel", color: "text-zinc-400", icon: "M19 16V8m0 0a2 2 0 10-4 0v8m4-8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2v-3M9 11h4" },
    { id: "Electric", label: "Electric", color: "text-blue-400", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { id: "CNG", label: "CNG", color: "text-green-400", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" },
    { id: "Hybrid", label: "Hybrid", color: "text-emerald-400", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }
  ],
  years: Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString()) 
};

const VehicleContextPanel: React.FC<VehicleContextPanelProps> = ({ context, onUpdate, onScanRecalls }) => {
  const [isEditing, setIsEditing] = useState(!isContextComplete(context));
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [showSuccessGlow, setShowSuccessGlow] = useState(false);

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
    setIsEditing(false);
    setShowSuccessGlow(true);
    setTimeout(() => setShowSuccessGlow(false), 3000);
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

  if (!isEditing && isContextComplete(context)) {
    return (
      <div className={`mx-4 mb-8 transition-all duration-700 ${showSuccessGlow ? 'scale-[1.02]' : ''}`}>
        <div className={`relative group overflow-hidden p-[1px] rounded-2xl transition-all duration-1000 ${showSuccessGlow ? 'bg-gradient-to-r from-green-500 via-[#f18a22] to-green-500 animate-pulse shadow-[0_0_40px_rgba(34,197,94,0.3)]' : 'bg-[#262626]'}`}>
          <div className="bg-[#0A0A0A] border border-transparent rounded-[15px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            {showSuccessGlow && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.08),transparent)] animate-in fade-in duration-1000"></div>}
            
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="relative">
                <div className={`w-20 h-20 bg-black border-2 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden transition-colors duration-500 ${showSuccessGlow ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'border-[#f18a22]/30'}`}>
                   {context.vehicleType === '2W' ? (
                      <svg className={`w-10 h-10 transition-colors ${showSuccessGlow ? 'text-green-500' : 'text-[#f18a22]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" /></svg>
                   ) : (
                      <svg className={`w-10 h-10 transition-colors ${showSuccessGlow ? 'text-green-500' : 'text-[#f18a22]'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-1/2 w-full animate-[scan_2.5s_linear_infinite]"></div>
                </div>
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shadow-lg transition-colors duration-500 ${showSuccessGlow ? 'bg-green-500 scale-110' : 'bg-zinc-800'}`}>
                  <svg className={`w-4 h-4 ${showSuccessGlow ? 'text-black' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>

              <div className="flex flex-col relative z-20">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${showSuccessGlow ? 'text-green-500' : 'text-zinc-500'}`}>
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${showSuccessGlow ? 'bg-green-400' : 'bg-zinc-700'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${showSuccessGlow ? 'bg-green-500' : 'bg-zinc-600'}`}></span>
                    </span>
                    {showSuccessGlow ? 'Identity Verified & Gated' : 'Vehicle Identity Synced'}
                  </span>
                  <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">G4G Protocol 2.1</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none mb-2">
                  <span className="text-zinc-500">{context.year}</span> <span className="text-[#f18a22]">{context.brand}</span> {context.model}
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-[#262626] rounded-lg text-[11px] font-bold text-zinc-400 uppercase tracking-tighter">
                    {getFuelIcon(context.fuelType)}
                    <span>{context.fuelType}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-[11px] font-black text-green-500 uppercase tracking-widest">Certified</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto relative z-20">
              <button onClick={onScanRecalls} className="w-full md:w-auto px-8 py-4 bg-green-600 text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-green-500 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(34,197,94,0.3)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Safety Audit
              </button>
              <button onClick={() => setIsEditing(true)} className="w-full md:w-auto px-6 py-4 bg-zinc-900 border border-[#262626] rounded-xl text-[11px] text-zinc-500 font-black uppercase tracking-widest hover:border-[#f18a22] hover:text-white transition-all active:scale-95">Edit Context</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-8 p-10 bg-[#0A0A0A] border-2 border-[#f18a22]/20 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-300">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#f18a22_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="flex items-center gap-5 mb-10">
        <div className="w-2 h-8 bg-[#f18a22] shadow-[0_0_15px_rgba(241,138,34,0.6)] rounded-full"></div>
        <div className="flex flex-col">
          <h3 className="text-lg font-black text-white uppercase tracking-[0.3em]">Identity Synchronizer</h3>
          <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-1">G4G Governance System Phase-1</p>
        </div>
      </div>

      <div className="mb-10">
         <label className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 mb-5 block">1. Operational Category</label>
         <div className="flex gap-6">
            <button onClick={() => handleTypeSelect('2W')} className={`flex-1 py-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all active:scale-[0.98] ${context.vehicleType === '2W' ? 'bg-[#f18a22] border-[#f18a22] text-black shadow-xl' : 'bg-black border-[#262626] text-zinc-500 hover:border-[#f18a22]/40'}`}>
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" /></svg>
               <span className="text-[11px] uppercase font-black tracking-widest">Two-Wheeler Protocol</span>
            </button>
            <button onClick={() => handleTypeSelect('4W')} className={`flex-1 py-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all active:scale-[0.98] ${context.vehicleType === '4W' ? 'bg-[#f18a22] border-[#f18a22] text-black shadow-xl' : 'bg-black border-[#262626] text-zinc-500 hover:border-[#f18a22]/40'}`}>
               <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/></svg>
               <span className="text-[11px] uppercase font-black tracking-widest">Four-Wheeler Protocol</span>
            </button>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Vehicle Brand</label>
          <input name="brand" list="brand-list" value={context.brand} onChange={handleChange} placeholder="e.g. Honda" className="bg-black border border-[#262626] rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all" />
          <datalist id="brand-list">{brandSuggestions.map(b => <option key={b} value={b} />)}</datalist>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Vehicle Model</label>
          <input name="model" list="model-list" value={context.model} onChange={handleChange} placeholder="e.g. City" className="bg-black border border-[#262626] rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all" />
          <datalist id="model-list">{DATA_STORE.models_common.map(m => <option key={m} value={m} />)}</datalist>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Mfg Year</label>
          <input name="year" list="year-list" value={context.year} onChange={handleChange} placeholder="2024" className="bg-black border border-[#262626] rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all" />
          <datalist id="year-list">{DATA_STORE.years.map(y => <option key={y} value={y} />)}</datalist>
        </div>
      </div>

      <div className="mb-10">
        <label className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 mb-5 block">2. Fuel System Identity</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {DATA_STORE.fuelOptions.map((fuel) => (
            <button
              key={fuel.id}
              onClick={() => handleFuelSelect(fuel.id)}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${context.fuelType === fuel.id ? 'bg-[#f18a22]/10 border-[#f18a22] shadow-[0_0_20px_rgba(241,138,34,0.1)]' : 'bg-black border-[#262626] hover:border-[#f18a22]/30'}`}
            >
              <div className={`mb-3 transition-transform duration-300 ${context.fuelType === fuel.id ? 'scale-125' : 'scale-100'}`}>
                {getFuelIcon(fuel.id, "w-8 h-8")}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${context.fuelType === fuel.id ? 'text-white' : 'text-zinc-500'}`}>{fuel.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isContextComplete(context) && (
        <button onClick={handleLockIdentity} className="w-full py-5 bg-[#f18a22] text-black text-[13px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-[#d97a1d] active:scale-[0.98] transition-all shadow-2xl flex items-center justify-center gap-4 group relative overflow-hidden">
          <span className="relative z-10 flex items-center gap-4">
            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Lock Identity & Initialize Session
          </span>
          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-[shine_0.75s]"></div>
        </button>
      )}
      <style>{`@keyframes shine { 100% { left: 125%; } } @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(200%); } }`}</style>
    </div>
  );
};

export default VehicleContextPanel;
