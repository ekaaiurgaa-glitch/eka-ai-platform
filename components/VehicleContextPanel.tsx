
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
      <div className="mx-4 mb-4 p-3 bg-[#0A0A0A] border border-[#262626] rounded-lg flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Active Vehicle Context</span>
            <span className="text-xs font-bold text-white tracking-tight">
              {context.year} {context.brand} {context.model} <span className="text-[#FF6600]">({context.fuelType})</span>
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="text-[10px] text-[#FF6600] font-black uppercase hover:underline"
        >
          Edit Context
        </button>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 p-5 bg-[#0A0A0A] border-2 border-[#FF6600]/30 rounded-xl shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <svg className="w-16 h-16 text-[#FF6600]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 bg-[#FF6600]"></div>
        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Vehicle Identification (Gate 2)</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Brand</label>
          <input 
            name="brand"
            value={context.brand}
            onChange={handleChange}
            placeholder="e.g. Toyota"
            className="bg-black border border-[#262626] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6600] transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Model</label>
          <input 
            name="model"
            value={context.model}
            onChange={handleChange}
            placeholder="e.g. Camry"
            className="bg-black border border-[#262626] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6600] transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Year</label>
          <input 
            name="year"
            value={context.year}
            onChange={handleChange}
            placeholder="e.g. 2022"
            className="bg-black border border-[#262626] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6600] transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Fuel Type</label>
          <select 
            name="fuelType"
            value={context.fuelType}
            onChange={handleChange}
            className="bg-black border border-[#262626] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6600] transition-colors"
          >
            <option value="">Select Fuel</option>
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
          className="mt-4 w-full py-2 bg-[#FF6600] text-black text-[10px] font-black uppercase tracking-widest rounded hover:bg-[#e55c00] transition-all shadow-lg"
        >
          Lock Vehicle Context
        </button>
      )}
    </div>
  );
};

export default VehicleContextPanel;
