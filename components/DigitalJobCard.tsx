
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

  const MetaBox = ({ label, value, colorClass = "text-[#f18a22]" }: { label: string, value: string, colorClass?: string }) => (
    <div className="flex flex-col gap-1 p-3 bg-[#0A0A0A] border-4 border-[#f18a22] rounded-lg shadow-md">
      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest font-mono leading-none">{label}</span>
      <span className={`text-[13px] font-black uppercase font-mono tracking-tighter ${colorClass}`}>{value}</span>
    </div>
  );

  return (
    <div className="bg-[#050505] border-4 border-[#f18a22] rounded-xl p-6 flex flex-col gap-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
      <div className="flex justify-between items-center border-b-4 border-[#f18a22] pb-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono">Official Job Card</span>
          <span className="text-2xl font-black text-white font-mono tracking-widest">{jcId}</span>
        </div>
        <div className="px-6 py-2 bg-[#f18a22] text-black font-black font-mono text-sm rounded-lg shadow-[0_0_15px_rgba(241,138,34,0.4)]">
          STATUS: {status}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetaBox label="Entity Name" value={customerName} colorClass="text-white" />
        <MetaBox label="Reg Identity" value={regNo} />
        <MetaBox label="Model Arch" value={vehicleModel} colorClass="text-white" />
        <MetaBox label="Odo Meter" value={`${odometer} KM`} />
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono pl-1">Symptom Observation Log</span>
        <div className="flex flex-col gap-2">
          {complaints.map((c, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-[#080808] border-2 border-[#f18a22] rounded-lg group hover:bg-[#f18a22]/5 transition-all">
              <span className="w-6 h-6 flex items-center justify-center bg-[#f18a22] text-black font-black font-mono text-[11px] rounded shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-zinc-200 font-mono text-[12px] font-medium tracking-tight uppercase">{c}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono pl-1">Energy / Fuel Map</span>
        <div className="p-6 bg-[#0A0A0A] border-4 border-[#f18a22] rounded-xl flex items-center gap-8 shadow-inner">
          <div className="flex-1 relative h-2 bg-zinc-900 rounded-full">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={fuelLevel} 
              onChange={(e) => setFuelLevel(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="h-full bg-[#f18a22] rounded-full shadow-[0_0_10px_#f18a22]" style={{ width: `${fuelLevel}%` }}></div>
          </div>
          <span className="text-2xl font-black text-white font-mono w-20 text-right">{fuelLevel}%</span>
        </div>
      </div>

      <div className="mt-4 pt-6 border-t-4 border-[#f18a22]/20 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[8px] font-bold text-zinc-600 font-mono tracking-widest uppercase">System Timestamp</span>
          <span className="text-[10px] font-black text-[#f18a22] font-mono">{timestamp}</span>
        </div>
        <button 
          onClick={() => onComplete?.({ complaints, fuelLevel })}
          className="px-10 py-4 bg-[#f18a22] text-black font-black uppercase tracking-[0.3em] font-mono rounded-lg hover:bg-white hover:text-[#f18a22] transition-all shadow-2xl active:scale-95 border-2 border-black"
        >
          Finalize & Sync
        </button>
      </div>
    </div>
  );
};

export default DigitalJobCard;
