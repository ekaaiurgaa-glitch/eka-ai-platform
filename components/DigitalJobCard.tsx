
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
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).toUpperCase().replace(',', ' |');
    setTimestamp(formatted);
  }, []);

  const handleAddIssue = () => {
    const issue = prompt("Enter Logic Node (New Complaint):");
    if (issue) setComplaints(prev => [...prev, issue]);
  };

  return (
    <div className="job-card-dossier animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER SECTION */}
      <header className="dossier-header">
        <div className="header-left">
          <div className="box-container border-orange">
            <span className="label-text">JOB_CARD_ID</span>
            <span className="value-text highlight-orange">{jcId}</span>
          </div>
          <div className="status-box">
             <span className="status-pill">{status}</span>
          </div>
        </div>
        <div className="header-right">
          <div className="box-container">
            <span className="label-text">SYS_TIME</span>
            <span className="value-text">{timestamp}</span>
          </div>
        </div>
      </header>

      {/* CUSTOMER & VEHICLE GRID */}
      <section className="architect-grid">
        <div className="dossier-section">
          <label className="section-label">01. CUSTOMER_PROFILE</label>
          <div className="grid-stack">
            <div className="box-container">
              <span className="label-text">NAME</span>
              <span className="value-text">{customerName || 'NOT_SPECIFIED'}</span>
            </div>
            <div className="box-container">
              <span className="label-text">CONTACT</span>
              <span className="value-text">{contact || 'AWAITING_AUTH'}</span>
            </div>
          </div>
        </div>
        
        <div className="dossier-section">
          <label className="section-label">02. VEHICLE_ARCHITECTURE</label>
          <div className="grid-stack">
            <div className="box-container">
              <span className="label-text">MODEL</span>
              <span className="value-text highlight-orange">{vehicleModel || 'UNIDENTIFIED'}</span>
            </div>
            <div className="box-container">
              <span className="label-text">REG_NO</span>
              <span className="value-text highlight-orange">{regNo || 'PENDING'}</span>
            </div>
            <div className="box-container">
              <span className="label-text">ODOMETER</span>
              <span className="value-text">{odometer || '0'} KM</span>
            </div>
          </div>
        </div>
      </section>

      {/* VOICE OF CUSTOMER */}
      <section className="complaints-section dossier-section">
        <label className="section-label">03. COMPLAINTS_TRIAGE (VOC)</label>
        <div className="complaint-stack">
          {complaints.map((c, i) => (
            <div key={i} className="box-container complaint-box">
              <span className="label-text">NODE_{String(i+1).padStart(2, '0')}</span>
              <span className="value-text">{c}</span>
            </div>
          ))}
          <button className="btn-add-issue" onClick={handleAddIssue}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            APPEND LOGIC NODE
          </button>
        </div>
      </section>

      {/* VEHICLE INVENTORY */}
      <section className="inventory-section dossier-section">
        <label className="section-label">04. INVENTORY_GATING</label>
        <div className="inventory-box-main border-orange">
          <div className="fuel-gauge">
            <span className="label-text">PROPULSION_LEVEL</span>
            <div className="slider-box">
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
          </div>
          
          <div className="check-grid">
            <div className={`check-box-container ${inventory.spareWheel ? 'active' : ''}`} onClick={() => setInventory(i => ({...i, spareWheel: !i.spareWheel}))}>
              <span className="label-text">SPARE_WHEEL</span>
              <span className="status-indicator">{inventory.spareWheel ? 'PRESENT' : 'MISSING'}</span>
            </div>
            <div className={`check-box-container ${inventory.toolKit ? 'active' : ''}`} onClick={() => setInventory(i => ({...i, toolKit: !i.toolKit}))}>
              <span className="label-text">TOOL_KIT</span>
              <span className="status-indicator">{inventory.toolKit ? 'PRESENT' : 'MISSING'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER & CTA */}
      <footer className="dossier-footer">
        <div className="box-container signature-box">
          <span className="label-text">AUTH_SIGNATURE_REQUIRED</span>
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
          --eka-orange: #f18a22;
          --bg-deep: #050505;
          --bg-card: #0A0A0A;
          --border-soft: #262626;
          --border-orange: #f18a22;
          --text-label: #52525b; /* zinc-600 */
          --text-value: #ffffff;
          --text-highlight: #f18a22;

          background-color: var(--bg-deep);
          color: var(--text-value);
          font-family: 'Inter', sans-serif;
          width: 100%;
          border: 2px solid var(--border-orange);
          border-radius: 16px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.9);
          margin: 1.5rem 0;
          position: relative;
          overflow: hidden;
        }

        /* --- UI COMPONENTS: BOXES --- */
        .box-container {
          background: var(--bg-card);
          border: 1px solid var(--border-soft);
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: all 0.2s ease;
        }

        .box-container.border-orange {
          border: 2px solid var(--border-orange);
          box-shadow: 0 0 15px rgba(241, 138, 34, 0.1);
        }

        .label-text {
          font-family: 'Roboto Mono', monospace;
          font-size: 9px;
          color: var(--text-label);
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .value-text {
          font-family: 'Roboto Mono', monospace;
          font-size: 14px;
          color: var(--text-value);
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .highlight-orange {
          color: var(--text-highlight);
        }

        .section-label {
          display: block;
          font-family: 'Roboto Mono', monospace;
          font-size: 11px;
          color: var(--text-label);
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 16px;
          font-weight: 800;
        }

        /* --- HEADER --- */
        .dossier-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .status-pill {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.4);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-family: 'Roboto Mono', monospace;
        }

        /* --- ARCHITECT GRID --- */
        .architect-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .grid-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* --- VOC SECTION --- */
        .complaint-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .complaint-box {
          border-left: 4px solid var(--eka-orange);
        }

        .btn-add-issue {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed var(--border-soft);
          color: var(--text-label);
          width: 100%;
          padding: 16px;
          border-radius: 8px;
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.3s;
          font-family: 'Roboto Mono', monospace;
          letter-spacing: 2px;
        }

        .btn-add-issue:hover {
          border-color: var(--eka-orange);
          color: var(--eka-orange);
          background: rgba(241, 138, 34, 0.05);
        }

        /* --- INVENTORY --- */
        .inventory-box-main {
          background: #080808;
          padding: 24px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .slider-box {
          display: flex;
          align-items: center;
          gap: 20px;
          background: var(--bg-card);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--border-soft);
        }

        .gauge-value {
          font-family: 'Roboto Mono', monospace;
          font-size: 18px;
          color: var(--eka-orange);
          font-weight: 900;
          min-width: 60px;
          text-align: right;
        }

        .eka-slider {
          -webkit-appearance: none;
          flex: 1;
          height: 4px;
          background: #1A1A1A;
          border-radius: 2px;
          outline: none;
        }

        .eka-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: var(--eka-orange);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 15px rgba(241, 138, 34, 0.6);
        }

        .check-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .check-box-container {
          background: var(--bg-card);
          border: 1px solid var(--border-soft);
          padding: 16px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .check-box-container.active {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.05);
        }

        .status-indicator {
          font-family: 'Roboto Mono', monospace;
          font-size: 12px;
          font-weight: 900;
          color: var(--text-label);
        }

        .active .status-indicator {
          color: #22c55e;
        }

        /* --- FOOTER --- */
        .signature-box {
          width: 300px;
          height: 100px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-style: dashed;
        }

        .sig-line {
          height: 1px;
          background: var(--border-soft);
          width: 100%;
          margin-top: auto;
        }

        .btn-primary {
          background-color: var(--eka-orange);
          color: #000;
          border: none;
          width: 100%;
          padding: 24px;
          border-radius: 12px;
          font-weight: 950;
          font-size: 15px;
          letter-spacing: 3px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 15px 30px -10px rgba(241, 138, 34, 0.5);
          font-family: 'Roboto Mono', monospace;
        }

        .btn-primary:hover {
          background-color: #FFF;
          box-shadow: 0 20px 40px -10px rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .btn-primary:active {
          transform: translateY(1px);
        }

        @media (max-width: 768px) {
          .architect-grid {
            grid-template-columns: 1fr;
          }
          .dossier-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .check-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DigitalJobCard;
