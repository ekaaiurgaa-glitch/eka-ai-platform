
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

const VEHICLE_TYPES = [
  { id: "2W", label: "Two-Wheeler" },
  { id: "4W", label: "Four-Wheeler" }
];

const SYNC_MESSAGES = [
  "Initializing Auth Gate...",
  "Authenticating VIN Nodes...",
  "Syncing G4G Registry...",
  "Encrypting Logic Dossier...",
  "Securing Terminal Link...",
  "Finalizing Architecture..."
];

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
  const [syncMessage, setSyncMessage] = useState(SYNC_MESSAGES[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case 'brand':
        if (!value.trim()) error = "Manufacturer Identity Required";
        else if (value.trim().length < 2) error = "Logic Minimum: 2 Chars";
        break;
      case 'model':
        if (!value.trim()) error = "Model Variant Required";
        break;
      case 'year':
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (!value) error = "Production Year Required";
        else if (isNaN(year) || year < 1900 || year > currentYear + 1) error = `Range Violation: 1900-${currentYear + 1}`;
        break;
      case 'registrationNumber':
        if (!value.trim()) error = "DTR Identity (Reg) Required";
        break;
      case 'fuelType':
        if (!value) error = "Energy Type Undefined";
        break;
      case 'vin':
        if (context.vehicleType === '4W') {
          const vinRegex = /^[A-Z0-9-]{11,17}$/i;
          if (!value) error = "VIN Node Required for 4W";
          else if (!vinRegex.test(value)) error = "Format Breach: 11-17 Alphanum";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleLockIdentity = () => {
    const allFields = ['brand', 'model', 'year', 'registrationNumber', 'fuelType', 'vin'];
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};
    
    allFields.forEach(field => {
      const val = (context as any)[field] || '';
      const err = validateField(field, val);
      if (err) newErrors[field] = err;
      newTouched[field] = true;
    });

    setErrors(newErrors);
    setTouched(newTouched);

    const hasErrors = Object.keys(newErrors).length > 0;
    if (hasErrors || !isContextComplete(context)) return;

    setIsSyncing(true);
    setSyncProgress(0);
    
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        const next = prev + 4;
        const msgIndex = Math.floor((next / 100) * SYNC_MESSAGES.length);
        if (SYNC_MESSAGES[msgIndex]) setSyncMessage(SYNC_MESSAGES[msgIndex]);

        if (next >= 100) {
          clearInterval(interval);
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setIsSyncing(false);
            setIsEditing(false);
          }, 1800);
          return 100;
        }
        return next;
      });
    }, 40);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    onUpdate({ ...context, [name]: value });
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, (context as any)[name] || '');
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const InputBox = ({ label, name, value, placeholder, className = "" }: any) => {
    const showError = touched[name] && !!errors[name];
    return (
      <div className={`flex flex-col gap-1.5 p-3 bg-[#080808] border-2 rounded transition-all duration-300 ${showError ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-zinc-800 focus-within:border-[#f18a22]'} ${className}`}>
        <div className="flex justify-between items-center">
          <label className={`text-[8px] font-black uppercase tracking-widest font-mono ${showError ? 'text-red-500' : 'text-zinc-600'}`}>{label}</label>
          {showError && (
            <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-300">
              <span className="text-[7px] font-black text-red-500 uppercase font-mono tracking-tighter">{errors[name]}</span>
              <span className="text-[10px]">⚠️</span>
            </div>
          )}
        </div>
        <input 
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={() => handleBlur(name)}
          placeholder={placeholder}
          className={`bg-transparent text-white text-[12px] font-bold focus:outline-none placeholder:text-zinc-800 font-mono uppercase ${showError ? 'text-red-400' : ''}`}
        />
      </div>
    );
  };

  const DataNode = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col border-l-2 border-zinc-800 pl-4 py-1 hover:border-[#f18a22] transition-colors group">
      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-1 group-hover:text-[#f18a22]">{label}</span>
      <span className="text-[13px] font-black text-white font-mono uppercase tracking-tight truncate">{value || 'NULL'}</span>
    </div>
  );

  if (isSyncing) {
    return (
      <div className="mb-8 p-12 bg-[#020202] border-4 border-[#f18a22] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[400px] shadow-[0_0_80px_rgba(241,138,34,0.25)] animate-in zoom-in-95 duration-500">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#f18a22 1px, transparent 1px), linear-gradient(90deg, #f18a22 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none"></div>

        {showSuccess ? (
          <div className="text-center animate-in scale-in duration-700 flex flex-col items-center z-10">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 animate-pulse"></div>
              <div className="w-28 h-28 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_60px_rgba(34,197,94,0.7)] border-8 border-black z-20 relative">
                <svg className="w-16 h-16 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h4 className="text-white font-black text-4xl uppercase tracking-[0.4em] font-mono mb-4">Protocol Active</h4>
            <p className="text-green-500 text-[12px] font-bold uppercase tracking-[0.6em] font-mono animate-pulse">Vehicle Identity Secured & Synchronized</p>
          </div>
        ) : (
          <div className="text-center w-full max-w-lg z-10 space-y-12">
            <div className="flex flex-col items-center gap-6">
               <div className="flex flex-col items-center gap-2">
                 <div className="flex items-center gap-4">
                   <div className="w-3 h-3 rounded-full bg-[#f18a22] animate-ping"></div>
                   <h4 className="text-[#f18a22] font-black text-[14px] uppercase tracking-[0.6em] font-mono leading-none">{syncMessage}</h4>
                 </div>
                 <span className="text-zinc-600 text-[9px] font-black font-mono tracking-widest uppercase mt-2">Gate ID: G4G-OS-HUD-SEC-LINK</span>
               </div>
               <span className="text-white font-mono font-black text-6xl tracking-tighter drop-shadow-lg">{syncProgress}%</span>
            </div>
            
            <div className="relative w-full h-8 bg-zinc-950 rounded-full border-2 border-zinc-800 overflow-hidden p-1.5 shadow-2xl">
              <div 
                className="h-full bg-gradient-to-r from-[#f18a22] via-orange-400 to-white transition-all duration-100 relative rounded-full shadow-[0_0_30px_rgba(241,138,34,0.6)]" 
                style={{ width: `${syncProgress}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:24px_24px] animate-[progress-move_1s_linear_infinite]"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4">
               <div className="flex flex-col items-center gap-1">
                 <span className="text-[8px] font-black text-zinc-700 font-mono tracking-widest uppercase">Encryption Layer</span>
                 <span className="text-[10px] font-black text-white font-mono uppercase">AES-256-GCM</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <span className="text-[8px] font-black text-zinc-700 font-mono tracking-widest uppercase">Node Reference</span>
                 <span className="text-[10px] font-black text-white font-mono uppercase">RSA_LOCK_NODE_v1.5</span>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!isEditing && isContextComplete(context)) {
    return (
      <div className="mb-8 animate-in slide-in-from-top-8 duration-1000 group">
        <div className="bg-[#050505] border-[6px] border-[#f18a22] rounded-3xl p-10 shadow-[0_50px_100px_-20px_rgba(241,138,34,0.2)] relative overflow-hidden transition-all hover:scale-[1.01]">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none select-none">
             <span className="text-[12rem] font-black text-white font-mono leading-none tracking-tighter">SECURE</span>
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-[#f18a22] via-[#f18a22]/50 to-transparent"></div>
          <div className="absolute top-0 right-0 p-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/40 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[8px] font-black text-green-500 font-mono uppercase tracking-[0.2em]">IDENTITY_VERIFIED</span>
             </div>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12 relative z-10 mb-10 pb-10 border-b-2 border-zinc-900/50">
            <div className="flex items-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-[#f18a22] blur-2xl opacity-20 animate-pulse"></div>
                <div className="w-20 h-20 bg-[#f18a22] rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(241,138,34,0.5)] border-4 border-black relative z-10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                   <span className="text-[12px] font-black text-[#f18a22] uppercase tracking-[0.5em] font-mono leading-none">Identity Terminal Locked</span>
                </div>
                <h3 className="text-white font-black text-5xl uppercase tracking-tighter font-mono leading-none mt-4 drop-shadow-xl">
                  {context.registrationNumber || 'MH-12-G4G'}
                </h3>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
              <button 
                onClick={onScanRecalls}
                className="flex-1 lg:flex-none px-10 py-4 bg-[#f18a22] text-black text-[12px] font-black uppercase rounded-xl hover:bg-white hover:shadow-white/20 transition-all font-mono tracking-widest shadow-2xl active:scale-95"
              >
                Scan Safety Recalls
              </button>
              <button 
                onClick={() => setIsEditing(true)} 
                className="flex-1 lg:flex-none px-10 py-4 bg-black border-2 border-zinc-800 text-zinc-500 text-[12px] font-black uppercase rounded-xl hover:border-red-500 hover:text-red-500 hover:shadow-red-500/10 transition-all font-mono tracking-widest active:scale-95"
              >
                Security Override
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 relative z-10">
             <DataNode label="Architecture" value={context.brand} />
             <DataNode label="Model Platform" value={context.model} />
             <DataNode label="Deployment Year" value={context.year} />
             <DataNode label="Propulsion Node" value={context.fuelType} />
             {context.vehicleType === '4W' && <DataNode label="VIN Reference" value={context.vin || 'N/A'} />}
          </div>
          
          <div className="mt-10 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono font-black text-zinc-700 uppercase tracking-[0.6em] pt-6 border-t border-zinc-900/40 gap-4">
             <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span>G4G Node Synchronization: Stable</span>
             </div>
             <div className="flex items-center gap-4">
                <span>Audit ID: {Math.random().toString(36).substr(2, 12).toUpperCase()}</span>
                <span className="hidden md:inline text-zinc-800">|</span>
                <span>{new Date().toLocaleTimeString()} IST</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  const hasAnyErrors = Object.keys(errors).length > 0;
  const canLock = isContextComplete(context) && !hasAnyErrors;

  return (
    <div className="mb-8 bg-[#050505] border-4 border-[#f18a22] rounded-2xl p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col gap-10 animate-in fade-in zoom-in-95 duration-700">
      <div className="flex justify-between items-end border-b-4 border-[#f18a22] pb-8">
        <div className="flex flex-col">
          <h2 className="text-4xl font-black text-white uppercase tracking-tight font-mono leading-none">Identity Capture</h2>
          <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.6em] mt-4 font-mono">Governed Architectural Context Intake</p>
        </div>
        <div className="flex items-center gap-4 px-5 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl">
           <div className="relative flex items-center justify-center">
             <div className="w-3 h-3 rounded-full bg-[#f18a22] animate-ping absolute"></div>
             <div className="w-3 h-3 rounded-full bg-[#f18a22]"></div>
           </div>
           <span className="text-[10px] font-black text-zinc-300 uppercase font-mono tracking-[0.3em]">Node Active</span>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <label className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] font-mono">Vehicle Architecture</label>
        <div className="grid grid-cols-2 gap-5">
          {VEHICLE_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                onUpdate({ ...context, vehicleType: type.id as '2W' | '4W' });
                setTouched(prev => ({ ...prev, vehicleType: true }));
              }}
              className={`py-5 rounded-2xl border-2 text-[12px] font-black uppercase font-mono transition-all duration-300 ${context.vehicleType === type.id ? 'bg-[#f18a22] text-black border-black shadow-[0_15px_40px_rgba(241,138,34,0.4)] scale-[1.02]' : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className={`col-span-12 ${context.vehicleType === '4W' ? 'md:col-span-6' : ''}`}>
          <InputBox label="DTR Identity (Registration)" name="registrationNumber" value={context.registrationNumber || ''} placeholder="MH-XX-XX-XXXX" />
        </div>
        {context.vehicleType === '4W' && (
          <div className="col-span-12 md:col-span-6">
            <InputBox label="VIN Reference Node" name="vin" value={context.vin || ''} placeholder="17-CHARACTER VIN CODE" />
          </div>
        )}

        <div className="col-span-12 md:col-span-5 lg:col-span-4">
          <InputBox label="Manufacturer" name="brand" value={context.brand} placeholder="e.g. TOYOTA" />
        </div>
        <div className="col-span-12 md:col-span-7 lg:col-span-5">
          <InputBox label="Model Platform" name="model" value={context.model} placeholder="e.g. FORTUNER LEGENDER" />
        </div>
        <div className="col-span-12 md:col-span-12 lg:col-span-3">
          <InputBox label="Lifecycle Year" name="year" value={context.year} placeholder="e.g. 2026" />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
           <label className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] font-mono">Propulsion Configuration</label>
           {touched.fuelType && errors.fuelType && <span className="text-[9px] font-black text-red-500 uppercase font-mono tracking-tighter animate-pulse">{errors.fuelType}</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {FUEL_OPTIONS.map((fuel) => (
            <button
              key={fuel.id}
              onClick={() => {
                onUpdate({ ...context, fuelType: fuel.id });
                setTouched(prev => ({ ...prev, fuelType: true }));
                setErrors(prev => ({ ...prev, fuelType: "" }));
              }}
              className={`py-5 rounded-2xl border-2 text-[11px] font-black uppercase font-mono transition-all duration-300 ${context.fuelType === fuel.id ? 'bg-[#f18a22] text-black border-black shadow-[0_15px_30px_rgba(241,138,34,0.4)] scale-[1.02]' : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
            >
              {fuel.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6">
        <button 
          onClick={handleLockIdentity} 
          disabled={!canLock}
          className={`w-full py-8 text-[20px] font-black uppercase tracking-[0.6em] rounded-[2rem] transition-all font-mono border-4 ${canLock ? 'bg-[#f18a22] text-black border-black hover:bg-white hover:scale-[1.01] active:scale-95 shadow-[0_40px_80px_rgba(241,138,34,0.35)]' : 'bg-zinc-900 text-zinc-800 border-zinc-950 cursor-not-allowed opacity-20'}`}
        >
          {canLock ? 'Authorize Identity Lockdown' : 'Awaiting Full Node Context...'}
        </button>
        <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.6em] text-center mt-8 font-mono">Dossier Auth Gate: Primary • Security v1.5.4</p>
      </div>
      
      <style>{`
        @keyframes progress-move {
          0% { background-position: 0 0; }
          100% { background-position: 48px 0; }
        }
      `}</style>
    </div>
  );
};

export default VehicleContextPanel;
