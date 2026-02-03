
import React, { useState, useMemo } from 'react';
import { EstimateData, EstimateItem } from '../types';

interface EstimateGovernanceProps {
  data: EstimateData;
  onAuthorize: (finalData: EstimateData) => void;
}

const EstimateGovernance: React.FC<EstimateGovernanceProps> = ({ data, onAuthorize }) => {
  const [items, setItems] = useState<EstimateItem[]>(data.items);

  const validation = useMemo(() => {
    return items.map(item => {
      const hsnValid = item.type === 'PART' 
        ? item.hsn_code.startsWith('8708') 
        : item.hsn_code.startsWith('9987');
      const gstValid = [18, 28].includes(item.gst_rate);
      return { id: item.id, hsnValid, gstValid, isValid: hsnValid && gstValid };
    });
  }, [items]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    
    items.forEach(item => {
      const lineTotal = item.unit_price * item.quantity;
      subtotal += lineTotal;
      const tax = lineTotal * (item.gst_rate / 100);
      cgst += tax / 2;
      sgst += tax / 2;
    });

    return { subtotal, cgst, sgst, total: subtotal + cgst + sgst };
  }, [items]);

  const allValid = validation.every(v => v.isValid);

  const updateItem = (id: string, updates: Partial<EstimateItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  return (
    <div className="estimate-governance-container bg-[#080808] border border-zinc-800 rounded-xl overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 border-b border-zinc-900 bg-[#0A0A0A] flex justify-between items-center">
        <div className="flex flex-col">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] font-mono">Module: Estimate Governance</label>
          <span className="text-[12px] font-bold text-white uppercase font-mono">{data.estimate_id}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${allValid ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'}`}></div>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{allValid ? 'Governance Passed' : 'Validation Required'}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/50">
              <th className="p-3 text-[10px] font-black text-zinc-500 uppercase tracking-tighter font-mono">Description</th>
              <th className="p-3 text-[10px] font-black text-zinc-500 uppercase tracking-tighter font-mono">HSN Code</th>
              <th className="p-3 text-[10px] font-black text-zinc-500 uppercase tracking-tighter font-mono">Price</th>
              <th className="p-3 text-[10px] font-black text-zinc-500 uppercase tracking-tighter font-mono">Qty</th>
              <th className="p-3 text-[10px] font-black text-zinc-500 uppercase tracking-tighter font-mono">GST %</th>
              <th className="p-3 text-[10px] font-black text-zinc-500 uppercase tracking-tighter font-mono text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {items.map((item, idx) => {
              const v = validation[idx];
              return (
                <tr key={item.id} className="hover:bg-zinc-900/20 transition-colors">
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-white">{item.description}</span>
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{item.type}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <input 
                      type="text" 
                      value={item.hsn_code} 
                      onChange={(e) => updateItem(item.id, { hsn_code: e.target.value })}
                      className={`bg-transparent text-[11px] font-mono border-b focus:outline-none transition-all ${v.hsnValid ? 'text-zinc-400 border-zinc-800' : 'text-red-500 border-red-500/50'}`}
                    />
                  </td>
                  <td className="p-3 text-[11px] font-mono text-zinc-300">₹{item.unit_price}</td>
                  <td className="p-3">
                    <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                      className="bg-transparent w-12 text-[11px] font-mono border-b border-zinc-800 text-zinc-400 focus:outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <select 
                      value={item.gst_rate} 
                      onChange={(e) => updateItem(item.id, { gst_rate: parseInt(e.target.value) as 18 | 28 })}
                      className={`bg-zinc-900 text-[11px] font-mono rounded px-1 py-0.5 focus:outline-none border ${v.gstValid ? 'text-zinc-400 border-zinc-800' : 'text-red-500 border-red-500/50'}`}
                    >
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </td>
                  <td className="p-3 text-right text-[11px] font-bold text-[#f18a22] font-mono">
                    ₹{(item.unit_price * item.quantity).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-[#0A0A0A] border-t border-zinc-900 flex flex-col md:flex-row justify-between gap-6">
        <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-2">
          <div className="flex justify-between border-b border-zinc-900 pb-1">
            <span className="text-[10px] font-bold text-zinc-600 uppercase">Subtotal</span>
            <span className="text-[11px] font-mono text-zinc-400">₹{totals.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-900 pb-1">
            <span className="text-[10px] font-bold text-zinc-600 uppercase">CGST</span>
            <span className="text-[11px] font-mono text-zinc-400">₹{totals.cgst.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-900 pb-1">
            <span className="text-[10px] font-bold text-zinc-600 uppercase">SGST</span>
            <span className="text-[11px] font-mono text-zinc-400">₹{totals.sgst.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center bg-zinc-900/50 px-2 py-1 rounded">
            <span className="text-[11px] font-black text-[#f18a22] uppercase tracking-widest">Total</span>
            <span className="text-[14px] font-black text-white font-mono tracking-tighter">₹{totals.total.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="shrink-0 flex items-center">
          <button 
            disabled={!allValid}
            onClick={() => onAuthorize({ ...data, items })}
            className={`px-8 py-3 rounded-lg text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-xl font-mono ${allValid ? 'bg-[#f18a22] text-black hover:bg-white active:scale-95' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
          >
            Authorize & Push to Gate
          </button>
        </div>
      </div>
    </div>
  );
};

export default EstimateGovernance;
