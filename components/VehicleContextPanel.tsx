
import React, { useState, useEffect } from 'react';
import { VehicleContext, isContextComplete, OperatingMode, JobStatus } from '../types';

interface VehicleContextPanelProps {
  context: VehicleContext;
  onUpdate: (updated: VehicleContext) => void;
  onScanRecalls?: () => void;
  operatingMode?: OperatingMode;
  status?: JobStatus;
}

const FUEL_OPTIONS = [
  { id: "Petrol", label: "Petrol" },
  { id: "Diesel", label: "Diesel" },
  { id: "Electric", label: "Electric" },
  { id: "CNG", label: "CNG" },
  { id: "Hybrid", label: "Hybrid" }
];

const VehicleContextPanel: React.FC<VehicleContextPanelProps> = ({ 
  context, 
  onUpdate, 
  operatingMode, 
  status 
}) => {
  const [isEditing, setIsEditing] = useState(!isContextComplete(context));
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case 'brand':
        if (!value.trim()) error = "Manufacturer required";
        else if (value.trim().length < 2) error = "Invalid brand";
        break;
      case 'model':
        if (!value.trim()) error = "Variant required";
        break;
      case 'year':
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (!value) error = "Year required";
        else if (isNaN(year) || year < 1900 || year > currentYear + 1) error = `Range: 1900-${currentYear + 1}`;
        break;
      case 'fuelType':
        if (!value) error = "Select propulsion";
        break;
      default:
        break;
    }
    return error;
  };

  const handleLockIdentity = () => {
    const newErrors: Record<string, string> = {
      brand: validateField('brand', context.brand),
      model: validateField('model', context.model),
      year: validateField('year', context.year),
      fuelType: validateField('fuelType', context.fuelType)
    };

    setErrors(newErrors);
    const hasErrors = Object.values(newErrors).some(err => err !== "");
    if (hasErrors || !isContextComplete(context)) return;

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
          }, 1800);
          return 100;
        }
        return prev + 4;
      });
    }, 25);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    onUpdate({ ...context, [name]: value });
  };

  const InputBox = ({ label, name, value, placeholder }: any) => (
    <div className={`flex flex-col gap-1 p-3 bg-[#080808] border-2 rounded transition-all duration-300 ${errors[name] ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-zinc-800 focus-within:border-[#f18a22]'}`}>
      <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest font-mono">{label}</label>
      <input 
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="bg-transparent text-white text-[12px] font-bold focus:outline-none placeholder:text-zinc-800 font-mono uppercase"
      />
      {errors[name] && <span className="text-[7px] font-bold text-red-500 uppercase font-mono mt-1">{errors[name]}</span>}
    </div>
  );

  const DataNode = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col border-l-2 border-zinc-800 pl-4 py-1">
      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-1">{label}</span>
      <span className="text-[13px] font-black text-white font-mono uppercase tracking-tight truncate">{value || 'NOT_SET'}</span>
    </div>
  );

  if (isSyncing) {
    return (
      <div className="mb-8 p-12 bg-black border-4 border-[#f18a22] rounded-xl flex flex-col items-center justify-center relative overflow-hidden min-h-[250px] shadow-2xl">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#f18a22 1px, transparent 1px), linear-gradient(90deg, #f18a22 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {showSuccess ? (
          <div className="text-center animate-in zoom-in-95 duration-500 flex flex-col items-center z-10">
            <div className="w-20 h-20 rounded-2xl bg-green-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] rotate-3">
              <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-white font-black text-2xl uppercase tracking-[0.2em] font-mono mb-2">Terminal Secured</h4>
            <p className="text-green-500 text-[9px] font-bold uppercase tracking-[0.4em] font-mono animate-pulse">Digital Twin Synchronized</p>
          </div>
        ) : (
          <div className="text-center w-full max-w-sm z-10">
            <div className="flex justify-between items-end mb-4 px-1">
               <h4 className="text-[#f18a22] font-black text-[10px] uppercase tracking-[0.4em] font-mono">Syncing Logic Nodes...</h4>
               <span className="text-white font-mono font-black text-xl">{syncProgress}%</span>
            </div>
            <div className="relative w-full h-4 bg-zinc-900 rounded border-2 border-[#f18a22] overflow-hidden">
              <div className="h-full bg-[#f18a22] transition-all duration-100 relative" style={{ width: `${syncProgress}%` }}>
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-8 opacity-40">
               {['BIOMETRIC', 'REGISTRY', 'COMPLIANCE'].map(n => (
                 <div key={n} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f18a22]"></div>
                    <span className="text-[7px] font-black text-white uppercase font-mono">{n}</span>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!isEditing && isContextComplete(context)) {
    return (
      <div className="mb-8 animate-in slide-in-from-top-4 duration-500 group">
        <div className="bg-[#050505] border-4 border-[#f18a22] rounded-xl p-8 shadow-2xl relative overflow-hidden">
          {/* VERIFIED WATERMARK */}
          <div className="absolute -right-4 -bottom-4 opacity-5 rotate-[-25deg] pointer-events-none select-none">
             <span className="text-9xl font-black text-white font-mono">G4G_OK</span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 mb-8 pb-6 border-b-2 border-zinc-900">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-zinc-900 border-2 border-[#f18a22] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#f18a22]/20 transition-all">
                <svg className="w-8 h-8 text-[#f18a22]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] font-mono">Verified Identity Dossier</span>
                <h3 className="text-white font-black text-2xl uppercase tracking-tighter font-mono leading-none mt-1">
                  {context.registrationNumber || 'MH-12-G4G'}
                </h3>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-end mr-4">
                  <span className="text-[8px] font-black text-zinc-600 uppercase font-mono">Security Clearance</span>
                  <span className="text-[10px] font-black text-green-500 uppercase font-mono tracking-widest">LOCKED_DTR_v1</span>
               </div>
               <button 
                onClick={() => setIsEditing(true)} 
                className="px-6 py-2.5 bg-black border-2 border-red-500/40 text-red-500 text-[10px] font-black uppercase rounded hover:bg-red-500 hover:text-black transition-all font-mono tracking-widest"
              >
                Security Override
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
             <DataNode label="Manufacturer" value={context.brand} />
             <DataNode label="Model/Variant" value={context.model} />
             <DataNode label="Lifecycle Year" value={context.year} />
             <DataNode label="Energy Node" value={context.fuelType} />
          </div>
        </div>
      </div>
    );
  }

  const hasAnyErrors = Object.values(errors).some(err => err !== "");
  const canLock = isContextComplete(context) && !hasAnyErrors;

  return (
    <div className="mb-8 bg-[#050505] border-4 border-[#f18a22] rounded-xl p-8 shadow-2xl flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start border-b-4 border-[#f18a22] pb-6">
        <div className="flex flex-col">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight font-mono">Initialization</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2 font-mono">Awaiting Architectural Context</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded">
           <div className="w-1.5 h-1.5 rounded-full bg-[#f18a22] animate-pulse"></div>
           <span className="text-[8px] font-black text-zinc-400 uppercase font-mono">Terminal Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InputBox label="Identity Tag" name="registrationNumber" value={context.registrationNumber || ''} placeholder="MH-XX-XX-XXXX" />
        <InputBox label="Manufacturer" name="brand" value={context.brand} placeholder="MARUTI SUZUKI" />
        <InputBox label="Model Variant" name="model" value={context.model} placeholder="SWIFT ZXI" />
        <InputBox label="Production Year" name="year" value={context.year} placeholder="2024" />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono">Propulsion Configuration</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {FUEL_OPTIONS.map((fuel) => (
            <button
              key={fuel.id}
              onClick={() => onUpdate({ ...context, fuelType: fuel.id })}
              className={`py-4 rounded border-2 text-[10px] font-black uppercase font-mono transition-all duration-300 ${context.fuelType === fuel.id ? 'bg-[#f18a22] text-black border-[#f18a22] shadow-[0_0_15px_rgba(241,138,34,0.3)]' : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-500'}`}
            >
              {fuel.label}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={handleLockIdentity} 
        disabled={!canLock}
        className={`w-full py-6 text-[18px] font-black uppercase tracking-[0.6em] rounded-xl transition-all font-mono border-4 ${canLock ? 'bg-[#f18a22] text-black border-black hover:bg-white active:scale-95 shadow-[0_20px_40px_rgba(241,138,34,0.3)]' : 'bg-zinc-900 text-zinc-800 border-zinc-950 cursor-not-allowed opacity-40'}`}
      >
        {canLock ? 'Lock Identity Terminal' : 'Awaiting Context Nodes...'}
      </button>
    </div>
  );
};

export default VehicleContextPanel;
