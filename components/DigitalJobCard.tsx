
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
  onComplete
}) => {
  const [complaints, setComplaints] = useState<string[]>(initialComplaints);
  const [fuelLevel, setFuelLevel] = useState(65);
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    setTimestamp(new Date().toLocaleString('en-IN').toUpperCase());
  }, []);

  const MetaBox = ({ label, value, color = "white" }: { label: string, value: string, color?: string }) => (
    <div className="flex flex-col gap-1 p-3 bg-[#0A0A0A] border-2 border-[#f18a22] rounded-lg shadow-sm">
      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest font-mono">{label}</span>
      <span className={`text-[12px] font-black uppercase font-mono tracking-tight text-${color}`}>{value}</span>
    </div>
  );

  return (
    <div className="bg-[#050505] border-4 border-[#f18a22] rounded-xl p-6 flex flex-col gap-8 shadow-2xl">
      <div className="flex justify-between items-center border-b-2 border-[#f18a22] pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-[#f18a22] uppercase tracking-[0.2em] font-mono">Job Card Identifier</span>
          <span className="text-xl font-black text-white font-mono">{jcId}</span>
        </div>
        <div className="px-4 py-2 bg-[#f18a22] text-black font-black font-mono text-sm rounded">
          {status}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetaBox label="Customer" value={customerName} />
        <MetaBox label="Reg Identity" value={regNo} color="[#f18a22]" />
        <MetaBox label="Model Arch" value={vehicleModel} />
        <MetaBox label="Distance Meter" value={`${odometer} KM`} />
      </div>

      <div className="space-y-4">
        <span className="text-[10px] font-black text-[#f18a22] uppercase tracking-[0.2em] font-mono">Symptom Triage Nodes</span>
        <div className="grid grid-cols-1 gap-2">
          {complaints.map((c, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-[#080808] border-2 border-zinc-900 rounded group hover:border-[#f18a22]/40 transition-all">
              <span className="w-5 h-5 flex items-center justify-center bg-[#f18a22] text-black font-black font-mono text-[10px] rounded-full shrink-0">{i + 1}</span>
              <span className="text-zinc-300 font-mono text-[12px]">{c}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black text-[#f18a22] uppercase tracking-[0.2em] font-mono">Energy / Fuel Mapping</span>
        <div className="p-4 bg-[#0A0A0A] border-2 border-[#f18a22] rounded-lg flex items-center gap-6">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={fuelLevel} 
            onChange={(e) => setFuelLevel(parseInt(e.target.value))}
            className="flex-1 accent-[#f18a22]"
          />
          <span className="text-lg font-black text-white font-mono w-16 text-right">{fuelLevel}%</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t-2 border-[#f18a22]/30 flex justify-between items-center">
        <span className="text-[9px] font-bold text-zinc-600 font-mono tracking-widest">{timestamp}</span>
        <button 
          onClick={() => onComplete?.({ complaints, fuelLevel })}
          className="px-8 py-3 bg-[#f18a22] text-black font-black uppercase tracking-[0.2em] font-mono rounded hover:bg-white transition-all shadow-lg"
        >
          Initialize Sync
        </button>
      </div>
    </div>
  );
};

export default DigitalJobCard;
