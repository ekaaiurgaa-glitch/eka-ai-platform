
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VehicleContext, isContextComplete, OperatingMode, JobStatus } from '../types';

interface VehicleContextPanelProps {
  context: VehicleContext;
  onUpdate: (updated: VehicleContext) => void;
  onScanRecalls?: () => void;
  operatingMode?: OperatingMode;
  status?: JobStatus;
}

interface ValidationErrors {
  brand?: string;
  model?: string;
  year?: string;
  fuelType?: string;
  registrationNumber?: string;
  batteryCapacity?: string;
  motorPower?: string;
  hvSafetyConfirmed?: string;
}

const DATA_STORE = {
  brands_4w: ["Maruti Suzuki", "Hyundai", "Tata Motors", "Mahindra", "Toyota", "Honda", "Kia", "MG", "Volkswagen", "Skoda", "Renault", "Jeep", "Nissan", "Audi", "BMW", "Mercedes-Benz"],
  brands_2w: ["Hero MotoCorp", "Honda", "TVS", "Bajaj", "Royal Enfield", "Yamaha", "Suzuki", "KTM", "Ather", "Ola Electric", "Jawa", "Yezdi"],
  fuelOptions: [
    { id: "Petrol", label: "Petrol", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "M19 16V8m0 0a2 2 0 10-4 0v8m4-8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2v-3M13 11l-4-4m0 4l4-4" },
    { id: "Diesel", label: "Diesel", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30", icon: "M19 16V8m0 0a2 2 0 10-4 0v8m4-8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2v-3M9 11h4" },
    { id: "Electric", label: "Electric", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { id: "CNG", label: "CNG", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" },
    { id: "Hybrid", label: "Hybrid", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }
  ]
};

const VehicleContextPanel: React.FC<VehicleContextPanelProps> = ({ 
  context, 
  onUpdate, 
  onScanRecalls, 
  operatingMode, 
  status 
}) => {
  const [isEditing, setIsEditing] = useState(!isContextComplete(context));
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const syncMessage = useMemo(() => {
    if (syncProgress < 30) return "Parsing Core Metadata...";
    if (syncProgress < 60) return "Validating Digital Twin Registry...";
    if (syncProgress < 90) return "Synchronizing Ecosystem Governance...";
    return "Finalizing Architectural Lock...";
  }, [syncProgress]);

  const validateField = useCallback((name: string, value: any): string | undefined => {
    const currentYear = new Date().getFullYear();
    switch (name) {
      case 'brand':
        if (!value || String(value).trim().length < 2) return "Required";
        break;
      case 'model':
        if (!value || String(value).trim().length < 1) return "Required";
        break;
      case 'year':
        const y = parseInt(value);
        if (!value) return "Required";
        if (isNaN(y) || y < 1990 || y > currentYear + 1) return "Invalid Range";
        break;
      case 'fuelType':
        if (!value) return "Required";
        break;
      case 'batteryCapacity':
        if (context.fuelType === 'Electric' && !value) return "Required";
        break;
      case 'motorPower':
        if (context.fuelType === 'Electric' && !value) return "Required";
        break;
      case 'hvSafetyConfirmed':
        if ((context.fuelType === 'Electric' || context.fuelType === 'Hybrid') && !value) return "Required";
        break;
      case 'registrationNumber':
        if (!value) return "Required";
        const cleanInput = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const standardRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{0,3}[0-9]{4}$/;
        const bhSeriesRegex = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
        if (!standardRegex.test(cleanInput) && !bhSeriesRegex.test(cleanInput)) {
          return "Invalid Format";
        }
        break;
    }
    return undefined;
  }, [context.fuelType]);

  useEffect(() => {
    const newErrors: ValidationErrors = {};
    const fields = ['brand', 'model', 'year', 'fuelType', 'registrationNumber', 'batteryCapacity', 'motorPower', 'hvSafetyConfirmed'];
    fields.forEach(f => {
      const err = validateField(f, (context as any)[f]);
      if (err) (newErrors as any)[f] = err;
    });
    setErrors(newErrors);
  }, [context, validateField]);

  const handleBlur = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    onUpdate({ ...context, [name]: val });
    if (!touched[name]) setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleFuelSelect = (id: string) => {
    onUpdate({ ...context, fuelType: id, batteryCapacity: '', motorPower: '', hvSafetyConfirmed: false });
  };

  const handleTypeSelect = (type: '2W' | '4W') => {
    onUpdate({ ...context, vehicleType: type, brand: '', model: '' });
  };

  const isDataValid = isContextComplete(context) && Object.keys(errors).length === 0;

  const handleLockIdentity = () => {
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
          }, 400);
          return 100;
        }
        return prev + 4;
      });
    }, 30);
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
      <div className="mx-4 mb-8 p-16 bg-[#030303] border border-zinc-800 rounded-[24px] flex flex-col items-center justify-center gap-10 shadow-[0_0_100px_rgba(241,138,34,0.1)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f18a22_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="text-center relative z-10">
          <div className="flex flex-col items-center gap-2 mb-8">
            <h4 className="text-[#f18a22] font-black text-3xl uppercase tracking-[0.4em] animate-pulse">Syncing DNA</h4>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{syncMessage}</span>
          </div>
          
          <div className="relative w-80 h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-[#f18a22] via-orange-400 to-[#f18a22] transition-all duration-150 shadow-[0_0_20px_rgba(241,138,34,0.6)]" 
              style={{ width: `${syncProgress}%` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          </div>

          <div className="mt-6 flex justify-between items-center px-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${syncProgress > (i * 25) ? 'bg-[#f18a22]' : 'bg-zinc-800'}`}></div>
              ))}
            </div>
            <span className="text-[12px] font-mono font-black text-white">{syncProgress}%</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isEditing && isContextComplete(context)) {
    return (
      <div className="mx-4 mb-12 animate-in slide-in-from-top-4 duration-700">
        <div className="bg-[#050505] border border-zinc-800 rounded-[28px] p-10 md:p-14 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] relative overflow-hidden group">
          {/* Subtle Glow Borders */}
          <div className="absolute top-0 left-0 w-2 h-full bg-[#f18a22] shadow-[0_0_30px_rgba(241,138,34,0.4)]"></div>
          <div className="absolute top-0 right-0 w-[1px] h-full bg-zinc-800 group-hover:bg-[#f18a22]/20 transition-colors"></div>
          
          {/* Holographic Scan Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f18a22]/10 to-transparent h-[60%] w-full -translate-y-full animate-scan-slow opacity-20 pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-start justify-between gap-10 mb-14 relative z-10">
            <div className="flex items-center gap-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-green-500/5 border border-green-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.1)] group-hover:scale-105 transition-transform duration-500">
                   <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                   </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-black animate-ping"></div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="text-white font-black text-4xl tracking-tighter uppercase font-mono">Dossier Locked</span>
                  <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span>
                    <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Audit Grade Sync</span>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.4em] font-mono mt-2">Verified Ecosystem Twin • Identity Secured</span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsEditing(true)} 
              className="px-10 py-3.5 bg-zinc-900/40 border border-zinc-800 text-zinc-500 text-[11px] font-black uppercase tracking-[0.25em] rounded-2xl hover:border-[#f18a22]/50 hover:text-white hover:bg-zinc-900 transition-all shadow-xl active:scale-95 flex items-center gap-2 group/btn"
            >
              <svg className="w-3.5 h-3.5 opacity-40 group-hover/btn:rotate-45 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Revoke & Edit
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-end justify-between gap-12 relative z-10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-zinc-700 text-3xl font-black font-mono tracking-widest">{context.year}</span>
                {context.registrationNumber && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                    <span className="text-white text-3xl font-black font-mono tracking-widest bg-zinc-900/50 px-4 py-1 rounded-lg border border-white/5">
                      {context.registrationNumber.toUpperCase()}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-7xl sm:text-9xl font-black text-white tracking-tighter uppercase leading-[0.8] mb-1">
                {context.brand}
              </h2>
              <h3 className="text-5xl sm:text-7xl font-black text-[#f18a22] tracking-tighter uppercase leading-none drop-shadow-[0_0_20px_rgba(241,138,34,0.2)]">
                {context.model}
              </h3>
            </div>
            
            <div className="flex flex-col items-end gap-5">
              <div className="flex items-center gap-5 px-10 py-5 bg-zinc-900/60 border border-white/5 rounded-[24px] shadow-2xl backdrop-blur-2xl group/fuel hover:border-[#f18a22]/20 transition-all">
                 {getFuelIcon(context.fuelType, "w-10 h-10 group-hover/fuel:scale-110 transition-transform")}
                 <div className="flex flex-col">
                   <span className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] font-mono leading-none mb-1">Fueling Vector</span>
                   <span className="text-3xl font-black text-white uppercase tracking-[0.1em] font-mono leading-none">{context.fuelType}</span>
                 </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 pr-2">
                {context.fuelType === 'Electric' && (
                  <div className="flex gap-3">
                    <div className="text-[10px] bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-lg font-mono font-black text-blue-400 uppercase tracking-tighter">
                      {context.batteryCapacity} kWh Cap
                    </div>
                    <div className="text-[10px] bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-lg font-mono font-black text-blue-400 uppercase tracking-tighter">
                      {context.motorPower} kW Power
                    </div>
                  </div>
                )}
                <div className="text-[9px] text-zinc-700 font-mono font-black uppercase tracking-[0.4em]">
                  Unified Governance Instance: Active
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-[0.05] pointer-events-none select-none text-[80px] font-black font-mono whitespace-nowrap">
            G4G-AUDIT-LOCKED-IDENTITY
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode UI
  return (
    <div className="mx-4 mb-8 bg-[#050505] border border-zinc-800 rounded-[28px] p-10 flex flex-col gap-12 shadow-3xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#f18a22]/5 blur-[200px] rounded-full pointer-events-none"></div>
      
      <div className="flex items-center gap-8 relative z-10">
        <div className="w-2 h-14 bg-[#f18a22] rounded-full shadow-[0_0_25px_rgba(241,138,34,0.6)] animate-pulse"></div>
        <div className="flex flex-col">
          <h2 className="text-3xl font-black text-white uppercase tracking-[0.4em] font-mono leading-none mb-3">Initialize Dossier</h2>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-600 font-bold uppercase tracking-[0.3em] font-mono">EKA OS Governance Mode</span>
            <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
            <span className="text-[10px] text-zinc-800 font-black uppercase tracking-widest font-mono">Build: 1.1.0-A</span>
          </div>
        </div>
      </div>

      <div className="form-section relative z-10">
        <div className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-6 font-mono flex items-center gap-2">
          <span className="text-[#f18a22]">01.</span> Architectural Class
        </div>
        <div className="grid grid-cols-2 gap-8">
          <button 
            onClick={() => handleTypeSelect('2W')} 
            className={`flex flex-col items-center justify-center h-48 rounded-[20px] border transition-all duration-300 group ${context.vehicleType === '2W' ? 'bg-zinc-900 border-[#f18a22] shadow-[0_0_40px_rgba(241,138,34,0.1)]' : 'bg-transparent border-zinc-900 hover:border-zinc-700'}`}
          >
            <svg className={`w-16 h-16 mb-6 transition-all duration-500 ${context.vehicleType === '2W' ? 'text-[#f18a22] scale-110' : 'text-zinc-800 group-hover:text-zinc-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" />
            </svg>
            <span className={`text-[13px] font-black uppercase tracking-[0.3em] font-mono transition-colors ${context.vehicleType === '2W' ? 'text-white' : 'text-zinc-700'}`}>2-Wheeler Fleet</span>
          </button>
          <button 
            onClick={() => handleTypeSelect('4W')} 
            className={`flex flex-col items-center justify-center h-48 rounded-[20px] border transition-all duration-300 group ${context.vehicleType === '4W' ? 'bg-zinc-900 border-[#f18a22] shadow-[0_0_40px_rgba(241,138,34,0.1)]' : 'bg-transparent border-zinc-900 hover:border-zinc-700'}`}
          >
            <svg className={`w-16 h-16 mb-6 transition-all duration-500 ${context.vehicleType === '4W' ? 'text-[#f18a22] scale-110' : 'text-zinc-800 group-hover:text-zinc-600'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/>
            </svg>
            <span className={`text-[13px] font-black uppercase tracking-[0.3em] font-mono transition-colors ${context.vehicleType === '4W' ? 'text-white' : 'text-zinc-700'}`}>4-Wheeler Fleet</span>
          </button>
        </div>
      </div>

      <div className="form-section relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 items-end">
          <div className="flex flex-col gap-3">
            <label className={`text-[11px] font-black uppercase tracking-widest font-mono ml-1 ${(touched.registrationNumber && errors.registrationNumber) ? 'text-red-500' : 'text-zinc-600'}`}>Registration Number</label>
            <input 
              name="registrationNumber" 
              value={context.registrationNumber || ''} 
              onChange={handleChange} 
              onBlur={() => handleBlur('registrationNumber')}
              placeholder="MH12AB1234" 
              className={`bg-[#0A0A0A] border rounded-xl px-5 py-4 text-base text-white focus:outline-none transition-all w-full box-border font-black uppercase tracking-widest placeholder:text-zinc-800 ${(touched.registrationNumber && errors.registrationNumber) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'}`}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className={`text-[11px] font-black uppercase tracking-widest font-mono ml-1 ${(touched.brand && errors.brand) ? 'text-red-500' : 'text-zinc-600'}`}>Brand</label>
            <input 
              name="brand" 
              list="brand-list" 
              value={context.brand} 
              onChange={handleChange} 
              onBlur={() => handleBlur('brand')}
              placeholder="Manufacturer" 
              className={`bg-[#0A0A0A] border rounded-xl px-5 py-4 text-base text-white focus:outline-none transition-all w-full box-border font-bold ${(touched.brand && errors.brand) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'}`}
            />
            <datalist id="brand-list">{context.vehicleType === '2W' ? DATA_STORE.brands_2w.map(b => <option key={b} value={b}/>) : DATA_STORE.brands_4w.map(b => <option key={b} value={b}/>)}</datalist>
          </div>

          <div className="flex flex-col gap-3">
            <label className={`text-[11px] font-black uppercase tracking-widest font-mono ml-1 ${(touched.model && errors.model) ? 'text-red-500' : 'text-zinc-600'}`}>Model</label>
            <input 
              name="model" 
              value={context.model} 
              onChange={handleChange} 
              onBlur={() => handleBlur('model')}
              placeholder="Variant Name" 
              className={`bg-[#0A0A0A] border rounded-xl px-5 py-4 text-base text-white focus:outline-none transition-all w-full box-border font-bold ${(touched.model && errors.model) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'}`}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className={`text-[11px] font-black uppercase tracking-widest font-mono ml-1 ${(touched.year && errors.year) ? 'text-red-500' : 'text-zinc-600'}`}>Year</label>
            <input 
              name="year" 
              value={context.year} 
              onChange={handleChange} 
              onBlur={() => handleBlur('year')}
              placeholder="YYYY" 
              className={`bg-[#0A0A0A] border rounded-xl px-5 py-4 text-base text-white focus:outline-none transition-all w-full box-border font-bold ${(touched.year && errors.year) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'}`}
            />
          </div>
        </div>
      </div>

      <div className="form-section relative z-10">
        <div className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-6 font-mono flex items-center gap-2">
          <span className="text-[#f18a22]">02.</span> Propulsion Protocol
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
          {DATA_STORE.fuelOptions.map((fuel) => (
            <button
              key={fuel.id}
              onClick={() => handleFuelSelect(fuel.id)}
              className={`flex flex-col items-center justify-center py-8 rounded-2xl border transition-all duration-300 ${context.fuelType === fuel.id ? 'bg-[#f18a22]/10 border-[#f18a22] shadow-[0_0_20px_rgba(241,138,34,0.1)]' : 'bg-transparent border-zinc-900 hover:border-zinc-700'}`}
            >
              <div className="mb-4 transition-transform group-hover:scale-110">{getFuelIcon(fuel.id, "w-10 h-10")}</div>
              <span className={`text-[11px] font-black uppercase tracking-widest font-mono ${context.fuelType === fuel.id ? 'text-white' : 'text-zinc-800'}`}>{fuel.label}</span>
            </button>
          ))}
        </div>
      </div>

      {(context.fuelType === 'Electric' || context.fuelType === 'Hybrid') && (
        <div className="form-section animate-in slide-in-from-top-4 duration-500 relative z-10">
          <div className="p-8 bg-red-950/10 border border-red-900/30 rounded-[24px] flex flex-col gap-6">
            <div className="flex items-center gap-4">
               <svg className="w-8 h-8 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
               <div className="flex flex-col">
                 <span className="text-[12px] font-black text-red-500 uppercase tracking-widest font-mono">HV Safety Attestation Required</span>
                 <span className="text-[10px] text-zinc-600 font-bold uppercase font-mono">Critical Diagnostic Pre-requisite</span>
               </div>
            </div>
            
            <label className="flex items-start gap-5 cursor-pointer group/safety">
              <div className="pt-1">
                <input 
                  type="checkbox" 
                  name="hvSafetyConfirmed"
                  checked={context.hvSafetyConfirmed || false}
                  onChange={handleChange}
                  className="hidden peer"
                />
                <div className="w-6 h-6 border-2 rounded-lg border-red-900/50 peer-checked:bg-red-600 peer-checked:border-red-600 transition-all flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-black opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className={`text-[12px] font-bold leading-relaxed transition-colors ${context.hvSafetyConfirmed ? 'text-zinc-200' : 'text-zinc-500 group-hover/safety:text-zinc-400'}`}>
                  I hereby confirm that high-voltage system safety protocols have been duly verified. I attest that all isolation procedures and PPE requirements are understood prior to establishing diagnostic link.
                </span>
                {!context.hvSafetyConfirmed && touched.hvSafetyConfirmed && (
                  <span className="text-[9px] text-red-500 font-black uppercase mt-2 tracking-widest font-mono">Governance Error: Confirmation Missing</span>
                )}
              </div>
            </label>
          </div>
        </div>
      )}

      {isContextComplete(context) && (
        <div className="pt-10 border-t border-white/5 relative z-10">
           <button 
             onClick={handleLockIdentity} 
             disabled={!isDataValid}
             className={`w-full py-6 text-[18px] font-black uppercase tracking-[0.5em] rounded-[20px] transition-all duration-500 font-mono shadow-2xl ${isDataValid ? 'bg-[#f18a22] text-black hover:bg-white hover:scale-[1.01] active:scale-95' : 'bg-zinc-900 text-zinc-700 grayscale cursor-not-allowed'}`}
           >
            {isDataValid ? 'Synchronize Identity' : 'Incomplete Architecture'}
           </button>
        </div>
      )}

      <style>{`
        @keyframes scan-slow {
          0% { transform: translateY(-120%); }
          100% { transform: translateY(280%); }
        }
        .animate-scan-slow {
          animation: scan-slow 4s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default VehicleContextPanel;
