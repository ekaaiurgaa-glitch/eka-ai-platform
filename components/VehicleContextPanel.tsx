
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
        if (!value || value.trim().length < 2) return "Brand required (min 2 characters)";
        break;
      case 'model':
        if (!value || value.trim().length < 1) return "Model identifier required";
        break;
      case 'year':
        const y = parseInt(value);
        if (!value) return "Manufacturing year required";
        if (isNaN(y) || y < 1990 || y > currentYear + 1) return `Valid range: 1990 - ${currentYear + 1}`;
        break;
      case 'fuelType':
        if (!value) return "Selection required";
        break;
      case 'batteryCapacity':
        if (context.fuelType === 'Electric') {
          const bc = parseFloat(value);
          if (!value) return "Capacity required";
          if (isNaN(bc) || bc <= 0 || bc > 300) return "Range: 1-300 kWh";
        }
        break;
      case 'motorPower':
        if (context.fuelType === 'Electric') {
          const mp = parseFloat(value);
          if (!value) return "Power rating required";
          if (isNaN(mp) || mp <= 0 || mp > 1000) return "Range: 1-1000 kW";
        }
        break;
      case 'hvSafetyConfirmed':
        if ((context.fuelType === 'Electric' || context.fuelType === 'Hybrid') && !value) {
          return "Safety affirmation mandatory for high-voltage systems";
        }
        break;
    }
    return undefined;
  }, [context.fuelType]);

  // Run validation whenever context changes
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
    // Mark all as touched on submit attempt
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
      <div className="mx-4 mb-8 animate-in slide-in-from-top-4 duration-1000">
        <div className="relative group overflow-hidden p-[1px] rounded-[32px] bg-gradient-to-br from-zinc-800 via-zinc-900 to-black hover:from-[#f18a22]/50 hover:via-[#f18a22]/20 hover:to-green-500/50 transition-all duration-1000 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
          
          <div className="absolute inset-0 bg-green-500/5 animate-pulse pointer-events-none"></div>
          
          <div className="absolute top-8 right-10 z-20 flex flex-col items-end gap-2">
            <div className="px-4 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
              <span className="text-[9px] font-black text-green-500 uppercase tracking-[0.3em]">Governance Locked</span>
            </div>
          </div>

          <div className="bg-[#050505] rounded-[31px] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10 overflow-hidden">
            
            <div className="absolute -bottom-10 -left-10 opacity-[0.03] rotate-12 select-none pointer-events-none">
              <span className="text-[120px] font-black uppercase tracking-tighter leading-none text-green-500">VERIFIED</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-10 w-full lg:w-auto">
              <div className="relative shrink-0">
                <div className="absolute -inset-10 bg-green-500/10 rounded-full blur-[50px] animate-pulse"></div>
                <div className="w-36 h-36 bg-black border-2 border-green-500/20 shadow-[0_0_60px_rgba(34,197,94,0.1)] rounded-[40px] flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-1000">
                   {context.vehicleType === '2W' ? (
                      <svg className="w-20 h-20 text-green-500/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" /></svg>
                   ) : (
                      <svg className="w-20 h-20 text-green-500/80" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/20 to-transparent h-full w-full animate-scan-y"></div>
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.1)_0%,transparent_70%)]"></div>
                </div>
                
                <div className="absolute -bottom-2 -right-2 w-14 h-14 rounded-full border-[6px] border-black bg-green-500 flex items-center justify-center shadow-[0_10px_30px_rgba(34,197,94,0.4)] animate-bounce-subtle z-20">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>

              <div className="flex flex-col text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-6">
                  <div className="px-5 py-2 bg-green-500/10 border border-green-500/40 text-green-400 text-[10px] font-black uppercase tracking-[0.25em] rounded-xl flex items-center gap-3 shadow-[0_4px_15px_rgba(34,197,94,0.1)]">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Digital Twin Synchronized
                  </div>
                  <div className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">OS_REF:</span>
                    <span className="text-[10px] font-mono font-bold text-white tracking-tighter">#G4G-{context.brand.slice(0,3).toUpperCase()}-{context.year.slice(-2)}</span>
                  </div>
                </div>

                <h2 className="text-5xl sm:text-6xl font-black text-white tracking-tighter uppercase leading-tight mb-6 group-hover:text-[#f18a22] transition-colors duration-700">
                  <span className="text-zinc-700">{context.year}</span> {context.brand} <span className="text-zinc-400">{context.model}</span>
                </h2>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                  <div className="flex items-center gap-3 px-6 py-3.5 bg-zinc-900/40 border border-white/5 rounded-2xl text-[11px] font-black text-zinc-300 uppercase tracking-[0.15em] hover:border-white/10 transition-colors">
                    {getFuelIcon(context.fuelType, "w-5 h-5")}
                    <span>{context.fuelType} Engine</span>
                  </div>
                  {context.fuelType === 'Electric' && (
                    <div className="flex items-center gap-3 px-6 py-3.5 bg-[#f18a22]/5 border border-[#f18a22]/20 rounded-2xl text-[11px] font-black text-[#f18a22] uppercase tracking-[0.15em] shadow-[0_4px_15px_rgba(241,138,34,0.05)]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span>{context.batteryCapacity}kWh • {context.motorPower}kW</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 px-6 py-3.5 bg-blue-500/5 border border-blue-500/20 rounded-2xl text-[11px] font-black text-blue-400 uppercase tracking-[0.15em] shadow-[0_4px_15px_rgba(59,130,246,0.05)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <span>Audit Capable</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto relative z-10">
              <button onClick={onScanRecalls} className="w-full sm:w-auto px-12 py-6 bg-green-600 text-black text-[11px] font-black uppercase tracking-[0.25em] rounded-[24px] hover:bg-green-500 hover:shadow-[0_20px_50px_rgba(34,197,94,0.4)] transition-all active:scale-95 flex items-center justify-center gap-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Safety Triage
              </button>
              <button onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-10 py-6 bg-zinc-900/80 border border-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-[24px] hover:border-[#f18a22] hover:text-white transition-all active:scale-95">Re-Architect Identity</button>
            </div>
          </div>
          
          <div className="absolute bottom-5 right-12 flex items-center gap-4 opacity-40 select-none">
             <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">EKA-Ai Central OS Certified Environment</span>
             <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></div>
          </div>
        </div>
      </div>
    );
  }

  const isEVOrHybrid = context.fuelType === 'Electric' || context.fuelType === 'Hybrid';

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
          <label className={`text-[12px] font-black uppercase tracking-widest ml-2 ${(touched.brand && errors.brand) ? 'text-red-500' : 'text-zinc-600'}`}>Manufacturer Brand</label>
          <input name="brand" list="brand-list" value={context.brand} onChange={handleChange} onBlur={() => handleBlur('brand')} placeholder="e.g. Tata Motors" className={`bg-[#050505] border-2 rounded-[24px] px-8 py-6 text-base text-white focus:outline-none transition-all placeholder:text-zinc-800 font-bold ${(touched.brand && errors.brand) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'}`} />
          {(touched.brand && errors.brand) && <span className="text-[10px] text-red-500 font-bold ml-4 uppercase tracking-tighter">{errors.brand}</span>}
          <datalist id="brand-list">{brandSuggestions.map(b => <option key={b} value={b} />)}</datalist>
        </div>
        <div className="flex flex-col gap-4">
          <label className={`text-[12px] font-black uppercase tracking-widest ml-2 ${(touched.model && errors.model) ? 'text-red-500' : 'text-zinc-600'}`}>Series / Model</label>
          <input name="model" list="model-list" value={context.model} onChange={handleChange} onBlur={() => handleBlur('model')} placeholder="e.g. Nexon EV" className={`bg-[#050505] border-2 rounded-[24px] px-8 py-6 text-base text-white focus:outline-none transition-all placeholder:text-zinc-800 font-bold ${(touched.model && errors.model) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'}`} />
          {(touched.model && errors.model) && <span className="text-[10px] text-red-500 font-bold ml-4 uppercase tracking-tighter">{errors.model}</span>}
          <datalist id="model-list">{DATA_STORE.models_common.map(m => <option key={m} value={m} />)}</datalist>
        </div>
        <div className="flex flex-col gap-4">
          <label className={`text-[12px] font-black uppercase tracking-widest ml-2 ${(touched.year && errors.year) ? 'text-red-500' : 'text-zinc-600'}`}>Manufacturing Year</label>
          <input name="year" list="year-list" value={context.year} onChange={handleChange} onBlur={() => handleBlur('year')} placeholder="2024" className={`bg-[#050505] border-2 rounded-[24px] px-8 py-6 text-base text-white focus:outline-none transition-all placeholder:text-zinc-800 font-bold ${(touched.year && errors.year) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'}`} />
          {(touched.year && errors.year) && <span className="text-[10px] text-red-500 font-bold ml-4 uppercase tracking-tighter">{errors.year}</span>}
          <datalist id="year-list">{DATA_STORE.years.map(y => <option key={y} value={y} />)}</datalist>
        </div>
      </div>

      <div className="mb-14">
        <div className="flex items-center justify-between mb-8 pr-4">
           <label className={`text-[13px] font-black uppercase tracking-[0.4em] ml-2 block ${(touched.fuelType && errors.fuelType) ? 'text-red-500' : 'text-zinc-600'}`}>02. Propulsion Type</label>
           {(touched.fuelType && errors.fuelType) && <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">{errors.fuelType}</span>}
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

      {context.fuelType === 'Electric' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-14 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-4">
            <label className={`text-[12px] font-black uppercase tracking-widest ml-2 ${(touched.batteryCapacity && errors.batteryCapacity) ? 'text-red-500' : 'text-zinc-600'}`}>Battery Capacity (kWh)</label>
            <input name="batteryCapacity" type="number" value={context.batteryCapacity || ''} onChange={handleChange} onBlur={() => handleBlur('batteryCapacity')} placeholder="40.5" className={`bg-[#050505] border-2 rounded-[24px] px-8 py-6 text-base text-white focus:outline-none transition-all placeholder:text-zinc-800 font-bold ${(touched.batteryCapacity && errors.batteryCapacity) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'}`} />
            {(touched.batteryCapacity && errors.batteryCapacity) && <span className="text-[10px] text-red-500 font-bold ml-4 uppercase tracking-tighter">{errors.batteryCapacity}</span>}
          </div>
          <div className="flex flex-col gap-4">
            <label className={`text-[12px] font-black uppercase tracking-widest ml-2 ${(touched.motorPower && errors.motorPower) ? 'text-red-500' : 'text-zinc-600'}`}>Peak Power (kW)</label>
            <input name="motorPower" type="number" value={context.motorPower || ''} onChange={handleChange} onBlur={() => handleBlur('motorPower')} placeholder="110" className={`bg-[#050505] border-2 rounded-[24px] px-8 py-6 text-base text-white focus:outline-none transition-all placeholder:text-zinc-800 font-bold ${(touched.motorPower && errors.motorPower) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'}`} />
            {(touched.motorPower && errors.motorPower) && <span className="text-[10px] text-red-500 font-bold ml-4 uppercase tracking-tighter">{errors.motorPower}</span>}
          </div>
        </div>
      )}

      {isEVOrHybrid && (
        <div className={`mb-14 p-8 bg-orange-500/5 border-2 rounded-[32px] flex flex-col md:flex-row items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors ${ (touched.hvSafetyConfirmed && errors.hvSafetyConfirmed) ? 'border-red-500/40 bg-red-500/5' : 'border-orange-500/20'}`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${ (touched.hvSafetyConfirmed && errors.hvSafetyConfirmed) ? 'bg-red-500/10 border-red-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
             <svg className={`w-8 h-8 animate-pulse transition-colors ${ (touched.hvSafetyConfirmed && errors.hvSafetyConfirmed) ? 'text-red-500' : 'text-orange-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="flex-1">
            <h4 className={`text-sm font-black uppercase tracking-widest mb-1 italic transition-colors ${ (touched.hvSafetyConfirmed && errors.hvSafetyConfirmed) ? 'text-red-400' : 'text-white'}`}>High Voltage (HV) Safety Affirmation</h4>
            <p className="text-[11px] text-zinc-500 font-bold leading-relaxed uppercase tracking-tighter">Confirm compliance with G4G safety governance before technical diagnosis.</p>
            {(touched.hvSafetyConfirmed && errors.hvSafetyConfirmed) && <span className="text-[10px] text-red-500 font-black uppercase mt-1 block tracking-tight">{errors.hvSafetyConfirmed}</span>}
          </div>
          <div className="flex items-center gap-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="hvSafetyConfirmed" checked={!!context.hvSafetyConfirmed} onChange={handleChange} className="sr-only peer" />
              <div className="w-14 h-8 bg-zinc-900 border-2 border-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-600 after:border-zinc-400 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600 peer-checked:border-orange-500 peer-checked:after:bg-white"></div>
            </label>
          </div>
        </div>
      )}

      {isContextComplete(context) && (
        <div className="relative pt-10">
           <button 
             onClick={handleLockIdentity} 
             className={`w-full py-8 text-[16px] font-black uppercase tracking-[0.6em] rounded-[32px] transition-all flex items-center justify-center gap-8 group overflow-hidden ${isDataValid ? 'bg-[#f18a22] text-black hover:bg-[#d97a1d] shadow-[0_30px_60px_-12px_rgba(241,138,34,0.6)]' : 'bg-zinc-900 text-zinc-700 border border-zinc-800'}`}
           >
            {isDataValid ? 'Finalize Digital Twin Dossier' : 'Correct Technical Errors'}
           </button>
        </div>
      )}
      <style>{`
        @keyframes scan-y { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 0.8; } 100% { transform: translateY(200%); opacity: 0; } }
        .animate-scan-y { animation: scan-y 3s linear infinite; }
        @keyframes scan-x { 0% { transform: translateX(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateX(100%); opacity: 0; } }
        .animate-scan-x { animation: scan-x 2.5s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 6s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .animate-bounce-subtle { animation: bounce-subtle 2s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default VehicleContextPanel;
