
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
  const [showSuccess, setShowSuccess] = useState(false);
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
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setIsSyncing(false);
            setIsEditing(false);
          }, 1200);
          return 100;
        }
        return prev + 5;
      });
    }, 20);
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
      <div className="mx-4 mb-8 p-12 bg-[#030303] border border-zinc-800 rounded-[24px] flex flex-col items-center justify-center gap-8 shadow-[0_0_80px_rgba(241,138,34,0.1)] relative overflow-hidden h-[300px]">
        {showSuccess ? (
          <div className="text-center relative z-20 animate-in zoom-in-95 fade-in duration-300">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-white font-black text-2xl uppercase tracking-[0.2em] mb-1 font-mono">Dossier Locked</h4>
            <p className="text-green-500 font-black text-[9px] uppercase tracking-[0.4em] font-mono">Synchronization Complete</p>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#f18a22_1px,transparent_1px)] [background-size:20px_20px]"></div>
            <div className="text-center relative z-10 w-full max-w-xs">
              <div className="flex flex-col items-center gap-2 mb-6">
                <h4 className="text-[#f18a22] font-black text-2xl uppercase tracking-[0.3em] animate-pulse font-mono">Handshake...</h4>
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{syncMessage}</span>
              </div>
              
              <div className="relative w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-[#f18a22] via-orange-400 to-[#f18a22] transition-all duration-150" 
                  style={{ width: `${syncProgress}%` }}
                ></div>
              </div>

              <div className="mt-6 flex justify-between items-center px-1">
                <span className="text-sm font-mono font-black text-zinc-500">{syncProgress}%</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${syncProgress > (i * 33) ? 'bg-[#f18a22]' : 'bg-zinc-800'}`}></div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (!isEditing && isContextComplete(context)) {
    return (
      <div className="mx-4 mb-10 animate-in slide-in-from-top-4 duration-500">
        <div className="bg-[#050505] border border-zinc-800 rounded-[20px] p-8 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          {/* Subtle Side Accent */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#f18a22] shadow-[0_0_20px_rgba(241,138,34,0.3)]"></div>
          
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-green-500/5 border border-green-500/30 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500">
                   <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                   </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-white font-black text-xl tracking-tighter uppercase font-mono leading-none">Identity Verified</span>
                   <div className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-500"></span>
                    <span className="text-[7px] font-black text-green-500 uppercase tracking-widest font-mono">Locked</span>
                  </div>
                </div>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] font-mono">Central OS Triage Protocol Active</span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsEditing(true)} 
              className="px-6 py-2.5 bg-zinc-900/40 border border-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:border-[#f18a22]/50 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Revoke Lock
            </button>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-end justify-between gap-8 relative z-10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-zinc-700 text-xl font-black font-mono tracking-widest">{context.year}</span>
                {context.registrationNumber && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                    <span className="text-white text-lg font-black font-mono tracking-widest bg-zinc-900/50 px-3 py-0.5 rounded border border-white/5">
                      {context.registrationNumber.toUpperCase()}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                {context.brand} <span className="text-[#f18a22] block sm:inline">{context.model}</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-4 px-6 py-3 bg-zinc-900/60 border border-white/5 rounded-2xl shadow-xl backdrop-blur-md group/fuel hover:border-[#f18a22]/20 transition-all">
               {getFuelIcon(context.fuelType, "w-6 h-6")}
               <div className="flex flex-col">
                 <span className="text-zinc-500 text-[7px] font-black uppercase tracking-[0.2em] font-mono leading-none mb-1">Propulsion</span>
                 <span className="text-lg font-black text-white uppercase tracking-[0.1em] font-mono leading-none">{context.fuelType}</span>
               </div>
            </div>
          </div>
          
          {/* Subtle scanline overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f18a22]/5 to-transparent h-[50%] w-full -translate-y-full animate-scan-slow opacity-10 pointer-events-none"></div>
        </div>
      </div>
    );
  }

  // Edit Mode UI (Simplified and Smaller)
  return (
    <div className="mx-4 mb-8 bg-[#050505] border border-zinc-800 rounded-[20px] p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#f18a22]/5 blur-[80px] rounded-full pointer-events-none"></div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-1.5 h-10 bg-[#f18a22] rounded-full shadow-[0_0_15px_rgba(241,138,34,0.4)]"></div>
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-white uppercase tracking-[0.3em] font-mono leading-none mb-2">Initialize Dossier</h2>
          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.3em] font-mono">EKA OS 1.1.0-STABLE</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <button 
          onClick={() => handleTypeSelect('2W')} 
          className={`flex items-center gap-4 h-20 px-6 rounded-xl border transition-all duration-300 group ${context.vehicleType === '2W' ? 'bg-zinc-900 border-[#f18a22] shadow-[0_0_20px_rgba(241,138,34,0.1)]' : 'bg-transparent border-zinc-900 hover:border-zinc-800'}`}
        >
          <svg className={`w-8 h-8 ${context.vehicleType === '2W' ? 'text-[#f18a22]' : 'text-zinc-800 group-hover:text-zinc-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" />
          </svg>
          <span className={`text-[11px] font-black uppercase tracking-[0.2em] font-mono ${context.vehicleType === '2W' ? 'text-white' : 'text-zinc-700'}`}>2-Wheeler</span>
        </button>
        <button 
          onClick={() => handleTypeSelect('4W')} 
          className={`flex items-center gap-4 h-20 px-6 rounded-xl border transition-all duration-300 group ${context.vehicleType === '4W' ? 'bg-zinc-900 border-[#f18a22] shadow-[0_0_20px_rgba(241,138,34,0.1)]' : 'bg-transparent border-zinc-900 hover:border-zinc-800'}`}
        >
          <svg className={`w-8 h-8 ${context.vehicleType === '4W' ? 'text-[#f18a22]' : 'text-zinc-800 group-hover:text-zinc-700'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/>
          </svg>
          <span className={`text-[11px] font-black uppercase tracking-[0.2em] font-mono ${context.vehicleType === '4W' ? 'text-white' : 'text-zinc-700'}`}>4-Wheeler</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end relative z-10">
        <div className="flex flex-col gap-2">
          <label className={`text-[9px] font-black uppercase tracking-widest font-mono ml-1 ${(touched.registrationNumber && errors.registrationNumber) ? 'text-red-500' : 'text-zinc-700'}`}>Reg No</label>
          <input 
            name="registrationNumber" 
            value={context.registrationNumber || ''} 
            onChange={handleChange} 
            onBlur={() => handleBlur('registrationNumber')}
            placeholder="MH12AB1234" 
            className={`bg-[#0A0A0A] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all w-full box-border font-black uppercase tracking-widest ${(touched.registrationNumber && errors.registrationNumber) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'}`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={`text-[9px] font-black uppercase tracking-widest font-mono ml-1 ${(touched.brand && errors.brand) ? 'text-red-500' : 'text-zinc-700'}`}>Brand</label>
          <input 
            name="brand" 
            list="brand-list-mini" 
            value={context.brand} 
            onChange={handleChange} 
            onBlur={() => handleBlur('brand')}
            placeholder="Manufacturer" 
            className={`bg-[#0A0A0A] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all w-full box-border font-bold ${(touched.brand && errors.brand) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'}`}
          />
          <datalist id="brand-list-mini">{context.vehicleType === '2W' ? DATA_STORE.brands_2w.map(b => <option key={b} value={b}/>) : DATA_STORE.brands_4w.map(b => <option key={b} value={b}/>)}</datalist>
        </div>
        <div className="flex flex-col gap-2">
          <label className={`text-[9px] font-black uppercase tracking-widest font-mono ml-1 ${(touched.model && errors.model) ? 'text-red-500' : 'text-zinc-700'}`}>Model</label>
          <input 
            name="model" 
            value={context.model} 
            onChange={handleChange} 
            onBlur={() => handleBlur('model')}
            placeholder="Variant" 
            className={`bg-[#0A0A0A] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all w-full box-border font-bold ${(touched.model && errors.model) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'}`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={`text-[9px] font-black uppercase tracking-widest font-mono ml-1 ${(touched.year && errors.year) ? 'text-red-500' : 'text-zinc-700'}`}>Year</label>
          <input 
            name="year" 
            value={context.year} 
            onChange={handleChange} 
            onBlur={() => handleBlur('year')}
            placeholder="YYYY" 
            className={`bg-[#0A0A0A] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all w-full box-border font-bold ${(touched.year && errors.year) ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-900 focus:border-[#f18a22]'}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 relative z-10">
        {DATA_STORE.fuelOptions.map((fuel) => (
          <button
            key={fuel.id}
            onClick={() => handleFuelSelect(fuel.id)}
            className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all duration-300 ${context.fuelType === fuel.id ? 'bg-[#f18a22]/10 border-[#f18a22] shadow-sm' : 'bg-transparent border-zinc-900 hover:border-zinc-800'}`}
          >
            <div className="mb-2">{getFuelIcon(fuel.id, "w-5 h-5")}</div>
            <span className={`text-[8px] font-black uppercase tracking-widest font-mono ${context.fuelType === fuel.id ? 'text-white' : 'text-zinc-800'}`}>{fuel.label}</span>
          </button>
        ))}
      </div>

      {isContextComplete(context) && (
        <div className="pt-6 border-t border-white/5 relative z-10">
           <button 
             onClick={handleLockIdentity} 
             disabled={!isDataValid}
             className={`w-full py-4 text-[14px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-300 font-mono flex items-center justify-center gap-3 ${isDataValid ? 'bg-[#f18a22] text-black hover:bg-white active:scale-95' : 'bg-zinc-900 text-zinc-800 grayscale cursor-not-allowed'}`}
           >
            {isDataValid ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Lock Architecture
              </>
            ) : 'Incomplete'}
           </button>
        </div>
      )}

      <style>{`
        @keyframes scan-slow {
          0% { transform: translateY(-120%); }
          100% { transform: translateY(280%); }
        }
        .animate-scan-slow {
          animation: scan-slow 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default VehicleContextPanel;
