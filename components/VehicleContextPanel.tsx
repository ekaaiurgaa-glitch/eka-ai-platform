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
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: any): string | undefined => {
    const currentYear = new Date().getFullYear();
    switch (name) {
      case 'brand':
        if (!value || value.trim().length < 2) return "Required";
        break;
      case 'model':
        if (!value || value.trim().length < 1) return "Required";
        break;
      case 'year':
        const y = parseInt(value);
        if (!value) return "Required";
        if (isNaN(y) || y < 1990 || y > currentYear + 1) return "Invalid";
        break;
      case 'fuelType':
        if (!value) return "Required";
        break;
    }
    return undefined;
  }, []);

  useEffect(() => {
    const newErrors: ValidationErrors = {};
    const fields = ['brand', 'model', 'year', 'fuelType'];
    fields.forEach(f => {
      const err = validateField(f, (context as any)[f]);
      if (err) (newErrors as any)[f] = err;
    });
    setErrors(newErrors);
  }, [context, validateField]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    onUpdate({ ...context, [name]: val });
  };

  const handleFuelSelect = (id: string) => {
    onUpdate({ ...context, fuelType: id });
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
          }, 600);
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
      <div className="mx-4 mb-8 p-12 bg-[#050505] border border-zinc-800 rounded-[20px] flex flex-col items-center justify-center gap-8 animate-pulse">
        <div className="text-center">
          <h4 className="text-[#f18a22] font-black text-xl uppercase tracking-[0.4em] mb-4">Syncing Digital Twin...</h4>
          <div className="w-64 h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-[#f18a22] transition-all duration-300" style={{ width: `${syncProgress}%` }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isEditing && isContextComplete(context)) {
    return (
      <div className="mx-4 mb-12 animate-in slide-in-from-top-4 duration-700">
        <div className="bg-[#050505] border border-zinc-800 rounded-[20px] p-10 md:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#f18a22]"></div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-10 border-b border-white/5 pb-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                 <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                 </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-2xl tracking-tighter uppercase font-mono">Digital Twin Synchronized</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] font-mono">G4G Architecture Active</span>
              </div>
            </div>
            <button 
              onClick={() => setIsEditing(true)} 
              className="px-6 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:border-[#f18a22] hover:text-white transition-all"
            >
              Modify
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-end justify-between gap-6">
            <div className="flex flex-col">
              <span className="text-zinc-700 text-3xl font-black font-mono mb-2">{context.year}</span>
              <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter uppercase leading-none">
                {context.brand} <span className="text-[#f18a22]">{context.model}</span>
              </h2>
            </div>
            <div className="flex items-center gap-4 px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
               {getFuelIcon(context.fuelType, "w-6 h-6")}
               <span className="text-lg font-black text-white uppercase tracking-widest">{context.fuelType}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-8 bg-[#050505] border border-zinc-800 rounded-[20px] p-10 flex flex-col gap-10 shadow-3xl">
      
      {/* Structural Header */}
      <div className="flex items-start gap-6">
        <div className="w-[6px] h-12 bg-[#f18a22] rounded-full shrink-0"></div>
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-white uppercase tracking-[0.3em] font-mono leading-none mb-2">Architect Vehicle Dossier</h2>
          <span className="text-[11px] text-zinc-600 font-bold uppercase tracking-[0.25em] font-mono">EKA-Ai Central Governance Initialization</span>
        </div>
      </div>

      {/* Architectural Class (50/50 Split) */}
      <div className="form-section">
        <div className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 font-mono">01. Architectural Class</div>
        <div className="grid grid-cols-2 gap-6">
          <button 
            onClick={() => handleTypeSelect('2W')} 
            className={`flex flex-col items-center justify-center h-40 rounded-xl border transition-all ${context.vehicleType === '2W' ? 'bg-[#0A0A0A] border-[#f18a22] shadow-[0_0_20px_rgba(241,138,34,0.1)]' : 'bg-[#0A0A0A] border-zinc-900 hover:border-zinc-700'}`}
          >
            <svg className={`w-12 h-12 mb-4 ${context.vehicleType === '2W' ? 'text-[#f18a22]' : 'text-zinc-800'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" />
            </svg>
            <span className={`text-[12px] font-black uppercase tracking-[0.2em] font-mono ${context.vehicleType === '2W' ? 'text-white' : 'text-zinc-600'}`}>2-Wheeler Fleet</span>
          </button>
          <button 
            onClick={() => handleTypeSelect('4W')} 
            className={`flex flex-col items-center justify-center h-40 rounded-xl border transition-all ${context.vehicleType === '4W' ? 'bg-[#0A0A0A] border-[#f18a22] shadow-[0_0_20px_rgba(241,138,34,0.1)]' : 'bg-[#0A0A0A] border-zinc-900 hover:border-zinc-700'}`}
          >
            <svg className={`w-12 h-12 mb-4 ${context.vehicleType === '4W' ? 'text-[#f18a22]' : 'text-zinc-800'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/>
            </svg>
            <span className={`text-[12px] font-black uppercase tracking-[0.2em] font-mono ${context.vehicleType === '4W' ? 'text-white' : 'text-zinc-600'}`}>4-Wheeler Fleet</span>
          </button>
        </div>
      </div>

      {/* Details Inputs (The Fix: 2fr 2fr 1fr Grid) */}
      <div className="form-section">
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1fr] gap-6 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono ml-1">Manufacturer Brand</label>
            <input 
              name="brand" 
              list="brand-list" 
              value={context.brand} 
              onChange={handleChange} 
              placeholder="e.g. Tata Motors" 
              className="bg-[#0A0A0A] border border-zinc-900 rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all w-full box-border font-bold"
            />
            <datalist id="brand-list">{context.vehicleType === '2W' ? DATA_STORE.brands_2w.map(b => <option key={b} value={b}/>) : DATA_STORE.brands_4w.map(b => <option key={b} value={b}/>)}</datalist>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono ml-1">Series / Model</label>
            <input 
              name="model" 
              value={context.model} 
              onChange={handleChange} 
              placeholder="e.g. Nexon EV" 
              className="bg-[#0A0A0A] border border-zinc-900 rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all w-full box-border font-bold"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono ml-1">Year</label>
            <input 
              name="year" 
              value={context.year} 
              onChange={handleChange} 
              placeholder="2024" 
              className="bg-[#0A0A0A] border border-zinc-900 rounded-lg px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all w-full box-border font-bold"
            />
          </div>
        </div>
      </div>

      {/* Propulsion Type */}
      <div className="form-section">
        <div className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 font-mono">02. Propulsion Type</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {DATA_STORE.fuelOptions.map((fuel) => (
            <button
              key={fuel.id}
              onClick={() => handleFuelSelect(fuel.id)}
              className={`flex flex-col items-center justify-center py-6 rounded-xl border transition-all ${context.fuelType === fuel.id ? 'bg-[#f18a22]/10 border-[#f18a22]' : 'bg-[#0A0A0A] border-zinc-900 hover:border-zinc-700'}`}
            >
              <div className="mb-3">{getFuelIcon(fuel.id, "w-8 h-8")}</div>
              <span className={`text-[10px] font-black uppercase tracking-widest font-mono ${context.fuelType === fuel.id ? 'text-white' : 'text-zinc-700'}`}>{fuel.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isContextComplete(context) && (
        <div className="pt-6 border-t border-white/5">
           <button 
             onClick={handleLockIdentity} 
             disabled={!isDataValid}
             className={`w-full py-5 text-[15px] font-black uppercase tracking-[0.4em] rounded-xl transition-all font-mono ${isDataValid ? 'bg-[#f18a22] text-black hover:bg-white shadow-xl active:scale-[0.98]' : 'bg-zinc-900 text-zinc-700'}`}
           >
            {isDataValid ? 'Finalize Digital Twin Dossier' : 'Incomplete Architecture'}
           </button>
        </div>
      )}
    </div>
  );
};

export default VehicleContextPanel;
