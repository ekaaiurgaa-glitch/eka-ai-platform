
import React, { useState, useMemo } from 'react';
import { EstimateData, EstimateItem } from '../types';

interface EstimateGovernanceProps {
  data: EstimateData;
  onAuthorize: (finalData: EstimateData) => void;
}

const EstimateGovernance: React.FC<EstimateGovernanceProps> = ({ data, onAuthorize }) => {
  const [items, setItems] = useState<EstimateItem[]>(data.items);
  const [taxType, setTaxType] = useState<'CGST_SGST' | 'IGST'>(data.tax_type || 'CGST_SGST');

  const validation = useMemo(() => {
    return items.map(item => {
      const hsnValid = item.type === 'PART' 
        ? item.hsn_code.startsWith('8708') 
        : item.hsn_code.startsWith('9987');
      const hsnLengthValid = item.hsn_code.length >= 4 && item.hsn_code.length <= 8;
      const gstValid = [18, 28].includes(item.gst_rate);
      return { id: item.id, hsnValid: hsnValid && hsnLengthValid, gstValid, isValid: hsnValid && hsnLengthValid && gstValid };
    });
  }, [items]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let igstTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    
    items.forEach(item => {
      const lineTotal = item.unit_price * item.quantity;
      subtotal += lineTotal;
      const tax = lineTotal * (item.gst_rate / 100);
      
      if (taxType === 'IGST') {
        igstTotal += tax;
      } else {
        cgstTotal += tax / 2;
        sgstTotal += tax / 2;
      }
    });

    return { 
      subtotal, 
      cgst: cgstTotal, 
      sgst: sgstTotal, 
      igst: igstTotal, 
      total: subtotal + igstTotal + cgstTotal + sgstTotal 
    };
  }, [items, taxType]);

  const allValid = validation.every(v => v.isValid);

  const updateItem = (id: string, updates: Partial<EstimateItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const OutputBox = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div className={`flex flex-col gap-1 p-3 bg-[#0A0A0A] border-2 border-[#f18a22] rounded-lg ${highlight ? 'shadow-[0_0_15px_rgba(241,138,34,0.2)]' : ''}`}>
      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest font-mono">{label}</span>
      <span className={`text-[12px] font-black font-mono ${highlight ? 'text-[#f18a22]' : 'text-white'}`}>{value}</span>
    </div>
  );

  return (
    <div className="bg-[#050505] border-2 border-[#f18a22] rounded-xl overflow-hidden mt-6 shadow-xl">
      <div className="p-4 bg-[#0A0A0A] border-b-2 border-[#f18a22] flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-[#f18a22] uppercase tracking-[0.2em] font-mono">Governed Quote</span>
          <span className="text-[14px] font-black text-white font-mono">{data.estimate_id}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setTaxType('CGST_SGST')}
            className={`px-3 py-1 text-[9px] font-black uppercase rounded border-2 transition-all font-mono ${taxType === 'CGST_SGST' ? 'bg-[#f18a22] text-black border-[#f18a22]' : 'bg-transparent border-zinc-800 text-zinc-500'}`}
          >
            Local
          </button>
          <button 
            onClick={() => setTaxType('IGST')}
            className={`px-3 py-1 text-[9px] font-black uppercase rounded border-2 transition-all font-mono ${taxType === 'IGST' ? 'bg-[#f18a22] text-black border-[#f18a22]' : 'bg-transparent border-zinc-800 text-zinc-500'}`}
          >
            Interstate
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {items.map((item, idx) => (
          <div key={item.id} className="p-3 bg-[#080808] border-2 border-zinc-900 rounded-lg flex flex-col gap-3 group hover:border-[#f18a22]/40 transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[13px] font-black text-white font-mono">{item.description}</span>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded border border-[#f18a22] text-[#f18a22]`}>{item.type}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-zinc-600 uppercase font-mono">HSN Code</span>
                <input 
                  type="text" 
                  value={item.hsn_code} 
                  onChange={(e) => updateItem(item.id, { hsn_code: e.target.value })}
                  className="bg-[#0A0A0A] border-2 border-[#f18a22] rounded p-2 text-[11px] font-mono text-white focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-zinc-600 uppercase font-mono">GST %</span>
                <select 
                  value={item.gst_rate} 
                  onChange={(e) => updateItem(item.id, { gst_rate: parseInt(e.target.value) as 18 | 28 })}
                  className="bg-[#0A0A0A] border-2 border-[#f18a22] rounded p-2 text-[11px] font-mono text-white focus:outline-none"
                >
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-zinc-600 uppercase font-mono">Price x Qty</span>
                <div className="p-2 bg-[#0A0A0A] border-2 border-[#262626] rounded text-[11px] font-mono text-zinc-400">
                  ₹{item.unit_price} x {item.quantity}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-zinc-600 uppercase font-mono">Line Value</span>
                <div className="p-2 bg-[#0A0A0A] border-2 border-[#f18a22] rounded text-[11px] font-mono font-black text-[#f18a22]">
                  ₹{(item.unit_price * item.quantity).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-[#0A0A0A] border-t-2 border-[#f18a22] grid grid-cols-1 sm:grid-cols-3 gap-4">
        <OutputBox label="Subtotal" value={`₹${totals.subtotal.toLocaleString()}`} />
        <OutputBox label="GST Combined" value={`₹${(totals.cgst + totals.sgst + totals.igst).toLocaleString()}`} />
        <OutputBox label="Final Audit Total" value={`₹${totals.total.toLocaleString()}`} highlight />
      </div>

      <div className="p-4">
        <button 
          onClick={() => onAuthorize({ ...data, items, tax_type: taxType })}
          disabled={!allValid}
          className={`w-full py-4 text-[12px] font-black uppercase tracking-[0.3em] rounded border-2 transition-all font-mono ${allValid ? 'bg-[#f18a22] text-black border-[#f18a22] hover:bg-white' : 'bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed'}`}
        >
          {allValid ? 'Authorize & Sync Settlement' : 'HSN Compliance Failure'}
        </button>
      </div>
    </div>
  );
};

export default EstimateGovernance;
