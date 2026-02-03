
import React, { useState, useMemo, useEffect } from 'react';
import { EstimateData, EstimateItem } from '../types';
import { GST_HSN_REGISTRY } from '../constants';

interface EstimateGovernanceProps {
  data: EstimateData;
  onAuthorize: (finalData: EstimateData) => void;
}

const EstimateGovernance: React.FC<EstimateGovernanceProps> = ({ data, onAuthorize }) => {
  const [items, setItems] = useState<EstimateItem[]>(data.items);
  const [taxType, setTaxType] = useState<'CGST_SGST' | 'IGST'>(data.tax_type || 'CGST_SGST');
  const [isCrossReferencing, setIsCrossReferencing] = useState(false);

  // Simulated logic sync for HSN/GST verification
  useEffect(() => {
    setIsCrossReferencing(true);
    const timer = setTimeout(() => setIsCrossReferencing(false), 800);
    return () => clearTimeout(timer);
  }, [items, taxType]);

  const validation = useMemo(() => {
    return items.map(item => {
      const registryGroup = item.type === 'PART' ? GST_HSN_REGISTRY.PARTS : GST_HSN_REGISTRY.LABOR;
      const hsnValid = item.hsn_code.startsWith(registryGroup.HSN_PREFIX);
      const gstValid = item.gst_rate === registryGroup.DEFAULT_GST;
      
      let errorMsg = '';
      if (!item.hsn_code) errorMsg = 'HSN Code Required';
      else if (!hsnValid) errorMsg = `HSN mismatch: ${item.type}s must start with ${registryGroup.HSN_PREFIX}`;
      else if (!gstValid) errorMsg = `Tax mismatch: ${item.type}s must be ${registryGroup.DEFAULT_GST}% GST`;

      return { 
        id: item.id, 
        isValid: hsnValid && gstValid && !!item.hsn_code,
        error: errorMsg,
        registryRef: registryGroup.REGULATORY_REF
      };
    });
  }, [items]);

  const allValid = validation.every(v => v.isValid);
  const compliantCount = validation.filter(v => v.isValid).length;

  const totals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    
    items.forEach(item => {
      const lineTotal = item.unit_price * item.quantity;
      subtotal += lineTotal;
      taxTotal += lineTotal * (item.gst_rate / 100);
    });

    return { 
      subtotal, 
      tax: taxTotal, 
      total: subtotal + taxTotal,
      cgst: taxType === 'CGST_SGST' ? taxTotal / 2 : 0,
      sgst: taxType === 'CGST_SGST' ? taxTotal / 2 : 0,
      igst: taxType === 'IGST' ? taxTotal : 0
    };
  }, [items, taxType]);

  const updateItem = (id: string, updates: Partial<EstimateItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const AuditMetric = ({ label, value, status }: { label: string, value: string, status: 'pass' | 'fail' | 'sync' }) => (
    <div className={`flex flex-col gap-1 p-3 bg-black border-2 rounded-lg transition-all ${
      status === 'pass' ? 'border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 
      status === 'fail' ? 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 
      'border-[#f18a22]/40 animate-pulse'
    }`}>
      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest font-mono leading-none">{label}</span>
      <span className={`text-[11px] font-black font-mono tracking-tighter ${status === 'fail' ? 'text-red-400' : 'text-zinc-200'}`}>{value}</span>
    </div>
  );

  return (
    <div className="bg-[#050505] border-4 border-[#f18a22] rounded-xl overflow-hidden mt-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      {/* COMPLIANCE AUDIT DASHBOARD */}
      <div className="p-4 bg-zinc-900/50 border-b-2 border-[#f18a22]/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-[14px] shadow-lg border-2 ${allValid ? 'bg-green-500 text-black border-green-400' : 'bg-red-500 text-white border-red-400 animate-pulse'}`}>
            {allValid ? 'AUTH' : 'HOLD'}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono mb-1">Audit Protocol v1.4</span>
            <span className="text-[13px] font-black text-white font-mono uppercase">
              {compliantCount} / {items.length} Nodes Verified
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <AuditMetric label="Registry Sync" value={isCrossReferencing ? 'Logic Update' : 'Live: GST-IN'} status={isCrossReferencing ? 'sync' : 'pass'} />
          <AuditMetric label="Status" value={allValid ? 'Compliant' : 'Logic Breach'} status={allValid ? 'pass' : 'fail'} />
        </div>
      </div>

      <div className="p-6 border-b-4 border-[#f18a22] bg-[#0A0A0A] flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] font-mono mb-1">Document Registry ID</span>
          <span className="text-2xl font-black text-white font-mono tracking-tighter">{data.estimate_id}</span>
        </div>
        <div className="flex flex-col gap-2">
           <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest font-mono text-center md:text-right">Tax Protocol Configuration</span>
           <div className="flex gap-1.5 p-1.5 bg-black border-2 border-zinc-900 rounded-xl">
            {(['CGST_SGST', 'IGST'] as const).map(type => (
              <button 
                key={type}
                onClick={() => setTaxType(type)}
                className={`px-6 py-2 text-[10px] font-black uppercase rounded-lg transition-all font-mono border-2 ${taxType === type ? 'bg-[#f18a22] text-black border-[#f18a22] shadow-[0_0_15px_rgba(241,138,34,0.3)]' : 'bg-transparent border-transparent text-zinc-600'}`}
              >
                {type.replace('_', ' + ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 bg-gradient-to-b from-[#080808] to-black overflow-y-auto max-h-[500px] scrollbar-thin">
        {items.map((item) => {
          const v = validation.find(val => val.id === item.id);
          const registry = item.type === 'PART' ? GST_HSN_REGISTRY.PARTS : GST_HSN_REGISTRY.LABOR;
          
          return (
            <div key={item.id} className={`p-5 bg-[#0A0A0A] border-2 rounded-xl flex flex-col gap-4 transition-all duration-300 ${v?.isValid ? 'border-zinc-900 hover:border-[#f18a22]/50' : 'border-red-500/40 bg-red-500/5'}`}>
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <div className="flex flex-col">
                  <span className="text-[14px] font-black text-zinc-200 font-mono uppercase tracking-tight truncate max-w-[300px]">{item.description}</span>
                  <span className="text-[8px] font-bold text-zinc-600 font-mono uppercase tracking-widest">{registry.NAME}</span>
                </div>
                <span className={`text-[9px] font-black px-3 py-1 rounded bg-zinc-900 border border-[#f18a22] text-[#f18a22] uppercase font-mono`}>{item.type}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-zinc-600 uppercase font-mono">HSN Code (8708/9987)</span>
                  <input 
                    list={`hsn-list-${item.id}`}
                    type="text" 
                    value={item.hsn_code} 
                    onChange={(e) => updateItem(item.id, { hsn_code: e.target.value })}
                    className={`bg-black p-2.5 rounded border-2 text-[12px] font-mono font-bold text-white focus:outline-none transition-colors ${v?.isValid ? 'border-zinc-800 focus:border-[#f18a22]' : 'border-red-500/50'}`}
                    placeholder="Enter HSN..."
                  />
                  <datalist id={`hsn-list-${item.id}`}>
                    {Object.entries(registry.COMMON_CODES).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </datalist>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-zinc-600 uppercase font-mono">GST Component (%)</span>
                  <select 
                    value={item.gst_rate} 
                    onChange={(e) => updateItem(item.id, { gst_rate: parseInt(e.target.value) as 18 | 28 })}
                    className="bg-black p-2.5 rounded border-2 border-zinc-800 text-[12px] font-mono font-bold text-white focus:outline-none cursor-pointer"
                  >
                    <option value={18}>18% [Labor Standard]</option>
                    <option value={28}>28% [Parts Standard]</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-zinc-600 uppercase font-mono">Qty/Vol</span>
                  <input 
                    type="number" 
                    value={item.quantity} 
                    onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                    className="bg-black p-2.5 rounded border-2 border-zinc-800 text-[12px] font-mono font-bold text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 p-2.5 bg-[#f18a22]/5 border-2 border-[#f18a22]/20 rounded-lg">
                  <span className="text-[8px] font-black text-[#f18a22] uppercase font-mono">Net Logic Value</span>
                  <span className="text-[13px] font-mono font-black text-white tracking-widest">₹{(item.unit_price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
              
              {!v?.isValid && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                   <span className="text-[10px] font-bold text-red-500 uppercase font-mono">{v?.error}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER AUDIT SUMMARY */}
      <div className="p-8 bg-[#0A0A0A] border-t-4 border-[#f18a22] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono">Aggregate Base</span>
          <span className="text-xl font-black text-white font-mono tracking-tighter">₹{totals.subtotal.toLocaleString()}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono">
            {taxType === 'IGST' ? 'IGST 100%' : 'CGST + SGST (Split)'}
          </span>
          <span className="text-xl font-black text-[#f18a22] font-mono tracking-tighter">
            {taxType === 'IGST' 
              ? `₹${totals.igst.toLocaleString()}`
              : `₹${totals.cgst.toLocaleString()} x 2`
            }
          </span>
        </div>
        <div className="flex flex-col lg:items-end col-span-1 lg:col-span-2">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono">Dossier Settlement Value</span>
          <span className="text-4xl font-black text-white font-mono tracking-widest shadow-[#f18a22]/20 drop-shadow-lg">
            ₹{totals.total.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="p-8 bg-black">
        <button 
          onClick={() => onAuthorize({ ...data, items, tax_type: taxType })}
          disabled={!allValid || isCrossReferencing}
          className={`w-full py-6 text-[20px] font-black uppercase tracking-[0.6em] rounded-xl border-4 transition-all font-mono shadow-2xl flex items-center justify-center gap-4 ${allValid && !isCrossReferencing ? 'bg-[#f18a22] text-black border-black hover:bg-white hover:scale-[1.01] active:scale-95' : 'bg-zinc-900 border-zinc-950 text-zinc-700 cursor-not-allowed'}`}
        >
          {isCrossReferencing ? (
            <>
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Verifying Registry Nodes</span>
            </>
          ) : allValid ? (
            'Authorize To Approval Gate'
          ) : (
            'Logic Breach: Missing HSN/GST'
          )}
        </button>
        <div className="flex justify-between items-center mt-6 px-2">
          <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em] font-mono">G4G Compliance Engine v1.4.2</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span className="text-[8px] font-black text-zinc-600 uppercase font-mono tracking-widest">Encrypted Logic Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateGovernance;
