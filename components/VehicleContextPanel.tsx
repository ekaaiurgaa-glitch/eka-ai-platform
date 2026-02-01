
import React, { useState } from 'react';
import { VehicleContext, isContextComplete } from '../types';

interface VehicleContextPanelProps {
  context: VehicleContext;
  onUpdate: (updated: VehicleContext) => void;
}

const VehicleContextPanel: React.FC<VehicleContextPanelProps> = ({ context, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(!isContextComplete(context));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onUpdate({ ...context, [name]: value });
  };

  if (!isEditing && isContextComplete(context)) {
    return (
      <div className="mx-4 mb-6 p-1 bg-gradient-to-r from-[#FF6600]/40 to-transparent rounded-xl shadow-[0_0_20px_rgba(255,102,0,0.1)] animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-[#0A0A0A] border border-[#262626] rounded-[10px] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 bg-black border border-[#FF6600]/30 rounded-lg flex items-center justify-center shadow-inner shrink-0 group">
              <svg className="w-6 h-6 text-[#FF6600] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black text-[#FF6600] uppercase tracking-[0.2em] animate-pulse">Synchronized</span>
                <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Protocol 2.4 Active</span>
              </div>
              <h2 className="text-sm font-black text-white tracking-tight uppercase">
                {context.year} <span className="text-[#FF6600]">{context.brand}</span> {context.model}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-[#262626] font-bold uppercase tracking-tighter">
                  Fuel: {context.fuelType}
                </span>
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Identity Locked
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="w-full md:w-auto px-4 py-2 bg-zinc-900 border border-[#262626] rounded-lg text-[10px] text-zinc-400 font-black uppercase tracking-widest hover:border-[#FF6600] hover:text-white transition-all active:scale-95"
          >
            Modify Identity context
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-6 p-6 bg-[#0A0A0A] border-2 border-[#FF6600]/20 rounded-2xl shadow-2xl relative overflow-hidden group transition-all duration-300">
      <div className="absolute -top-10 -right-10 p-2 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
        <svg className="w-48 h-48 text-[#FF6600]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/>
        </svg>
      </div>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-5 bg-[#FF6600] shadow-[0_0_8px_#FF6600]"></div>
        <div className="flex flex-col">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.25em]">Vehicle Identity Acquisition</h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Gate 2: Operational Context required</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Brand</label>
          <input 
            name="brand"
            value={context.brand}
            onChange={handleChange}
            placeholder="e.g. Toyota"
            className="bg-black border border-[#262626] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]/20 transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Model</label>
          <input 
            name="model"
            value={context.model}
            onChange={handleChange}
            placeholder="e.g. Camry"
            className="bg-black border border-[#262626] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]/20 transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Year</label>
          <input 
            name="year"
            value={context.year}
            onChange={handleChange}
            placeholder="e.g. 2022"
            className="bg-black border border-[#262626] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]/20 transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Fuel Type</label>
          <select 
            name="fuelType"
            value={context.fuelType}
            onChange={handleChange}
            className="bg-black border border-[#262626] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]/20 transition-all appearance-none"
          >
            <option value="">Select</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Electric">Electric</option>
            <option value="Hybrid">Hybrid</option>
            <option value="CNG">CNG</option>
          </select>
        </div>
      </div>

      {isContextComplete(context) && (
        <button 
          onClick={() => setIsEditing(false)}
          className="mt-6 w-full py-3 bg-[#FF6600] text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#e55c00] active:scale-[0.98] transition-all shadow-[0_10px_30px_-10px_#FF6600] flex items-center justify-center gap-2 group"
        >
          <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Establish Secure Identity Lock
        </button>
      )}
    </div>
  );
};

export default VehicleContextPanel;
