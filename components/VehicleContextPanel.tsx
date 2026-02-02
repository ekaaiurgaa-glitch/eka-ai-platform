
import React, { useState, useEffect, useCallback } from 'react';
import { VehicleContext, isContextComplete } from '../types';

interface VehicleContextPanelProps {
  context: VehicleContext;
  onUpdate: (updated: VehicleContext) => void;
  onScanRecalls?: () => void;
}

interface ValidationErrors {
  brand?: string;
  model?: string;
  year?: string;
  fuelType?: string;
  batteryCapacity?: string;
  motorPower?: string;
  hvSafetyConfirmed?: string;
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
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setBrandSuggestions(context.vehicleType === '2W' ? DATA_STORE.brands_2w : DATA_STORE.brands_4w);
  }, [context.vehicleType]);

  const validateField = useCallback((name: string, value: any): string | undefined => {
    const currentYear = new Date().getFullYear();
    switch (name) {
      case 'brand':
        if (!value || value.trim().length < 2) return "Brand required";
        break;
      case 'model':
        if (!value || value.trim().length < 1) return "Model required";
        break;
      case 'year':
        const y = parseInt(value);
        if (!value) return "Year required";
        if (isNaN(y) || y < 1990 || y > currentYear + 1) return "Invalid";
        break;
      case 'fuelType':
        if (!value) return "Required";
        break;
      case 'batteryCapacity':
        if (context.fuelType === 'Electric') {
          const bc = parseFloat(value);
          if (!value) return "Required";
          if (isNaN(bc) || bc <= 0 || bc > 300) return "Invalid";
        }
        break;
      case 'motorPower':
        if (context.fuelType === 'Electric') {
          const mp = parseFloat(value);
          if (!value) return "Required";
          if (isNaN(mp) || mp <= 0 || mp > 1000) return "Invalid";
        }
        break;
      case 'hvSafetyConfirmed':
        if ((context.fuelType === 'Electric' || context.fuelType === 'Hybrid') && !value) {
          return "Affirmation required";
        }
        break;
    }
    return undefined;
  }, [context.fuelType]);

  useEffect(() => {
    const newErrors: ValidationErrors = {};
    const fields = ['brand', 'model', 'year', 'fuelType', 'batteryCapacity', 'motorPower', 'hvSafetyConfirmed'];
    fields.forEach(f => {
      const err = validateField(f, (context as any)[f]);
      if (err) (newErrors as any)[f] = err;
    });
    setErrors(newErrors);
  }, [context, validateField]);

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    onUpdate({ ...context, [name]: val });
    if (!touched[name]) setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleFuelSelect = (id: string) => {
    onUpdate({ 
      ...context, 
      fuelType: id,
      batteryCapacity: id === 'Electric' ? context.batteryCapacity : '',
      motorPower: id === 'Electric' ? context.motorPower : '',
      hvSafetyConfirmed: (id === 'Electric' || id === 'Hybrid') ? context.hvSafetyConfirmed : false
    });
    setTouched(prev => ({ ...prev, fuelType: true }));
  };

  const handleTypeSelect = (type: '2W' | '4W') => {
    onUpdate({ ...context, vehicleType: type, brand: '', model: '' });
    setTouched({});
    setErrors({});
  };

  const isDataValid = isContextComplete(context) && Object.keys(errors).length === 0;

  const handleLockIdentity = () => {
    const allTouched = ['brand', 'model', 'year', 'fuelType', 'batteryCapacity', 'motorPower', 'hvSafetyConfirmed'].reduce((acc, f) => ({ ...acc, [f]: true }), {});
    setTouched(allTouched);

    if (!isDataValid) return;
    
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
      </div>
    );
  }

  if (!isEditing && isContextComplete(context)) {
    return (
      <div className="mx-4 mb-12 animate-in slide-in-from-top-4 duration-1000">
        <div className="relative group overflow-hidden p-[2px] rounded-[40px] bg-gradient-to-br from-[#f18a22]/40 via-zinc-900 to-green-500/40 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] transition-all duration-1000">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.1),transparent_50%)] animate-pulse"></div>
          
          <div className="bg-[#050505] rounded-[38px] p-10 md:p-14 relative z-10 overflow-hidden">
            <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8 relative z-20">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.1)] relative">
                   <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                   </svg>
                   <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-black animate-ping"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-black text-2xl tracking-tighter uppercase leading-none mb-1">Dossier Locked</span>
                  <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.4em] font-mono">Digital Twin Synchronized • v1.1.0</span>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end">
                <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-mono font-bold text-zinc-400 tracking-tighter mb-2">
                  SECURE_PROTOCOL_AUTH
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></div>
                  <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Live Link</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
              <div className="flex flex-col sm:flex-row items-center gap-12 w-full lg:w-auto">
                <div className="relative shrink-0 group/icon">
                  <div className="w-44 h-44 bg-[#0A0A0A] border-2 border-zinc-800 rounded-[56px] flex items-center justify-center relative overflow-hidden shadow-2xl transition-all duration-700 hover:border-[#f18a22]/40 hover:scale-105">
                     {context.vehicleType === '2W' ? (
                        <svg className="w-28 h-28 text-zinc-700 group-hover/icon:text-[#f18a22] transition-colors duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" /></svg>
                     ) : (
                        <svg className="w-28 h-28 text-zinc-700 group-hover/icon:text-[#f18a22] transition-colors duration-700" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/></svg>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent h-full w-full animate-scan-y"></div>
                  </div>
                  <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-3xl border-[8px] border-black bg-green-500 flex items-center justify-center shadow-xl">
                    <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                  </div>
                </div>

                <div className="flex flex-col text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                     <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">Confirmed</span>
                     <span className="text-[10px] text-zinc-600 font-mono font-black uppercase tracking-widest">Ref: G4G-{context.brand.slice(0,3).toUpperCase()}</span>
                  </div>
                  <h2 className="text-6xl sm:text-8xl font-black text-white tracking-tighter uppercase leading-[0.85] mb-8">
                    <span className="text-zinc-800 block text-3xl sm:text-4xl mb-3 tracking-[0.2em]">{context.year}</span>
                    <span className="group-hover:text-[#f18a22] transition-all duration-500">{context.brand}</span>
                    <span className="text-zinc-600 block text-4xl sm:text-5xl mt-2">{context.model}</span>
                  </h2>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                    <div className="flex items-center gap-3 px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-[22px] text-[11px] font-black text-white uppercase tracking-[0.15em] hover:border-zinc-700 transition-colors">
                      {getFuelIcon(context.fuelType, "w-5 h-5")}
                      {context.fuelType} OS
                    </div>
                    {context.fuelType === 'Electric' && (
                      <div className="flex items-center gap-3 px-6 py-4 bg-[#f18a22]/10 border border-[#f18a22]/30 rounded-[22px] text-[11px] font-black text-[#f18a22] uppercase tracking-[0.15em]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        {context.batteryCapacity}kWh • {context.motorPower}kW
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-5 w-full lg:w-auto relative z-10">
                <button onClick={onScanRecalls} className="group w-full lg:w-80 h-24 bg-[#f18a22] text-black text-[15px] font-black uppercase tracking-[0.4em] rounded-[32px] hover:bg-white hover:shadow-[0_20px_60px_rgba(241,138,34,0.3)] transition-all duration-500 active:scale-95 flex items-center justify-center gap-4">
                  <svg className="w-7 h-7 group-hover:rotate-180 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Safety Audit
                </button>
                <button onClick={() => setIsEditing(true)} className="w-full lg:w-80 h-16 bg-zinc-900/40 border border-zinc-800 text-zinc-500 text-[11px] font-black uppercase tracking-[0.25em] rounded-[24px] hover:border-[#f18a22] hover:text-white transition-all active:scale-95">
                  Re-Architect
                </button>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]"></div>
        </div>
      </div>
    );
  }

  const isEVOrHybrid = context.fuelType === 'Electric' || context.fuelType === 'Hybrid';

  return (
    <div className="mx-4 mb-8 p-12 bg-[#050505] border border-zinc-800 rounded-[32px] shadow-3xl relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f18a22]/5 blur-[180px] rounded-full pointer-events-none"></div>
      
      {/* 'Architect' Header Layout - Anchored */}
      <div className="flex items-start gap-6 mb-16">
        <div className="w-[6px] h-14 bg-[#f18a22] shadow-[0_0_25px_rgba(241,138,34,0.6)] rounded-full animate-pulse shrink-0"></div>
        <div className="flex flex-col">
          <h2 className="text-3xl font-black text-white uppercase tracking-[0.4em] leading-none mb-3 font-mono">Architect Vehicle Dossier</h2>
          <span className="text-[12px] text-zinc-600 font-bold uppercase tracking-[0.3em] font-mono">EKA-Ai Central Governance Initialization</span>
        </div>
      </div>

      <div className="mb-16">
         <div className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 font-mono">01. Architectural Class</div>
         <div className="grid grid-cols-2 gap-8">
            <button onClick={() => handleTypeSelect('2W')} className={`flex flex-col items-center justify-center h-48 rounded-[24px] border transition-all duration-500 active:scale-[0.98] group ${context.vehicleType === '2W' ? 'bg-[#0A0A0A] border-[#f18a22] shadow-2xl' : 'bg-[#050505] border-zinc-900 hover:border-zinc-700'}`}>
               <div className={`mb-6 transition-transform duration-700 group-hover:scale-110 ${context.vehicleType === '2W' ? 'text-[#f18a22]' : 'text-zinc-800'}`}>
                 <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" /></svg>
               </div>
               <span className={`text-[13px] font-black uppercase tracking-[0.3em] font-mono transition-colors ${context.vehicleType === '2W' ? 'text-white' : 'text-zinc-700'}`}>2-Wheeler Fleet</span>
            </button>
            <button onClick={() => handleTypeSelect('4W')} className={`flex flex-col items-center justify-center h-48 rounded-[24px] border transition-all duration-500 active:scale-[0.98] group ${context.vehicleType === '4W' ? 'bg-[#0A0A0A] border-[#f18a22] shadow-2xl' : 'bg-[#050505] border-zinc-900 hover:border-zinc-700'}`}>
               <div className={`mb-6 transition-transform duration-700 group-hover:scale-110 ${context.vehicleType === '4W' ? 'text-[#f18a22]' : 'text-zinc-800'}`}>
                 <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/></svg>
               </div>
               <span className={`text-[13px] font-black uppercase tracking-[0.3em] font-mono transition-colors ${context.vehicleType === '4W' ? 'text-white' : 'text-zinc-700'}`}>4-Wheeler Fleet</span>
            </button>
         </div>
      </div>

      {/* Grid Fix: Exact 2fr:2fr:1fr alignment for perfect vertical rhythm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_2fr_1fr] gap-10 mb-16 items-start">
        <div className="flex flex-col gap-3">
          <label className={`text-[11px] font-black uppercase tracking-widest ml-1 font-mono ${(touched.brand && errors.brand) ? 'text-red-500' : 'text-zinc-600'}`}>Manufacturer Brand</label>
          <input name="brand" list="brand-list" value={context.brand} onChange={handleChange} onBlur={() => handleBlur('brand')} placeholder="e.g. Tata Motors" className={`bg-[#0A0A0A] border rounded-[12px] px-6 py-5 text-sm text-white focus:outline-none transition-all placeholder:text-zinc-800 font-bold ${(touched.brand && errors.brand) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'} w-full box-border`} />
          <datalist id="brand-list">{brandSuggestions.map(b => <option key={b} value={b} />)}</datalist>
        </div>
        <div className="flex flex-col gap-3">
          <label className={`text-[11px] font-black uppercase tracking-widest ml-1 font-mono ${(touched.model && errors.model) ? 'text-red-500' : 'text-zinc-600'}`}>Series / Model</label>
          <input name="model" list="model-list" value={context.model} onChange={handleChange} onBlur={() => handleBlur('model')} placeholder="e.g. Nexon EV" className={`bg-[#0A0A0A] border rounded-[12px] px-6 py-5 text-sm text-white focus:outline-none transition-all placeholder:text-zinc-800 font-bold ${(touched.model && errors.model) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'} w-full box-border`} />
          <datalist id="model-list">{DATA_STORE.models_common.map(m => <option key={m} value={m} />)}</datalist>
        </div>
        <div className="flex flex-col gap-3">
          <label className={`text-[11px] font-black uppercase tracking-widest ml-1 font-mono ${(touched.year && errors.year) ? 'text-red-500' : 'text-zinc-600'}`}>Year</label>
          <input name="year" list="year-list" value={context.year} onChange={handleChange} onBlur={() => handleBlur('year')} placeholder="2024" className={`bg-[#0A0A0A] border rounded-[12px] px-6 py-5 text-sm text-white focus:outline-none transition-all placeholder:text-zinc-800 font-bold ${(touched.year && errors.year) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'} w-full box-border`} />
          <datalist id="year-list">{DATA_STORE.years.map(y => <option key={y} value={y} />)}</datalist>
        </div>
      </div>

      <div className="mb-16">
        <div className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-10 font-mono">02. Propulsion Type</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
          {DATA_STORE.fuelOptions.map((fuel) => (
            <button
              key={fuel.id}
              onClick={() => handleFuelSelect(fuel.id)}
              className={`flex flex-col items-center justify-center py-10 rounded-[28px] border transition-all duration-700 group ${context.fuelType === fuel.id ? `${fuel.bg} border-[#f18a22] scale-105 shadow-xl` : 'bg-[#0A0A0A] border-zinc-900 hover:border-zinc-700'}`}
            >
              <div className={`mb-4 transition-transform duration-500 ${context.fuelType === fuel.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {getFuelIcon(fuel.id, "w-10 h-10")}
              </div>
              <span className={`text-[11px] font-black uppercase tracking-widest font-mono transition-colors ${context.fuelType === fuel.id ? 'text-white' : 'text-zinc-700'}`}>{fuel.label}</span>
            </button>
          ))}
        </div>
      </div>

      {context.fuelType === 'Electric' && (
        <div className="grid grid-cols-2 gap-10 mb-16 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col gap-3">
            <label className="text-[11px] font-black uppercase tracking-widest ml-1 font-mono text-zinc-600">Battery Capacity (kWh)</label>
            <input name="batteryCapacity" type="number" value={context.batteryCapacity || ''} onChange={handleChange} placeholder="40.5" className="bg-[#0A0A0A] border border-zinc-900 rounded-[12px] px-6 py-5 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all font-bold w-full" />
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-[11px] font-black uppercase tracking-widest ml-1 font-mono text-zinc-600">Peak Power (kW)</label>
            <input name="motorPower" type="number" value={context.motorPower || ''} onChange={handleChange} placeholder="110" className="bg-[#0A0A0A] border border-zinc-900 rounded-[12px] px-6 py-5 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all font-bold w-full" />
          </div>
        </div>
      )}

      {isEVOrHybrid && (
        <div className={`mb-16 p-10 bg-[#0A0A0A] border rounded-[28px] flex flex-col md:flex-row items-center gap-10 animate-in fade-in slide-in-from-bottom-4 transition-all ${ (touched.hvSafetyConfirmed && errors.hvSafetyConfirmed) ? 'border-red-500/40 bg-red-500/5' : 'border-orange-500/20'}`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${ (touched.hvSafetyConfirmed && errors.hvSafetyConfirmed) ? 'bg-red-500/10 border-red-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
             <svg className="w-8 h-8 text-orange-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black uppercase tracking-widest mb-1 font-mono text-white italic">High Voltage (HV) Safety Affirmation</h4>
            <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-tight leading-relaxed">Confirm absolute compliance with G4G HV safety protocol before proceeding to technical diagnosis.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" name="hvSafetyConfirmed" checked={!!context.hvSafetyConfirmed} onChange={handleChange} className="sr-only peer" />
            <div className="w-16 h-9 bg-zinc-900 border-2 border-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[6px] after:left-[6px] after:bg-zinc-600 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#f18a22] peer-checked:after:bg-white"></div>
          </label>
        </div>
      )}

      {isContextComplete(context) && (
        <div className="relative pt-10 border-t border-white/5">
           <button onClick={handleLockIdentity} className={`w-full py-9 text-[18px] font-black uppercase tracking-[0.6em] rounded-[32px] transition-all flex items-center justify-center gap-8 group overflow-hidden font-mono ${isDataValid ? 'bg-[#f18a22] text-black hover:bg-white shadow-[0_40px_80px_-15px_rgba(241,138,34,0.4)]' : 'bg-zinc-900 text-zinc-700'}`}>
            {isDataValid ? 'Lock Identity & Sync Digital Twin' : 'Validation Error'}
           </button>
        </div>
      )}
      <style>{`
        @keyframes scan-y { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 0.8; } 100% { transform: translateY(200%); opacity: 0; } }
        .animate-scan-y { animation: scan-y 4s linear infinite; }
        @keyframes scan-x { 0% { transform: translateX(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateX(100%); opacity: 0; } }
        .animate-scan-x { animation: scan-x 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default VehicleContextPanel;
