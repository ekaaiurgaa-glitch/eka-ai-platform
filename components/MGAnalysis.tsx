
import React from 'react';
import { MGAnalysis } from '../types';

interface MGAnalysisProps {
  data: MGAnalysis;
}

const MGAnalysisView: React.FC<MGAnalysisProps> = ({ data }) => {
  const { contract_status, mg_type, risk_profile, financial_summary, audit_trail, parameters } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE':
      case 'MG_ACTIVE': return 'text-green-500';
      case 'WARNING':
      case 'MG_THRESHOLD_ALERT': return 'text-yellow-500';
      case 'BREACHED':
      case 'MG_EXHAUSTED': return 'text-red-500';
      default: return 'text-zinc-500';
    }
  };

  return (
    <div className="bg-[#050505] border-4 border-[#f18a22] rounded-xl overflow-hidden mt-6 animate-in zoom-in-95 duration-500 shadow-2xl">
      <div className="p-4 bg-zinc-900/50 border-b-2 border-[#f18a22]/20 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono leading-none mb-1">MG Governance Terminal</span>
          <span className="text-[14px] font-black text-white font-mono uppercase tracking-tight">Status: {contract_status} • {mg_type}</span>
        </div>
        <div className={`px-4 py-1.5 rounded-full border-2 text-[10px] font-black uppercase font-mono ${getStatusColor(financial_summary.utilization_status)} border-current bg-black/40`}>
          {financial_summary.utilization_status}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* RISK PROFILE */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono border-b border-zinc-900 pb-2">Risk Configuration</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-zinc-900/40 rounded border border-zinc-800">
              <span className="text-[8px] font-black text-zinc-600 uppercase font-mono block mb-1">Base Risk Score</span>
              <span className="text-xl font-black text-white font-mono">{risk_profile.base_risk_score.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-zinc-900/40 rounded border border-zinc-800">
              <span className="text-[8px] font-black text-zinc-600 uppercase font-mono block mb-1">Safety Buffer</span>
              <span className="text-xl font-black text-[#f18a22] font-mono">{risk_profile.safety_buffer_percent}%</span>
            </div>
          </div>

          <div className="p-4 bg-zinc-900/10 border-2 border-zinc-900 rounded-xl space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[8px] font-black text-zinc-500 uppercase font-mono">Actual Utilization</span>
              <span className="text-2xl font-black text-white font-mono">{financial_summary.actual_utilization.toLocaleString()} Units</span>
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
               <div 
                className={`h-full ${getStatusColor(financial_summary.utilization_status).replace('text-', 'bg-')} shadow-[0_0_10px_current]`} 
                style={{ width: `${Math.min(100, (financial_summary.actual_utilization / financial_summary.mg_monthly_limit) * 100)}%` }}
               ></div>
            </div>
          </div>
        </div>

        {/* FINANCIAL SUMMARY */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono border-b border-zinc-900 pb-2">Invoice Distribution Matrix</h4>
          <div className="space-y-3">
             <div className="flex justify-between items-center p-3 bg-[#080808] border border-zinc-900 rounded">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Billed to MG Pool</span>
                <span className="text-[12px] font-black text-green-500 font-mono">₹{financial_summary.invoice_split.billed_to_mg_pool.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-[#080808] border border-zinc-900 rounded">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Excess (Billed to Customer)</span>
                <span className="text-[12px] font-black text-red-500 font-mono">₹{financial_summary.invoice_split.billed_to_customer.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-[#080808] border border-zinc-900 rounded">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Unused Buffer</span>
                <span className="text-[12px] font-black text-blue-400 font-mono">₹{financial_summary.invoice_split.unused_buffer_value.toLocaleString()}</span>
             </div>
          </div>
        </div>
      </div>

      {/* AUDIT TRAIL */}
      <div className="px-6 pb-6 pt-2 border-t border-zinc-900">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
           <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-4 bg-[#f18a22]"></div>
                 <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">Financial Audit Trail</span>
              </div>
              <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-lg">
                 <span className="text-[8px] font-black text-zinc-600 uppercase font-mono block mb-1">Applied Weights</span>
                 <p className="text-[11px] text-[#f18a22] font-mono leading-relaxed bg-black/40 p-2 rounded border border-[#f18a22]/20 mb-3">{audit_trail.risk_weights_used}</p>
                 <span className="text-[8px] font-black text-zinc-600 uppercase font-mono block mb-1">Formula Logic</span>
                 <p className="text-[10px] text-zinc-400 font-mono italic leading-relaxed">{audit_trail.formula_used}</p>
              </div>
           </div>

           <div className="w-full md:w-80 p-6 bg-[#f18a22] rounded-xl flex flex-col gap-1 shadow-[0_10px_40px_rgba(241,138,34,0.3)]">
              <span className="text-[9px] font-black text-black/60 uppercase font-mono tracking-widest leading-none">Net MG Settlement</span>
              <span className="text-4xl font-black text-black font-mono tracking-tighter leading-none">₹{(financial_summary.invoice_split.billed_to_mg_pool + financial_summary.invoice_split.billed_to_customer).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <div className="mt-4 px-3 py-1 bg-black/20 rounded border border-black/10 text-[8px] font-black text-black uppercase font-mono text-center">
                 DETERMINISTIC_LOCK_ACTIVE
              </div>
           </div>
        </div>
      </div>

      <div className="p-4 bg-black border-t border-zinc-900 flex justify-between items-center">
        <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em] font-mono">EKA_MG_RECON_V1.5</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[8px] font-black text-zinc-500 uppercase font-mono tracking-widest">Risk Analysis Verified</span>
        </div>
      </div>
    </div>
  );
};

export default MGAnalysisView;
