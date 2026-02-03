
import React, { useState, useEffect } from 'react';

interface DigitalJobCardProps {
  jcId?: string;
  status?: string;
  customerName: string;
  contact: string;
  vehicleModel: string;
  regNo: string;
  odometer: string;
  initialComplaints?: string[];
  inventoryItems?: { item: string; status: 'OK' | 'REPLACE' | 'CHECK' }[];
  onComplete?: (data: any) => void;
}

const DigitalJobCard: React.FC<DigitalJobCardProps> = ({
  jcId = "JC-2026-0041",
  status = "OPEN",
  customerName,
  contact,
  vehicleModel,
  regNo,
  odometer,
  initialComplaints = [
    "Suspension noise from front left quarter",
    "Brake pedal feel soft / low pressure",
    "Infotainment system lag on startup"
  ],
  inventoryItems = [
    { item: "Engine Oil Level", status: "OK" },
    { item: "Brake Pads (Front)", status: "CHECK" },
    { item: "Coolant Level", status: "OK" },
    { item: "Wiper Blades", status: "REPLACE" }
  ],
  onComplete
}) => {
  const [complaints, setComplaints] = useState<string[]>(initialComplaints);
  const [fuelLevel, setFuelLevel] = useState(65);
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    setTimestamp(new Date().toLocaleString('en-IN').toUpperCase());
  }, []);

  const MetaBox = ({ label, value, isOutput = true }: { label: string; value: string; isOutput?: boolean }) => (
    <div className="flex flex-col gap-1 p-3 bg-[#0A0A0A] border-2 border-[#f18a22] rounded shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest font-mono leading-none">{label}</span>
      <span className={`text-[12px] font-black uppercase font-mono tracking-tighter ${isOutput ? 'text-[#f18a22]' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );

  const getStatusColor = (s: string) => {
    if (s === 'OK') return 'text-green-500 border-green-500/30 bg-green-500/10';
    if (s === 'REPLACE') return 'text-red-500 border-red-500/30 bg-red-500/10';
    return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
  };

  return (
    <div className="message-card bg-[#050505] border-2 border-[#f18a22] border-l-[12px] rounded-xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] animate-in slide-in-from-left-4 duration-500 mb-8">
      {/* Header Section */}
      <div className="p-6 border-b-2 border-[#f18a22]/20 bg-gradient-to-r from-[#f18a22]/5 to-transparent flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono">Official G4G Dossier</span>
          <span className="text-2xl font-black text-white font-mono tracking-widest">{jcId}</span>
        </div>
        <div className="px-5 py-2 bg-[#f18a22] text-black font-black font-mono text-[11px] rounded border-2 border-black shadow-[0_0_15px_rgba(241,138,34,0.3)]">
          STATUS: {status}
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Customer/Vehicle Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetaBox label="Entity Identifier" value={customerName} isOutput={false} />
          <MetaBox label="Registration" value={regNo} />
          <MetaBox label="Architecture" value={vehicleModel} isOutput={false} />
          <MetaBox label="Odo Metrics" value={`${odometer} KM`} />
        </div>

        {/* VOC (Voice of Customer) Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#f18a22]"></div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono">VOC: Symptom Capture</span>
          </div>
          <div className="flex flex-col gap-2">
            {complaints.map((c, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-[#080808] border border-[#f18a22]/30 rounded group hover:border-[#f18a22] transition-all duration-300">
                <span className="w-6 h-6 flex items-center justify-center bg-[#f18a22] text-black font-black font-mono text-[10px] rounded shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-zinc-200 font-mono text-[12px] font-bold tracking-tight uppercase">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#f18a22]"></div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono">Inventory & Gating</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inventoryItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#0A0A0A] border border-zinc-800 rounded">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-tighter">{item.item}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${getStatusColor(item.status)} font-mono`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Energy/Fuel Mapping Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#f18a22]"></div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono">Energy / Propulsion Mapping</span>
          </div>
          <div className="p-6 bg-[#0A0A0A] border-2 border-[#f18a22] rounded flex items-center gap-8 shadow-inner">
            <div className="flex-1 relative h-3 bg-zinc-900 rounded-full border border-white/5 overflow-hidden">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={fuelLevel} 
                onChange={(e) => setFuelLevel(parseInt(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div 
                className="h-full bg-[#f18a22] rounded-full shadow-[0_0_20px_#f18a22] transition-all duration-300 relative z-10" 
                style={{ width: `${fuelLevel}%` }}
              >
                <div className="absolute top-0 right-0 w-12 h-full bg-white/20 blur-md"></div>
              </div>
            </div>
            <span className="text-2xl font-black text-[#f18a22] font-mono w-20 text-right">{fuelLevel}%</span>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-8 pt-6 border-t-2 border-[#f18a22]/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-zinc-600 font-mono tracking-widest uppercase">EKA Central OS Timestamp</span>
            <span className="text-[10px] font-black text-[#f18a22] font-mono">{timestamp}</span>
          </div>
          <button 
            onClick={() => onComplete?.({ complaints, fuelLevel, inventoryItems })}
            className="w-full sm:w-auto px-12 py-4 bg-[#f18a22] text-black font-black uppercase tracking-[0.4em] font-mono rounded hover:bg-white transition-all shadow-2xl active:scale-95 border-2 border-black"
          >
            Finalize Dossier
          </button>
        </div>
      </div>

      <style>{`
        .message-card input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(241, 138, 34, 0.5);
        }
      `}</style>
    </div>
  );
};

export default DigitalJobCard;
