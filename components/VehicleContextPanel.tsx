
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
        if (!value.trim()) error = "Manufacturer is required";
        else if (value.trim().length < 2) error = "Invalid brand name";
        break;
      case 'model':
        if (!value.trim()) error = "Model variant is required";
        else if (value.trim().length < 2) error = "Invalid model name";
        break;
      case 'year':
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (!value) error = "Year is required";
        else if (isNaN(year) || year < 1900 || year > currentYear + 1) error = `Enter year (1900-${currentYear + 1})`;
        break;
      case 'fuelType':
        if (!value) error = "Select propulsion type";
        break;
      default:
        break;
    }
    return error;
  };

  const handleLockIdentity = () => {
    // Final validation sweep
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
          }, 2000);
          return 100;
        }
        return prev + 5;
      });
    }, 30);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    onUpdate({ ...context, [name]: value });
  };

  const handleFuelSelect = (fuelId: string) => {
    setErrors(prev => ({ ...prev, fuelType: "" }));
    onUpdate({ ...context, fuelType: fuelId });
  };

  const InputBox = ({ label, name, value, placeholder, type = "text" }: any) => (
    <div className={`flex flex-col gap-1 p-3 bg-[#0A0A0A] border-2 rounded-lg shadow-[0_4px_10px_rgba(241,138,34,0.1)] transition-all ${errors[name] ? 'border-red-500' : 'border-[#f18a22]'}`}>
      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono leading-none">
        {label}
      </label>
      <input 
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="bg-transparent text-white text-[13px] font-bold focus:outline-none placeholder:text-zinc-800 font-mono"
      />
      {errors[name] && (
        <span className="text-[8px] font-bold text-red-500 uppercase font-mono mt-1 animate-pulse">
          {errors[name]}
        </span>
      )}
    </div>
  );

  const OutputBox = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col gap-1 p-3 bg-[#080808] border-2 border-[#f18a22] rounded-lg shadow-[inset_0_0_10px_rgba(241,138,34,0.05)]">
      <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono leading-none">
        {label}
      </label>
      <span className="text-[#f18a22] text-[14px] font-black uppercase font-mono tracking-widest leading-tight">
        {value || '---'}
      </span>
    </div>
  );

  if (isSyncing) {
    return (
      <div className="mb-8 p-10 bg-[#030303] border-4 border-[#f18a22] rounded-xl flex flex-col items-center justify-center gap-6 shadow-[0_0_40px_rgba(241,138,34,0.3)] min-h-[220px]">
        {showSuccess ? (
          <div className="text-center animate-in zoom-in-95 duration-500 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center mb-6 animate-bounce">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-white font-black text-2xl uppercase tracking-[0.2em] font-mono">Digital Twin Locked</h4>
          </div>
        ) : (
          <div className="text-center w-full max-w-sm">
            <h4 className="text-[#f18a22] font-black text-xl uppercase tracking-[0.3em] mb-6 font-mono">Syncing Logic Nodes...</h4>
            <div className="relative w-full h-3 bg-zinc-900 rounded-full overflow-hidden border-2 border-[#f18a22]">
              <div 
                className="h-full bg-[#f18a22] transition-all duration-150" 
                style={{ width: `${syncProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!isEditing && isContextComplete(context)) {
    return (
      <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
        <div className="bg-[#050505] border-4 border-[#f18a22] rounded-xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">Architecture Status</span>
              <h3 className="text-[#f18a22] font-black text-lg uppercase tracking-widest font-mono">Dossier Locked</h3>
            </div>
            <button 
              onClick={() => setIsEditing(true)} 
              className="px-6 py-2 bg-zinc-900 border-2 border-[#f18a22] text-[#f18a22] text-[10px] font-black uppercase rounded hover:bg-[#f18a22] hover:text-black transition-all font-mono"
            >
              Unlock Terminal
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <OutputBox label="Identity" value={context.registrationNumber || 'MH-12-G4G'} />
             <OutputBox label="Manufacturer" value={context.brand} />
             <OutputBox label="Variant" value={context.model} />
             <OutputBox label="Model Year" value={context.year} />
          </div>
          <div className="mt-4">
            <OutputBox label="Propulsion Configuration" value={context.fuelType} />
          </div>
        </div>
      </div>
    );
  }

  const hasAnyErrors = Object.values(errors).some(err => err !== "");
  const canLock = isContextComplete(context) && !hasAnyErrors;

  return (
    <div className="mb-8 bg-[#050505] border-4 border-[#f18a22] rounded-xl p-6 flex flex-col gap-6 shadow-2xl">
      <div className="border-b-4 border-[#f18a22] pb-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] font-mono leading-none">Vehicle Initializer</h2>
        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-2 font-mono">Set Base Architectural Metadata</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onUpdate({ ...context, vehicleType: '2W' })}
          className={`p-4 rounded-lg border-4 font-mono transition-all ${context.vehicleType === '2W' ? 'bg-[#f18a22] text-black border-[#f18a22]' : 'bg-transparent border-zinc-800 text-zinc-500'}`}
        >
          <span className="text-[14px] font-black uppercase">2-Wheeler (Motorbike)</span>
        </button>
        <button 
          onClick={() => onUpdate({ ...context, vehicleType: '4W' })}
          className={`p-4 rounded-lg border-4 font-mono transition-all ${context.vehicleType === '4W' ? 'bg-[#f18a22] text-black border-[#f18a22]' : 'bg-transparent border-zinc-800 text-zinc-500'}`}
        >
          <span className="text-[14px] font-black uppercase">4-Wheeler (Car)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InputBox label="Reg Identity" name="registrationNumber" value={context.registrationNumber || ''} placeholder="MH-12-AB-1234" />
        <InputBox label="Manufacturer" name="brand" value={context.brand} placeholder="Maruti Suzuki" />
        <InputBox label="Model Variant" name="model" value={context.model} placeholder="Swift ZXI" />
        <InputBox label="MFG Year" name="year" value={context.year} placeholder="2024" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono leading-none">
          Propulsion Type
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {FUEL_OPTIONS.map((fuel) => (
            <button
              key={fuel.id}
              onClick={() => handleFuelSelect(fuel.id)}
              className={`py-3 rounded border-4 text-[9px] font-black uppercase font-mono transition-all ${context.fuelType === fuel.id ? 'bg-[#f18a22] text-black border-[#f18a22]' : errors.fuelType ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-transparent border-zinc-800 text-zinc-600'}`}
            >
              {fuel.label}
            </button>
          ))}
        </div>
        {errors.fuelType && (
          <span className="text-[8px] font-bold text-red-500 uppercase font-mono mt-1 animate-pulse">
            {errors.fuelType}
          </span>
        )}
      </div>

      <button 
        onClick={handleLockIdentity} 
        disabled={!canLock}
        className={`w-full py-5 text-[16px] font-black uppercase tracking-[0.4em] rounded-xl transition-all font-mono shadow-[0_10px_30px_rgba(241,138,34,0.3)] ${canLock ? 'bg-[#f18a22] text-black hover:bg-white active:scale-95' : 'bg-zinc-900 text-zinc-800 cursor-not-allowed border-4 border-zinc-950 opacity-50'}`}
      >
        {canLock ? 'Lock Architecture' : hasAnyErrors ? 'Correct Logic Errors' : 'Awaiting Metadata...'}
      </button>
    </div>
  );
};

export default VehicleContextPanel;
