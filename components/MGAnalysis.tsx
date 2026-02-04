
import React from 'react';
import { MGAnalysis } from '../types';

interface MGAnalysisProps {
  data: MGAnalysis;
}

const MGAnalysisView: React.FC<MGAnalysisProps> = ({ data }) => {
  const { financial_summary, mg_type, audit_log, audit_trail, parameters, is_prorata_applied } = data;
  const { invoice_split } = financial_summary;

  return (
    <div className="bg-[#050505] border-4 border-[#f18a22] rounded-xl overflow-hidden mt-6 animate-in zoom-in-95 duration-500 shadow-2xl">
      <div className="p-4 bg-zinc-900/50 border-b-2 border-[#f18a22]/20 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono">MG Settlement Engine</span>
          <span className="text-[13px] font-black text-white font-mono uppercase tracking-tight">Protocol: {mg_type}</span>
        </div>
        <div className="flex gap-2">
          {is_prorata_applied && (
            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500 text-blue-500 rounded text-[9px] font-black uppercase font-mono">
              PRO-RATA: ACTIVE
            </div>
          )}
          <div className={`px-3 py-1 rounded text-[9px] font-black uppercase font-mono border ${data.contract_status === 'ACTIVE' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
            CONTRACT: {data.contract_status}
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* FINANCIAL SUMMARY */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono border-b border-zinc-900 pb-2">Settlement Calculations</h4>
          <div className="space-y-4">
            <div className="p-4 bg-green-500/5 border-2 border-green-500/30 rounded-lg flex justify-between items-center group">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-green-600 uppercase font-mono">Billed to MG Pool</span>
                <span className="text-2xl font-black text-white font-mono tracking-tighter">₹{invoice_split.billed_to_mg_pool.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center text-black font-black">✓</div>
            </div>
            
            <div className="p-4 bg-red-500/5 border-2 border-red-500/30 rounded-lg flex justify-between items-center group">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-red-600 uppercase font-mono">Customer Overage</span>
                <span className="text-2xl font-black text-white font-mono tracking-tighter">₹{invoice_split.billed_to_customer.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="w-8 h-8 rounded bg-red-500 flex items-center justify-center text-black font-black">!</div>
            </div>
          </div>
        </div>

        {/* PARAMETERS & FORMULA */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono border-b border-zinc-900 pb-2">Audit Traceability</h4>
          <div className="p-5 bg-black border-2 border-zinc-900 rounded-xl space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <span className="text-[8px] font-black text-zinc-600 uppercase font-mono">Threshold</span>
                   <p className="text-[12px] font-black text-white font-mono">{parameters.guaranteed_threshold} {mg_type.includes('KM') ? 'KM' : 'DAYS'}</p>
                </div>
                <div>
                   <span className="text-[8px] font-black text-zinc-600 uppercase font-mono">Actual</span>
                   <p className="text-[12px] font-black text-white font-mono">{parameters.actual_usage} {mg_type.includes('KM') ? 'KM' : 'DAYS'}</p>
                </div>
             </div>
             
             <div className="pt-4 border-t border-zinc-900">
                <span className="text-[8px] font-black text-[#f18a22] uppercase font-mono tracking-widest">Active Formula Node</span>
                <div className="mt-2 p-3 bg-zinc-900/50 rounded font-mono text-[11px] text-[#f18a22] break-all border border-[#f18a22]/20">
                   {audit_trail.formula_used}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* AUDIT TRAIL */}
      <div className="px-6 pb-6">
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono border-b border-zinc-900 pb-2 mb-4">Logic Flow Adjustments</h4>
        <div className="space-y-3">
          <div className="flex flex-col gap-1 p-3 bg-zinc-900/20 border border-zinc-800 rounded">
            <span className="text-[8px] font-black text-zinc-500 uppercase font-mono">Applied Reasoning</span>
            <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">{audit_trail.logic_applied}</p>
          </div>
          {audit_trail.adjustments_made.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {audit_trail.adjustments_made.map((adj, i) => (
                <span key={i} className="px-2 py-1 bg-[#f18a22]/5 border border-[#f18a22]/30 text-[#f18a22] text-[8px] font-black font-mono uppercase rounded">
                  {adj}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FINAL ENGINE LOG */}
      {audit_log && (
        <div className="p-4 bg-black border-t-2 border-zinc-900 flex justify-between items-center">
          <p className="text-[10px] text-zinc-500 font-mono italic">{audit_log}</p>
          <span className="text-[8px] font-black text-zinc-800 font-mono uppercase tracking-[0.4em]">EKA_RECON_V1.4</span>
        </div>
      )}
    </div>
  );
};

export default MGAnalysisView;
