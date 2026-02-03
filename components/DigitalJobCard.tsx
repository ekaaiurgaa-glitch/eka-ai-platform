
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

  useEffect(() => {
    setTimestamp(new Date().toLocaleString('en-IN').toUpperCase());
  }, []);

  const MetaBox = ({ label, value, isOutput = true }: { label: string; value: string; isOutput?: boolean }) => (
    <div className="flex flex-col gap-1.5 p-4 bg-[#0A0A0A] border-2 border-[#f18a22] rounded shadow-[0_4px_15px_rgba(0,0,0,0.6)]">
      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono leading-none">{label}</span>
      <span className={`text-[13px] font-black uppercase font-mono tracking-tighter ${isOutput ? 'text-[#f18a22]' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'OK': return 'text-green-500 border-green-500/30 bg-green-500/10';
      case 'REPLACE': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'CHECK': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-zinc-500 border-zinc-500/30 bg-zinc-500/10';
    }
  };

  return (
    <div className="message-card-wrapper animate-in slide-in-from-left-4 duration-500 mb-8 max-w-full">
      <div className="message-card">
        {/* HEADER SECTION - DOSSIER IDENTITY */}
        <div className="p-6 border-b-2 border-[#f18a22] bg-gradient-to-r from-[#f18a22]/10 via-[#050505] to-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] font-mono">Dossier Identifier</span>
            <span className="text-3xl font-black text-white font-mono tracking-[0.1em]">{jcId}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-5 py-2 bg-[#f18a22] text-black font-black font-mono text-[12px] rounded border-2 border-black shadow-[0_0_20px_rgba(241,138,34,0.4)] uppercase tracking-widest">
              STATUS: {status}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-12">
          {/* CUSTOMER & VEHICLE METADATA GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <MetaBox label="Entity Identifier" value={customerName} isOutput={false} />
            <MetaBox label="Communication Node" value={contact} isOutput={false} />
            <MetaBox label="Reg Identity" value={regNo} />
            <MetaBox label="Model Architecture" value={vehicleModel} isOutput={false} />
            <MetaBox label="Distance Metric" value={`${odometer} KM`} />
            <MetaBox label="Propulsion System" value="ICE / PETROL" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* VOC (VOICE OF CUSTOMER) SECTION */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-6 bg-[#f18a22]"></div>
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] font-mono">VOC: Symptom Observation</span>
              </div>
              <div className="flex flex-col gap-4">
                {complaints.map((c, i) => {
                  const tempHsn = `VOC-${String(i + 1).padStart(3, '0')}`;
                  return (
                    <div key={i} className="flex flex-col gap-2 animate-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[8px] font-black text-[#f18a22] uppercase tracking-[0.3em] font-mono opacity-80">G4G Compliance HSN: {tempHsn}</span>
                      </div>
                      <div className="flex items-center gap-5 p-5 bg-[#080808] border-2 border-[#f18a22]/30 rounded-lg group hover:border-[#f18a22] hover:bg-[#f18a22]/5 transition-all duration-300 shadow-lg">
                        <span className="w-10 h-10 flex items-center justify-center bg-[#f18a22] text-black font-black font-mono text-[14px] rounded shadow-[0_0_15px_rgba(241,138,34,0.3)] shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-white font-mono text-[14px] font-bold tracking-tight uppercase leading-snug flex-1">{c}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INVENTORY & GATING SECTION */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-6 bg-[#f18a22]"></div>
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] font-mono">Inventory Analysis & Gating</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {inventory.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-[#0A0A0A] border-2 border-zinc-900 rounded-lg group hover:border-[#f18a22]/40 transition-all shadow-md">
                    <span className="text-[13px] font-mono font-bold text-zinc-400 uppercase tracking-tight">{item.item}</span>
                    <div className={`px-5 py-2 rounded text-[10px] font-black border-2 font-mono tracking-widest ${getStatusColor(item.status)}`}>
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ENERGY / FUEL MAPPING SECTION */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-6 bg-[#f18a22]"></div>
              <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] font-mono">Energy / Propulsion Mapping</span>
            </div>
            <div className="p-10 bg-[#0A0A0A] border-2 border-[#f18a22] rounded-xl flex flex-col md:flex-row items-center gap-12 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)]">
              <div className="flex-1 w-full relative h-7 bg-zinc-900 rounded-full border-2 border-white/5 overflow-hidden">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={fuelLevel} 
                  onChange={(e) => setFuelLevel(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div 
                  className="h-full bg-gradient-to-r from-[#f18a22] to-orange-400 shadow-[0_0_40px_rgba(241,138,34,0.5)] transition-all duration-300 relative z-10" 
                  style={{ width: `${fuelLevel}%` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-full bg-white/20 blur-2xl animate-pulse"></div>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                 <span className="text-[11px] font-black text-zinc-500 uppercase font-mono mb-[-6px] tracking-widest">Current Level</span>
                 <span className="text-6xl font-black text-[#f18a22] font-mono tracking-tighter leading-none">{fuelLevel}%</span>
              </div>
            </div>
          </div>

          {/* FOOTER SECTION - ARCHITECTURAL SYNC */}
          <div className="mt-12 pt-10 border-t-2 border-[#f18a22]/30 flex flex-col md:flex-row justify-between items-center gap-8 bg-gradient-to-t from-[#f18a22]/5 to-transparent p-8 rounded-b-xl">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-zinc-600 font-mono tracking-[0.5em] uppercase">Architecture Compliance Sync</span>
              <div className="flex items-center gap-3.5">
                 <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_12px_#22c55e]"></div>
                 <span className="text-[16px] font-black text-[#f18a22] font-mono tracking-widest">{timestamp}</span>
              </div>
            </div>
            <button 
              onClick={() => onComplete?.({ complaints, fuelLevel, inventory })}
              className="w-full md:w-auto px-24 py-6 bg-[#f18a22] text-black font-black uppercase tracking-[0.6em] font-mono rounded-lg hover:bg-white hover:text-black hover:scale-105 transition-all shadow-[0_20px_40px_rgba(241,138,34,0.4)] active:scale-95 border-4 border-black group"
            >
              Finalize Dossier
              <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .message-card {
          background: #050505;
          border: 2px solid #f18a22;
          border-left: 12px solid #f18a22 !important;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9);
          width: 100%;
        }

        .message-card input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 40px;
          width: 40px;
          border-radius: 6px;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(241, 138, 34, 0.9);
          border: 5px solid #000;
        }

        .message-card-wrapper {
          width: 100%;
          display: flex;
          justify-content: flex-start;
        }
      `}</style>
    </div>
  );
};

export default DigitalJobCard;
