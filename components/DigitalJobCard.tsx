
import React, { useState, useEffect } from 'react';

interface InventoryItem {
  item: string;
  status: 'OK' | 'REPLACE' | 'CHECK';
}

interface DigitalJobCardProps {
  jcId?: string;
  status?: string;
  customerName: string;
  contact?: string;
  vehicleModel: string;
  regNo: string;
  odometer: string;
  initialComplaints?: string[];
  initialInventory?: InventoryItem[];
  onComplete?: (data: any) => void;
}

const DigitalJobCard: React.FC<DigitalJobCardProps> = ({
  jcId = "JC-2026-0041",
  status = "OPEN",
  customerName,
  contact = "+91 98765 43210",
  vehicleModel,
  regNo,
  odometer,
  initialComplaints = [
    "Suspension noise from front left quarter",
    "Brake pedal feel soft / low pressure",
    "Infotainment system lag on startup"
  ],
  initialInventory = [
    { item: "Engine Oil Level", status: "OK" },
    { item: "Brake Pads (Front)", status: "CHECK" },
    { item: "Coolant Level", status: "OK" },
    { item: "Wiper Blades", status: "REPLACE" },
    { item: "Tyre Pressure", status: "OK" },
    { item: "Battery Health", status: "OK" }
  ],
  onComplete
}) => {
  const [complaints, setComplaints] = useState<string[]>(initialComplaints);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [fuelLevel, setFuelLevel] = useState(65);
  const [timestamp, setTimestamp] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    setTimestamp(new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).toUpperCase());
  }, []);

  const handleFinalize = () => {
    setIsFinalizing(true);
    setTimeout(() => {
      onComplete?.({ complaints, fuelLevel, inventory });
      setIsFinalizing(false);
    }, 2000);
  };

  const MetaBox = ({ label, value, isOutput = true }: { label: string; value: string; isOutput?: boolean }) => (
    <div className="flex flex-col gap-1.5 p-4 bg-[#080808] border-2 border-zinc-900 rounded-lg group hover:border-[#f18a22]/40 transition-all duration-300">
      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest font-mono leading-none">{label}</span>
      <span className={`text-[13px] font-black uppercase font-mono tracking-tighter ${isOutput ? 'text-[#f18a22]' : 'text-zinc-200'}`}>
        {value}
      </span>
    </div>
  );

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'OK': return 'text-green-500 border-green-500/30 bg-green-500/5';
      case 'REPLACE': return 'text-red-500 border-red-500/30 bg-red-500/5';
      case 'CHECK': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5';
      default: return 'text-zinc-500 border-zinc-500/30 bg-zinc-500/5';
    }
  };

  return (
    <div className="digital-dossier-wrapper animate-in slide-in-from-left-4 duration-700 mb-10 w-full max-w-4xl">
      <div className="digital-dossier-card border-l-[12px] border-[#f18a22] bg-[#050505] rounded-xl overflow-hidden shadow-2xl border-2 border-zinc-900">
        
        {/* HEADER: DOSSIER IDENTITY & STATUS */}
        <div className="p-8 bg-zinc-900/30 border-b-2 border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] font-mono mb-1">Architectural Dossier ID</span>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black text-white font-mono tracking-widest leading-none">{jcId}</span>
              <div className="h-6 w-[1px] bg-zinc-800"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest font-mono">LIVE_SYNC</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className="text-[8px] font-black text-zinc-600 uppercase font-mono">Current Workflow State</span>
            <div className="px-6 py-2 bg-[#f18a22] text-black font-black font-mono text-[11px] rounded border-2 border-black shadow-[0_4px_20px_rgba(241,138,34,0.3)] uppercase tracking-[0.2em]">
              {status}
            </div>
          </div>

          {/* SECURITY WATERMARK */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none">
             <span className="text-6xl font-black text-white font-mono uppercase tracking-tighter">G4G_PROTOCOL</span>
          </div>
        </div>

        <div className="p-8 space-y-12">
          {/* CORE IDENTITY GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetaBox label="Technician Entity" value={customerName} isOutput={false} />
            <MetaBox label="Communication Node" value={contact} isOutput={false} />
            <MetaBox label="DTR Identity (Reg)" value={regNo} />
            <MetaBox label="Platform Variant" value={vehicleModel} isOutput={false} />
            <MetaBox label="Odometer (KM)" value={odometer} />
            <MetaBox label="Node Authorization" value="EKA-V1.4" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            {/* VOC: VOICE OF CUSTOMER */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-zinc-900 pb-3">
                <div className="w-2 h-6 bg-[#f18a22]"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] font-mono">Symptom Observation (VOC)</span>
                  <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest font-mono">Diagnostic Entry Logic</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {complaints.map((c, i) => (
                  <div key={i} className="group relative flex items-center gap-4 p-5 bg-[#080808] border-2 border-zinc-900 rounded-xl hover:border-[#f18a22] transition-all duration-300">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#f18a22] text-black font-black font-mono text-sm rounded shadow-lg">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <span className="text-zinc-200 font-mono text-xs font-bold uppercase tracking-tight flex-1">{c}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[7px] font-black text-[#f18a22] uppercase font-mono tracking-widest bg-[#f18a22]/10 px-2 py-1 rounded">BRANCH_SYNC</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* INVENTORY: COMPLIANCE GATING */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-zinc-900 pb-3">
                <div className="w-2 h-6 bg-zinc-500"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] font-mono">Physical Inventory Gate</span>
                  <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest font-mono">Part-Level Verification</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inventory.map((item, i) => (
                  <div key={i} className="flex flex-col gap-2 p-4 bg-[#0A0A0A] border-2 border-zinc-900 rounded-lg hover:border-zinc-700 transition-colors">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tighter truncate">{item.item}</span>
                    <div className={`px-3 py-1.5 rounded text-[8px] font-black border-2 font-mono tracking-widest text-center uppercase ${getStatusStyle(item.status)}`}>
                      STATUS: {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PROPULSION: ENERGY LEVEL GAUGE */}
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-end">
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] font-mono leading-none">Energy Reservoir Node</span>
                 <span className="text-[8px] font-bold text-zinc-700 uppercase font-mono">Propulsion Calibration</span>
               </div>
               <span className="text-4xl font-black text-[#f18a22] font-mono tracking-tighter leading-none">{fuelLevel}%</span>
            </div>
            
            <div className="p-8 bg-[#0A0A0A] border-2 border-zinc-900 rounded-xl relative overflow-hidden group">
               {/* RANGE INPUT STYLING */}
               <div className="relative h-6 w-full bg-zinc-900 rounded-full border-2 border-zinc-800 overflow-hidden p-1 shadow-inner">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={fuelLevel} 
                    onChange={(e) => setFuelLevel(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  <div 
                    className="h-full bg-gradient-to-r from-[#f18a22] via-orange-500 to-white shadow-[0_0_25px_rgba(241,138,34,0.5)] transition-all duration-300 rounded-full" 
                    style={{ width: `${fuelLevel}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                  </div>
               </div>
               <div className="flex justify-between mt-4">
                  {[0, 25, 50, 75, 100].map(v => (
                    <div key={v} className="flex flex-col items-center gap-1">
                       <div className="w-[1px] h-2 bg-zinc-800"></div>
                       <span className="text-[7px] font-black text-zinc-700 font-mono">{v}%</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* FOOTER: PROTOCOL FINALIZATION */}
          <div className="mt-12 pt-10 border-t-2 border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-zinc-600 font-mono tracking-[0.4em] uppercase">Architecture Compliance Stamp</span>
              <div className="flex items-center gap-4">
                 <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                 </div>
                 <span className="text-[13px] font-black text-[#f18a22] font-mono tracking-widest">{timestamp}</span>
              </div>
            </div>
            
            <button 
              onClick={handleFinalize}
              disabled={isFinalizing}
              className={`relative w-full md:w-auto px-20 py-6 text-black font-black uppercase tracking-[0.5em] font-mono rounded-xl border-4 border-black transition-all duration-300 overflow-hidden shadow-2xl active:scale-95 ${isFinalizing ? 'bg-zinc-800 text-zinc-500' : 'bg-[#f18a22] hover:bg-white hover:scale-[1.02]'}`}
            >
              {isFinalizing ? (
                <div className="flex items-center gap-4">
                   <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                   </svg>
                   <span>Finalizing Node Sync</span>
                </div>
              ) : (
                'Commit To Registry'
              )}
              {!isFinalizing && (
                <div className="absolute inset-0 bg-white/10 -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalJobCard;
