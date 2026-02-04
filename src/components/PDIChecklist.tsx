
import React, { useState } from 'react';

interface PDIChecklistProps {
  items: { task: string; completed: boolean }[];
  technician_declaration: boolean;
  evidence_provided: boolean;
  onVerify: (data: { verified: boolean }) => void;
}

const PDIChecklist: React.FC<PDIChecklistProps> = ({ items, technician_declaration, evidence_provided, onVerify }) => {
  const [checklist, setChecklist] = useState(items);
  const [declaration, setDeclaration] = useState(technician_declaration);
  const [evidence, setEvidence] = useState(evidence_provided);
  const [isVerifying, setIsVerifying] = useState(false);

  const toggleItem = (index: number) => {
    const newChecklist = [...checklist];
    newChecklist[index].completed = !newChecklist[index].completed;
    setChecklist(newChecklist);
  };

  const allCompleted = checklist.every(i => i.completed) && declaration && evidence;

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      onVerify({ verified: true });
      setIsVerifying(false);
    }, 1500);
  };

  return (
    <div className="mt-6 bg-[#050505] border-4 border-[#f18a22] rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
      <div className="p-4 bg-zinc-900/50 border-b-2 border-[#f18a22]/20 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-1">PDI Verification Protocol</span>
          <span className="text-[14px] font-black text-white font-mono uppercase">Safety Compliance Gate</span>
        </div>
        <div className={`px-3 py-1 rounded text-[9px] font-black font-mono border ${allCompleted ? 'text-green-500 border-green-500' : 'text-yellow-500 border-yellow-500'}`}>
          {allCompleted ? 'READY_FOR_SYNC' : 'GATES_OPEN'}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-3">
          {checklist.map((item, i) => (
            <button 
              key={i} 
              onClick={() => toggleItem(i)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all font-mono text-[11px] font-bold uppercase text-left ${item.completed ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${item.completed ? 'bg-green-500 border-green-500' : 'border-zinc-700'}`}>
                {item.completed && <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
              </div>
              {item.task}
            </button>
          ))}
        </div>

        <div className="pt-6 border-t border-zinc-900 space-y-4">
          <label className="flex items-center gap-4 cursor-pointer group">
            <input type="checkbox" checked={declaration} onChange={() => setDeclaration(!declaration)} className="hidden" />
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${declaration ? 'bg-[#f18a22] border-[#f18a22]' : 'border-zinc-800 bg-zinc-900'}`}>
              {declaration && <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase font-mono tracking-tight leading-relaxed">I declare that all safety checks are completed per G4G guidelines.</span>
          </label>

          <label className="flex items-center gap-4 cursor-pointer group">
            <input type="checkbox" checked={evidence} onChange={() => setEvidence(!evidence)} className="hidden" />
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${evidence ? 'bg-blue-500 border-blue-500' : 'border-zinc-800 bg-zinc-900'}`}>
              {evidence && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase font-mono tracking-tight">Photo/Video evidence uploaded to central node.</span>
          </label>
        </div>

        <button 
          onClick={handleVerify}
          disabled={!allCompleted || isVerifying}
          className={`w-full py-5 text-[14px] font-black uppercase tracking-[0.4em] rounded-xl border-4 transition-all font-mono ${allCompleted && !isVerifying ? 'bg-[#f18a22] text-black border-black shadow-[0_10px_30px_rgba(241,138,34,0.3)]' : 'bg-zinc-900 text-zinc-700 border-zinc-950 opacity-40'}`}
        >
          {isVerifying ? 'Synchronizing PDI Gate...' : 'Verify & Close Job Card'}
        </button>
      </div>
    </div>
  );
};

export default PDIChecklist;
