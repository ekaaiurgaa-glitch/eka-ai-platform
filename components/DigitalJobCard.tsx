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
  const [inventory, setInventory] = useState({ spareWheel: true, toolKit: false });
  const [timestamp, setTimestamp] = useState("05 OCT 2026 | 14:32:05");

  useEffect(() => {
    // For a real app, we'd use current time, but for the spec fidelity:
    const now = new Date();
    const formatted = now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).toUpperCase().replace(',', '');
    setTimestamp(formatted);
  }, []);

  const handleAddIssue = () => {
    const issue = prompt("Enter Complaint Logic Node:");
    if (issue) {
      setComplaints(prev => [...prev, issue]);
    }
  };

  return (
    <div className="job-card-dossier animate-in fade-in slide-in-from-bottom-4 duration-700">
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
            <span className="val-data">{customerName || 'Vikram Aditya Singh'}</span>
          </div>
          <div className="data-row">
            <span className="val-label">Contact</span>
            <span className="val-data">{contact || '+91 98765 43210'}</span>
          </div>
        </div>
        
        <div className="data-block">
          <label>VEHICLE ARCHITECTURE</label>
          <div className="data-row">
            <span className="val-label">Model</span>
            <span className="val-data">{vehicleModel || 'Tata Nexon EV Max'}</span>
          </div>
          <div className="data-row">
            <span className="val-label">Reg No</span>
            <span className="val-data">{regNo || 'MH 12 AB 1234'}</span>
          </div>
          <div className="data-row">
            <span className="val-label">Odo</span>
            <span className="val-data">{odometer || '12,450'} KM</span>
          </div>
        </div>
      </section>

      {/* 3. VOICE OF CUSTOMER */}
      <section className="complaints-section">
        <label>VOICE OF CUSTOMER (VOC)</label>
        <ul className="complaint-list">
          {complaints.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
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
            <span className="val-label">Propulsion Energy</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={fuelLevel} 
              onChange={(e) => setFuelLevel(parseInt(e.target.value))}
              className="eka-slider" 
            />
            <span className="gauge-value">{fuelLevel}%</span>
          </div>
          
          <div className="check-grid">
            <label className="check-item">
              <input 
                type="checkbox" 
                checked={inventory.spareWheel} 
                onChange={() => setInventory(i => ({...i, spareWheel: !i.spareWheel}))}
              />
              <span>Spare Wheel</span>
            </label>
            <label className="check-item">
              <input 
                type="checkbox" 
                checked={inventory.toolKit} 
                onChange={() => setInventory(i => ({...i, toolKit: !i.toolKit}))}
              />
              <span>Tool Kit</span>
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
          --eka-orange: #FF9F1C;
          --bg-deep: #050505;
          --bg-card: #0A0A0A;
          --border-soft: #222222;
          --text-dim: #666666;
          --text-bright: #FFFFFF;

          background-color: var(--bg-deep);
          color: var(--text-bright);
          font-family: 'Inter', sans-serif;
          max-width: 600px;
          margin: 20px auto;
          border: 1px solid var(--border-soft);
          border-radius: 12px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8);
        }

        .job-card-dossier label {
          display: block;
          font-family: 'Roboto Mono', monospace;
          font-size: 0.65rem;
          color: var(--text-dim);
          letter-spacing: 2.5px;
          text-transform: uppercase;
          margin-bottom: 12px;
          font-weight: 700;
        }

        /* --- HEADER --- */
        .dossier-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-soft);
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
          color: var(--text-dim);
        }

        /* --- ARCHITECT GRID --- */
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
          color: var(--text-dim);
        }

        .val-data {
          font-size: 0.8rem;
          font-weight: 700;
          font-family: 'Roboto Mono', monospace;
        }

        /* --- VOC SECTION --- */
        .complaint-list {
          list-style: none;
          padding: 0;
          margin: 0 0 16px 0;
        }

        .complaint-list li {
          font-size: 0.85rem;
          padding: 10px 12px;
          background: #0D0D0D;
          border-left: 2px solid var(--eka-orange);
          margin-bottom: 8px;
          border-radius: 0 4px 4px 0;
        }

        .btn-add-issue {
          background: transparent;
          border: 1px dashed var(--border-soft);
          color: var(--text-dim);
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
          border-color: var(--eka-orange);
          color: var(--eka-orange);
        }

        /* --- INVENTORY --- */
        .inventory-controls {
          background: #080808;
          padding: 20px;
          border-radius: 8px;
        }

        .fuel-gauge {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
        }

        .gauge-value {
          align-self: flex-end;
          font-family: 'Roboto Mono', monospace;
          font-size: 0.8rem;
          color: var(--eka-orange);
          font-weight: 700;
          margin-top: -10px;
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
          background: var(--eka-orange);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px var(--eka-orange);
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
        }

        .check-item input[type="checkbox"] {
          accent-color: var(--eka-orange);
        }

        .check-item span {
          font-size: 0.75rem;
          letter-spacing: 0;
          color: var(--text-dim);
        }

        /* --- FOOTER --- */
        .signature-box {
          margin-bottom: 32px;
        }

        .sig-line {
          height: 1px;
          background: var(--border-soft);
          width: 200px;
          margin-top: 24px;
        }

        .btn-primary {
          background-color: var(--eka-orange);
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