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

  // ---------------------------------------------------------
  // VIEW MODE (LOCKED STATE)
  // ---------------------------------------------------------
  if (!isEditing && isContextComplete(context)) {
    return (
      <div className="mx-4 mb-6 p-1 bg-gradient-to-r from-[#FF6600]/40 to-transparent rounded-xl shadow-[0_0_20px_rgba(255,102,0,0.1)] animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-[10px] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 bg-black border border-[#FF6600]/30 rounded-lg flex items-center justify-center shadow-inner shrink-0 group">
               {context.vehicleType === '2W' ? (
                  <svg className="w-6 h-6 text-[#FF6600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3v8h8a9.982 9.982 0 00-1.747-5.63l-.06-.088m-12.396 1.206l.06.088m0 0L8.182 8.09c.401.402.582.97.48 1.533L8 13.5l-3.37-1.517m0 0l-1.047-.47a10 10 0 001.206 12.396l.088.06m0 0l5.63 1.747c-.073.003-.147.003-.22 0z" />
                  </svg>
               ) : (
                  <svg className="w-6 h-6 text-[#FF6600]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                  </svg>
               )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black text-[#FF6600] uppercase tracking-[0.2em] animate-pulse">Synchronized</span>
                <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{context.vehicleType} Identity Active</span>
              </div>
              <h2 className="text-sm font-black text-white tracking-tight uppercase">
                {context.year} <span className="text-[#FF6600]">{context.brand}</span> {context.model}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-[#262626] font-bold uppercase tracking-tighter">
                  {context.fuelType}
                </span>
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Identity Locked
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={onScanRecalls}
              className="flex-1 md:flex-none px-4 py-2 bg-[#FF6600]/10 border border-[#FF6600]/40 rounded-lg text-[10px] text-[#FF6600] font-black uppercase tracking-widest hover:bg-[#FF6600] hover:text-black transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Scan Safety Recalls
            </button>
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-zinc-900 border border-[#262626] rounded-lg text-[10px] text-zinc-400 font-black uppercase tracking-widest hover:border-[#FF6600] hover:text-white transition-all active:scale-95"
            >
              Modify
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // EDIT MODE (FORM)
  // ---------------------------------------------------------
  return (
    <div className="mx-4 mb-6 p-6 bg-[#0A0A0A] border-2 border-[#FF6600]/20 rounded-2xl shadow-2xl relative overflow-hidden group transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-5 bg-[#FF6600] shadow-[0_0_8px_#FF6600]"></div>
        <div className="flex flex-col">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.25em]">Vehicle Identity Acquisition</h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Gate 2: Operational Context required</p>
        </div>
      </div>

      <div className="mb-6">
         <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Category Selection</label>
         <div className="flex gap-4">
            <button 
               onClick={() => handleTypeSelect('2W')}
               className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${context.vehicleType === '2W' ? 'bg-[#FF6600] border-[#FF6600] text-black font-black' : 'bg-black border-[#262626] text-zinc-500 hover:border-[#FF6600]/50'}`}
            >
               <span className="text-[10px] uppercase font-black">2-Wheeler</span>
            </button>
            <button 
               onClick={() => handleTypeSelect('4W')}
               className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${context.vehicleType === '4W' ? 'bg-[#FF6600] border-[#FF6600] text-black font-black' : 'bg-black border-[#262626] text-zinc-500 hover:border-[#FF6600]/50'}`}
            >
               <span className="text-[10px] uppercase font-black">4-Wheeler</span>
            </button>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Brand</label>
          <input 
            name="brand"
            list="brand-list"
            value={context.brand}
            onChange={handleChange}
            placeholder={context.vehicleType === '2W' ? "e.g. Hero" : "e.g. Toyota"}
            className="bg-black border border-[#262626] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]/20 transition-all"
          />
          <datalist id="brand-list">
             {brandSuggestions.map(b => <option key={b} value={b} />)}
          </datalist>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Model</label>
          <input 
            name="model"
            list="model-list"
            value={context.model}
            onChange={handleChange}
            placeholder="e.g. City"
            className="bg-black border border-[#262626] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]/20 transition-all"
          />
          <datalist id="model-list">
             {DATA_STORE.models_common.map(m => <option key={m} value={m} />)}
          </datalist>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Year</label>
          <input 
            name="year"
            list="year-list"
            value={context.year}
            onChange={handleChange}
            placeholder="e.g. 2022"
            className="bg-black border border-[#262626] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]/20 transition-all"
          />
          <datalist id="year-list">
             {DATA_STORE.years.map(y => <option key={y} value={y} />)}
          </datalist>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Fuel</label>
          <select 
            name="fuelType"
            value={context.fuelType}
            onChange={handleChange}
            className="bg-black border border-[#262626] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]/20 transition-all appearance-none cursor-pointer"
          >
            <option value="">Select</option>
            {DATA_STORE.fuels.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {isContextComplete(context) && (
        <button 
          onClick={() => setIsEditing(false)}
          className="mt-6 w-full py-3 bg-[#FF6600] text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#e55c00] active:scale-[0.98] transition-all shadow-[0_10px_30px_-10px_#FF6600] flex items-center justify-center gap-2 group"
        >
          Establish Secure Identity Lock
        </button>
      )}
    </div>
  );
};

export default VehicleContextPanel;