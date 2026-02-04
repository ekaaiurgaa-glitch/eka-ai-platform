
import React from 'react';
import { MGAnalysis } from '../types';

interface MGAnalysisProps {
  data: MGAnalysis;
}

const MGAnalysisView: React.FC<MGAnalysisProps> = ({ data }) => {
  const { financial_summary, line_item_analysis, mg_type, audit_log } = data;
  const { invoice_split } = financial_summary;

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'MG_COVERED': return 'text-green-500';
      case 'NON_MG_PAYABLE': return 'text-red-500';
      default: return 'text-zinc-500';
    }
  };

  return (
    <div className="bg-[#050505] border-4 border-[#f18a22] rounded-xl overflow-hidden mt-6 animate-in zoom-in-95 duration-500 shadow-2xl">
      <div className="p-4 bg-zinc-900/50 border-b-2 border-[#f18a22]/20 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono">MG Settlement Engine</span>
          <span className="text-[13px] font-black text-white font-mono uppercase tracking-tight">Contract Variant: {mg_type}</span>
        </div>
        <div className={`px-3 py-1 rounded text-[10px] font-black uppercase font-mono border ${data.contract_status === 'ACTIVE' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
          CONTRACT: {data.contract_status}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SETTLEMENT SPLIT */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono border-b border-zinc-900 pb-2">Invoice Logic Split</h4>
          <div className="space-y-4">
            <div className="p-4 bg-green-500/5 border-2 border-green-500/30 rounded-lg flex justify-between items-center group hover:bg-green-500/10 transition-all">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-green-600 uppercase font-mono">Billed to MG Pool</span>
                <span className="text-2xl font-black text-white font-mono tracking-tighter">₹{invoice_split.billed_to_mg_pool.toLocaleString()}</span>
              </div>
              <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center text-black font-black">✓</div>
            </div>
            
            <div className="p-4 bg-red-500/5 border-2 border-red-500/30 rounded-lg flex justify-between items-center group hover:bg-red-500/10 transition-all">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-red-600 uppercase font-mono">Customer Payable</span>
                <span className="text-2xl font-black text-white font-mono tracking-tighter">₹{invoice_split.billed_to_customer.toLocaleString()}</span>
              </div>
              <div className="w-8 h-8 rounded bg-red-500 flex items-center justify-center text-black font-black">!</div>
            </div>

            {invoice_split.unused_buffer_value > 0 && (
              <div className="px-4 py-2 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center">
                <span className="text-[8px] font-bold text-zinc-500 uppercase font-mono tracking-widest">Unused MG Buffer</span>
                <span className="text-[11px] font-black text-zinc-400 font-mono">₹{invoice_split.unused_buffer_value.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* UTILIZATION GAUGES */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono border-b border-zinc-900 pb-2">Contract Utilization</h4>
          <div className="p-5 bg-black border-2 border-zinc-900 rounded-xl relative overflow-hidden">
             <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-zinc-600 uppercase font-mono tracking-widest">Monthly Limit</span>
                   <span className="text-xl font-black text-white font-mono">₹{financial_summary.mg_monthly_limit.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[8px] font-black text-zinc-600 uppercase font-mono tracking-widest">Status</span>
                   <span className={`text-[11px] font-black font-mono uppercase ${financial_summary.utilization_status === 'OVER_RUN' ? 'text-red-500' : 'text-green-500'}`}>
                     {financial_summary.utilization_status}
                   </span>
                </div>
             </div>
             
             <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${financial_summary.utilization_status === 'OVER_RUN' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-[#f18a22] shadow-[0_0_10px_#f18a22]'}`}
                  style={{ width: `${Math.min(100, (financial_summary.actual_utilization / financial_summary.mg_monthly_limit) * 100)}%` }}
                ></div>
             </div>
          </div>
        </div>
      </div>

      {/* ITEM ANALYSIS */}
      <div className="px-6 pb-6">
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] font-mono border-b border-zinc-900 pb-2 mb-4">Line Item Classification</h4>
        <div className="space-y-2">
          {line_item_analysis.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#080808] border border-zinc-900 rounded group hover:border-zinc-700">
               <div className="flex flex-col">
                 <span className="text-[11px] font-black text-zinc-200 font-mono uppercase">{item.item}</span>
                 <span className="text-[8px] font-bold text-zinc-600 font-mono uppercase tracking-widest">{item.category}</span>
               </div>
               <div className="flex items-center gap-6">
                 <span className={`text-[9px] font-black font-mono uppercase tracking-widest ${getCategoryColor(item.classification)}`}>
                   {item.classification.replace(/_/g, ' ')}
                 </span>
                 <span className="text-[12px] font-black text-white font-mono w-24 text-right">₹{item.cost.toLocaleString()}</span>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* AUDIT LOG */}
      {audit_log && (
        <div className="p-4 bg-black border-t-2 border-zinc-900">
          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest font-mono block mb-1">Engine Audit Log</span>
          <p className="text-[10px] text-zinc-500 font-mono italic leading-relaxed">{audit_log}</p>
        </div>
      )}
    </div>
  );
};

export default MGAnalysisView;
