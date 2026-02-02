
import React, { useState } from 'react';

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
  initialComplaints = [],
  onComplete
}) => {
  const [complaints, setComplaints] = useState<string[]>(initialComplaints);
  const [fuelLevel, setFuelLevel] = useState(65);
  const [inventory, setInventory] = useState({ spareWheel: true, toolKit: false });
  const timestamp = new Date().toLocaleString('en-IN', { 
    day: '2-digit', month: 'short', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false 
  }).toUpperCase();

  const handleAddIssue = () => {
    const issue = prompt("Enter Technical Complaint / Symptom:");
    if (issue) setComplaints([...complaints, issue]);
  };

  return (
    <div className="job-card-dossier animate-in fade-in zoom-in duration-700">
      {/* 1. HEADER SECTION */}
      <header className="dossier-header">
        <div className="header-left">
          <span className="jc-id">{jcId}</span>
          <span className="status-pill">{status}</span>
        </div>
        <div className="header-right">
          <span className="timestamp">{timestamp}</span>
        </div>
      </header>

      {/* 2. CUSTOMER & VEHICLE GRID */}
      <section className="architect-grid">
        <div className="data-block">
          <label>CUSTOMER PROFILE</label>
          <div className="data-row">
            <span className="val-label">Name</span>
            <span className="val-data">{customerName || 'N/A'}</span>
          </div>
          <div className="data-row">
            <span className="val-label">Contact</span>
            <span className="val-data">{contact || 'N/A'}</span>
          </div>
        </div>
        
        <div className="data-block">
          <label>VEHICLE ARCHITECTURE</label>
          <div className="data-row">
            <span className="val-label">Model</span>
            <span className="val-data">{vehicleModel || 'N/A'}</span>
          </div>
          <div className="data-row">
            <span className="val-label">Reg No</span>
            <span className="val-data">{regNo || 'N/A'}</span>
          </div>
          <div className="data-row">
            <span className="val-label">Odo</span>
            <span className="val-data">{odometer || '0'} KM</span>
          </div>
        </div>
      </section>

      {/* 3. VOICE OF CUSTOMER */}
      <section className="complaints-section">
        <label>VOICE OF CUSTOMER (VOC)</label>
        <ul className="complaint-list">
          {complaints.length > 0 ? (
            complaints.map((c, i) => <li key={i}>{c}</li>)
          ) : (
            <li className="opacity-50 italic">Awaiting technical symptoms...</li>
          )}
        </ul>
        <button className="btn-add-issue" onClick={handleAddIssue}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Logic Node
        </button>
      </section>

      {/* 4. VEHICLE INVENTORY */}
      <section className="inventory-section">
        <label>INTAKE INVENTORY CHECK</label>
        <div className="inventory-controls">
          <div className="fuel-gauge">
            <span className="val-label flex justify-between">
              Propulsion Energy 
              <span className="text-[#FF9F1C]">{fuelLevel}%</span>
            </span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={fuelLevel} 
              onChange={(e) => setFuelLevel(parseInt(e.target.value))}
              className="eka-slider" 
            />
          </div>
          
          <div className="check-grid">
            <label className="check-item group">
              <input 
                type="checkbox" 
                checked={inventory.spareWheel} 
                onChange={() => setInventory(i => ({...i, spareWheel: !i.spareWheel}))}
                className="hidden peer"
              />
              <div className="w-4 h-4 border border-[#222] rounded peer-checked:bg-[#FF9F1C] peer-checked:border-[#FF9F1C] transition-all"></div>
              <span className="group-hover:text-white transition-colors">Spare Wheel</span>
            </label>
            <label className="check-item group">
              <input 
                type="checkbox" 
                checked={inventory.toolKit} 
                onChange={() => setInventory(i => ({...i, toolKit: !i.toolKit}))}
                className="hidden peer"
              />
              <div className="w-4 h-4 border border-[#222] rounded peer-checked:bg-[#FF9F1C] peer-checked:border-[#FF9F1C] transition-all"></div>
              <span className="group-hover:text-white transition-colors">Tool Kit</span>
            </label>
          </div>
        </div>
      </section>

      {/* 5. FOOTER & CTA */}
      <footer className="dossier-footer">
        <div className="signature-box">
          <label>TECHNICIAN AUTH_SIGN</label>
          <div className="sig-line"></div>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => onComplete?.({ complaints, fuelLevel, inventory })}
        >
          INITIALIZE JOB CARD & SYNC DIGITAL TWIN
        </button>
      </footer>

      <style>{`
        .job-card-dossier {
          background-color: #050505;
          color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          max-width: 100%;
          border: 1px solid #222222;
          border-radius: 12px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8);
          margin-top: 1rem;
        }

        .job-card-dossier label {
          display: block;
          font-family: 'Roboto Mono', monospace;
          font-size: 0.65rem;
          color: #666666;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .dossier-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #222222;
          padding-bottom: 20px;
        }

        .jc-id {
          font-family: 'Roboto Mono', monospace;
          font-weight: 700;
          font-size: 1.1rem;
          margin-right: 12px;
        }

        .status-pill {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .timestamp {
          font-family: 'Roboto Mono', monospace;
          font-size: 0.7rem;
          color: #666666;
        }

        .architect-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .data-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #111;
        }

        .val-label {
          font-size: 0.75rem;
          color: #666666;
        }

        .val-data {
          font-size: 0.8rem;
          font-weight: 700;
          font-family: 'Roboto Mono', monospace;
        }

        .complaint-list {
          list-style: none;
          padding: 0;
          margin: 0 0 16px 0;
        }

        .complaint-list li {
          font-size: 0.85rem;
          padding: 10px 12px;
          background: #0D0D0D;
          border-left: 2px solid #FF9F1C;
          margin-bottom: 8px;
          border-radius: 0 4px 4px 0;
        }

        .btn-add-issue {
          background: transparent;
          border: 1px dashed #222222;
          color: #666666;
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-add-issue:hover {
          border-color: #FF9F1C;
          color: #FF9F1C;
        }

        .inventory-controls {
          background: #080808;
          padding: 20px;
          border-radius: 8px;
        }

        .fuel-gauge {
          margin-bottom: 20px;
        }

        .eka-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          background: #1A1A1A;
          border-radius: 2px;
          outline: none;
          margin: 15px 0;
        }

        .eka-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: #FF9F1C;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px #FF9F1C;
        }

        .check-grid {
          display: flex;
          gap: 24px;
        }

        .check-item {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 0.75rem;
          color: #666666;
        }

        .sig-line {
          height: 1px;
          background: #222222;
          width: 200px;
          margin-top: 24px;
        }

        .btn-primary {
          background-color: #FF9F1C;
          color: #000;
          border: none;
          width: 100%;
          padding: 20px;
          border-radius: 8px;
          font-weight: 900;
          font-size: 0.85rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.1s;
        }

        .btn-primary:active {
          transform: scale(0.98);
        }

        @media (max-width: 640px) {
          .architect-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default DigitalJobCard;
