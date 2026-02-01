import React, { useState, useEffect } from 'react';
import { VehicleContext, isContextComplete } from '../types';

interface VehicleContextPanelProps {
  context: VehicleContext;
  onUpdate: (updated: VehicleContext) => void;
  onScanRecalls?: () => void;
}

// Pre-defined lists for Auto-Suggestion
const DATA_STORE = {
  brands_4w: ["Maruti Suzuki", "Hyundai", "Tata Motors", "Mahindra", "Toyota", "Honda", "Kia", "MG", "Volkswagen", "Skoda", "Renault", "Jeep", "Nissan", "Audi", "BMW", "Mercedes-Benz"],
  brands_2w: ["Hero MotoCorp", "Honda", "TVS", "Bajaj", "Royal Enfield", "Yamaha", "Suzuki", "KTM", "Ather", "Ola Electric", "Jawa", "Yezdi"],
  models_common: ["Swift", "Creta", "Nexon", "Scorpio", "City", "Innova", "Seltos", "Hector", "Polo", "Splendor", "Activa", "Pulsar", "Classic 350", "Jupiter", "FZs"],
  fuels: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"],
  years: Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString()) 
};

const VehicleContextPanel: React.FC<VehicleContextPanelProps> = ({ context, onUpdate, onScanRecalls }) => {
  const [isEditing, setIsEditing] = useState(!isContextComplete(context));
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [showSuccessGlow, setShowSuccessGlow] = useState(false);

  useEffect(() => {
    if (context.vehicleType === '2W') {
      setBrandSuggestions(DATA_STORE.brands_2w);
    } else {
      setBrandSuggestions(DATA_STORE.brands_4w);
    }
  }, [context.vehicleType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onUpdate({ ...context, [name]: value });
  };

  const handleTypeSelect = (type: '2W' | '4W') => {
    onUpdate({ ...context, vehicleType: type, brand: '', model: '' });
  };

  const handleLockIdentity = () => {
    setIsEditing(false);
    setShowSuccessGlow(true);
    setTimeout(() => setShowSuccessGlow(false), 3000);
  };

  // ---------------------------------------------------------
  // VIEW MODE (LOCKED STATE) - Refined "Certificate" Style
  // ---------------------------------------------------------
  if (!isEditing && isContextComplete(context)) {
    return (
      <div className={`mx-4 mb-6 transition-all duration-700 ${showSuccessGlow ? 'scale-[1.02]' : ''}`}>
        <div className={`relative group overflow-hidden p-[1px] rounded-xl transition-all duration-1000 ${showSuccessGlow ? 'bg-gradient-to-r from-green-500 via-[#f18a22] to-green-500 animate-pulse shadow-[0_0_40px_rgba(34,197,94,0.3)]' : 'bg-[#262626]'}`}>
          
          <div className="bg-[#0A0A0A] border border-transparent rounded-[11px] p-5 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            {/* Success Background Effect */}
            {showSuccessGlow && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.08),transparent)] animate-in fade-in duration-1000"></div>
            )}

            <div className="flex items-center gap-5 w-full md:w-auto">
              {/* Identity Token Display with Animation */}
              <div className="relative">
                <div className={`w-16 h-16 bg-black border-2 rounded-xl flex items-center justify-center shrink-0 overflow-hidden transition-colors duration-500 ${showSuccessGlow ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'border-[#f18a22]/30'}`}>
                   {context.vehicleType === '2W' ? (
                      <svg className={`w-8 h-8 transition-colors ${showSuccessGlow ? 'text-green-500' : 'text-[#f18a22]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" />
                      </svg>
                   ) : (
                      <svg className={`w-8 h-8 transition-colors ${showSuccessGlow ? 'text-green-500' : 'text-[#f18a22]'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                      </svg>
                   )}
                   {/* Digital Scanline Effect */}
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-1/2 w-full animate-[scan_2.5s_linear_infinite]"></div>
                </div>
                {/* Verified Badge */}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center shadow-lg transition-colors duration-500 ${showSuccessGlow ? 'bg-green-500 scale-110' : 'bg-zinc-800'}`}>
                  <svg className={`w-3.5 h-3.5 ${showSuccessGlow ? 'text-black' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col relative z-20">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 transition-colors ${showSuccessGlow ? 'text-green-500' : 'text-zinc-500'}`}>
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${showSuccessGlow ? 'bg-green-400' : 'bg-zinc-700'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${showSuccessGlow ? 'bg-green-500' : 'bg-zinc-600'}`}></span>
                    </span>
                    {showSuccessGlow ? 'Identity Verified & Locked' : 'Vehicle Identity Synced'}
                  </span>
                  <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Protocol v1.5-Audit</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none mb-1.5">
                  <span className="text-zinc-500">{context.year}</span> <span className="text-[#f18a22]">{context.brand}</span> {context.model}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900 border border-[#262626] rounded text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                    <span className="w-1.5 h-1.5 bg-[#f18a22] rounded-sm"></span>
                    {context.fuelType} Protocol
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[10px] font-black text-green-500 uppercase tracking-widest">
                    G4G Certified
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto relative z-20">
              <button 
                onClick={onScanRecalls}
                className="w-full md:w-auto px-6 py-3 bg-green-600 text-black text-[10px] font-black uppercase tracking-[0.15em] rounded-lg hover:bg-green-500 transition-all active:scale-95 flex items-center justify-center gap-2.5 shadow-[0_5px_20px_rgba(34,197,94,0.3)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Perform Safety Audit
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full md:w-auto px-5 py-3 bg-zinc-900 border border-[#262626] rounded-lg text-[10px] text-zinc-500 font-black uppercase tracking-widest hover:border-[#f18a22] hover:text-white transition-all active:scale-95"
              >
                Modify Identity
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Success Alert */}
        <div className={`mt-4 overflow-hidden transition-all duration-700 ease-out ${showSuccessGlow ? 'max-h-20 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
          <div className="py-2.5 px-4 bg-green-500 border border-green-400 rounded-lg flex items-center justify-between gap-3 shadow-[0_10px_25px_-5px_rgba(34,197,94,0.4)]">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-black/20 rounded-full flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[11px] font-black text-black uppercase tracking-[0.2em]">Vehicle State Synchronized & Audit-Gated</span>
            </div>
            <div className="hidden sm:block text-[9px] font-black text-black/60 uppercase tracking-widest">Encryption: AES-256</div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // EDIT MODE (FORM)
  // ---------------------------------------------------------
  return (
    <div className="mx-4 mb-6 p-8 bg-[#0A0A0A] border-2 border-[#f18a22]/20 rounded-2xl shadow-2xl relative overflow-hidden group transition-all duration-300">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#f18a22_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-1.5 h-6 bg-[#f18a22] shadow-[0_0_12px_rgba(241,138,34,0.5)] rounded-full"></div>
        <div className="flex flex-col">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Vehicle Identity Acquisition</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 italic">Governance Gate: 5-Point Contextual Lock Required</p>
        </div>
      </div>

      <div className="mb-8">
         <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 mb-3 block">1. Operational Category</label>
         <div className="flex gap-4">
            <button 
               onClick={() => handleTypeSelect('2W')}
               className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${context.vehicleType === '2W' ? 'bg-[#f18a22] border-[#f18a22] text-black shadow-[0_0_20px_rgba(241,138,34,0.2)]' : 'bg-black border-[#262626] text-zinc-500 hover:border-[#f18a22]/40'}`}
            >
               <svg className={`w-5 h-5 ${context.vehicleType === '2W' ? 'text-black' : 'text-zinc-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" />
               </svg>
               <span className="text-xs uppercase font-black tracking-widest">2-Wheeler Protocol</span>
            </button>
            <button 
               onClick={() => handleTypeSelect('4W')}
               className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${context.vehicleType === '4W' ? 'bg-[#f18a22] border-[#f18a22] text-black shadow-[0_0_20px_rgba(241,138,34,0.2)]' : 'bg-black border-[#262626] text-zinc-500 hover:border-[#f18a22]/40'}`}
            >
               <svg className={`w-5 h-5 ${context.vehicleType === '4W' ? 'text-black' : 'text-zinc-600'}`} fill="currentColor" viewBox="0 0 24 24">
                 <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/>
               </svg>
               <span className="text-xs uppercase font-black tracking-widest">4-Wheeler Protocol</span>
            </button>
         </div>
      </div>

      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 mb-3 block">2. Technical Specifications</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.15em] ml-1">Brand</label>
          <input 
            name="brand"
            list="brand-list"
            value={context.brand}
            onChange={handleChange}
            placeholder={context.vehicleType === '2W' ? "Hero / Honda" : "Maruti / Toyota"}
            className="bg-black border border-[#262626] rounded-xl px-4 py-3 text-xs text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#f18a22] focus:ring-1 focus:ring-[#f18a22]/20 transition-all font-medium"
          />
          <datalist id="brand-list">
             {brandSuggestions.map(b => <option key={b} value={b} />)}
          </datalist>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.15em] ml-1">Model</label>
          <input 
            name="model"
            list="model-list"
            value={context.model}
            onChange={handleChange}
            placeholder="e.g. City / Pulsar"
            className="bg-black border border-[#262626] rounded-xl px-4 py-3 text-xs text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#f18a22] focus:ring-1 focus:ring-[#f18a22]/20 transition-all font-medium"
          />
          <datalist id="model-list">
             {DATA_STORE.models_common.map(m => <option key={m} value={m} />)}
          </datalist>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.15em] ml-1">Year</label>
          <input 
            name="year"
            list="year-list"
            value={context.year}
            onChange={handleChange}
            placeholder="2024"
            className="bg-black border border-[#262626] rounded-xl px-4 py-3 text-xs text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#f18a22] focus:ring-1 focus:ring-[#f18a22]/20 transition-all font-medium"
          />
          <datalist id="year-list">
             {DATA_STORE.years.map(y => <option key={y} value={y} />)}
          </datalist>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.15em] ml-1">Fuel</label>
          <select 
            name="fuelType"
            value={context.fuelType}
            onChange={handleChange}
            className="bg-black border border-[#262626] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#f18a22] focus:ring-1 focus:ring-[#f18a22]/20 transition-all appearance-none cursor-pointer font-medium"
          >
            <option value="">Select</option>
            {DATA_STORE.fuels.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {isContextComplete(context) && (
        <button 
          onClick={handleLockIdentity}
          className="mt-10 w-full py-4 bg-[#f18a22] text-black text-[12px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-[#d97a1d] active:scale-[0.98] transition-all shadow-[0_15px_40px_-10px_rgba(241,138,34,0.5)] flex items-center justify-center gap-3 group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-3">
            <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Lock Identity & Initialize Session
          </span>
          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-[shine_0.75s]"></div>
        </button>
      )}

      <style>{`
        @keyframes shine {
          100% {
            left: 125%;
          }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}</style>
    </div>
  );
};

export default VehicleContextPanel;
