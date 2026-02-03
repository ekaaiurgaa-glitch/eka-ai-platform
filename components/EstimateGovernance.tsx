
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
    <div className={`flex flex-col gap-1 p-3 bg-[#0A0A0A] border-4 border-[#f18a22] rounded-lg ${highlight ? 'shadow-[0_0_20px_rgba(241,138,34,0.3)]' : ''}`}>
      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest font-mono leading-none">{label}</span>
      <span className={`text-[13px] font-black font-mono tracking-tighter ${highlight ? 'text-white' : 'text-[#f18a22]'}`}>{value}</span>
    </div>
  );

  return (
    <div className="bg-[#050505] border-4 border-[#f18a22] rounded-xl overflow-hidden mt-6 shadow-[0_30px_60px_-12px_rgba(0,0,0,1)]">
      <div className="p-5 bg-[#0A0A0A] border-b-4 border-[#f18a22] flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono">Governed Compliance Quote</span>
          <span className="text-xl font-black text-white font-mono tracking-widest">{data.estimate_id}</span>
        </div>
        <div className="flex gap-2 p-1 bg-black rounded-lg border-2 border-zinc-900">
          <button 
            onClick={() => setTaxType('CGST_SGST')}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg border-2 transition-all font-mono ${taxType === 'CGST_SGST' ? 'bg-[#f18a22] text-black border-[#f18a22]' : 'bg-transparent border-transparent text-zinc-600'}`}
          >
            CGST + SGST
          </button>
          <button 
            onClick={() => setTaxType('IGST')}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg border-2 transition-all font-mono ${taxType === 'IGST' ? 'bg-[#f18a22] text-black border-[#f18a22]' : 'bg-transparent border-transparent text-zinc-600'}`}
          >
            IGST
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {items.map((item, idx) => (
          <div key={item.id} className="p-4 bg-[#080808] border-4 border-zinc-900 rounded-xl flex flex-col gap-4 group hover:border-[#f18a22] transition-all duration-300">
            <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-2">
              <span className="text-[14px] font-black text-white font-mono uppercase tracking-tight">{item.description}</span>
              <span className={`text-[9px] font-black px-3 py-1 rounded-full border-2 border-[#f18a22] text-[#f18a22] uppercase font-mono tracking-widest`}>{item.type}</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1 p-2 bg-black border-2 border-[#f18a22] rounded-lg">
                <span className="text-[8px] font-black text-zinc-500 uppercase font-mono">HSN Identity</span>
                <input 
                  type="text" 
                  value={item.hsn_code} 
                  onChange={(e) => updateItem(item.id, { hsn_code: e.target.value })}
                  className="bg-transparent text-[13px] font-mono font-bold text-white focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1 p-2 bg-black border-2 border-[#f18a22] rounded-lg">
                <span className="text-[8px] font-black text-zinc-500 uppercase font-mono">Tax Bracket</span>
                <select 
                  value={item.gst_rate} 
                  onChange={(e) => updateItem(item.id, { gst_rate: parseInt(e.target.value) as 18 | 28 })}
                  className="bg-transparent text-[13px] font-mono font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value={18} className="bg-black">18% GST</option>
                  <option value={28} className="bg-black">28% GST</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 p-2 bg-black border-2 border-zinc-900 rounded-lg">
                <span className="text-[8px] font-black text-zinc-500 uppercase font-mono">Unit Analysis</span>
                <span className="text-[13px] font-mono font-bold text-zinc-400 uppercase tracking-tighter">₹{item.unit_price} x {item.quantity}</span>
              </div>
              <div className="flex flex-col gap-1 p-2 bg-black border-2 border-[#f18a22] rounded-lg">
                <span className="text-[8px] font-black text-zinc-500 uppercase font-mono">Node Total</span>
                <span className="text-[13px] font-mono font-black text-[#f18a22] tracking-widest">
                  ₹{(item.unit_price * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-[#0A0A0A] border-t-4 border-[#f18a22] grid grid-cols-1 sm:grid-cols-3 gap-6 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]">
        <OutputBox label="Base Aggregate" value={`₹${totals.subtotal.toLocaleString()}`} />
        <OutputBox label="Tax Component" value={`₹${(totals.cgst + totals.sgst + totals.igst).toLocaleString()}`} />
        <OutputBox label="Settlement Total" value={`₹${totals.total.toLocaleString()}`} highlight />
      </div>

      <div className="p-6 bg-black">
        <button 
          onClick={() => onAuthorize({ ...data, items, tax_type: taxType })}
          disabled={!allValid}
          className={`w-full py-5 text-[15px] font-black uppercase tracking-[0.4em] rounded-xl border-4 transition-all font-mono shadow-2xl ${allValid ? 'bg-[#f18a22] text-black border-[#f18a22] hover:bg-white active:scale-95' : 'bg-zinc-900 border-zinc-950 text-zinc-700 cursor-not-allowed'}`}
        >
          {allValid ? 'Authorize Logic Gates' : 'Compliance Protocol Failed'}
        </button>
      </div>
    </div>
  );
};

export default EstimateGovernance;
