
import React from 'react';
import { Message, VehicleContext, EstimateData } from '../types';
import DigitalJobCard from './DigitalJobCard';
import ServiceHistory from './ServiceHistory';
import EstimateGovernance from './EstimateGovernance';
import VehicleVisuals from './VehicleVisuals';
import DiagnosticResult from './DiagnosticResult';
import MGAnalysisView from './MGAnalysis';
import PDIChecklist from './PDIChecklist';
import RecallReport from './RecallReport';

interface ChatMessageProps {
  message: Message;
  onPlayAudio?: (text: string) => void;
  isAudioPlaying?: boolean;
  vehicleContext?: VehicleContext;
  onUpdateContext?: (context: VehicleContext) => void;
  onEstimateAuthorize?: (data: EstimateData) => void;
  onJobCardComplete?: (data: any) => void;
  onPdiVerify?: (data: { verified: boolean }) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onPlayAudio, 
  isAudioPlaying, 
  vehicleContext,
  onUpdateContext,
  onEstimateAuthorize,
  onJobCardComplete,
  onPdiVerify
}) => {
  const isAi = message.role === 'assistant';

  const formatTechnicalTags = (text: string) => {
    const cleanText = text.replace(/\[\[STATE:.*?\]\]/g, '').trim();
    if (!cleanText && text.includes('[[STATE:')) return null;

    const priceRangeRegex = /(?:₹|Rs\.?|INR)?\s*(\d+[\d,kK]*)\s*(?:-|to|until)\s*(?:₹|Rs\.?|INR)?\s*(\d+[\d,kK]*)/gi;
    const hsnRegex = /(HSN:\s*\d+)/gi;

    let parts: (string | React.ReactNode)[] = [cleanText];

    const applyRegex = (regex: RegExp, type: 'RANGE' | 'HSN') => {
      let nextParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          nextParts.push(part);
          return;
        }
        
        const splitParts = part.split(regex);
        const matches = part.match(regex);
        
        let matchIdx = 0;
        splitParts.forEach((subPart, i) => {
          nextParts.push(subPart);
          if (matches && matchIdx < matches.length && part.indexOf(matches[matchIdx], subPart.length) !== -1) {
            const matchText = matches[matchIdx];
            
            if (type === 'RANGE') {
              nextParts.push(
                <span key={`range-${matchIdx}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border-2 border-dashed border-[#f18a22]/50 bg-[#f18a22]/5 text-[#f18a22] font-mono text-[11px] font-black mx-1">
                  {matchText}
                </span>
              );
            } else {
              nextParts.push(
                <span key={`${type.toLowerCase()}-${matchIdx}`} className={`inline-block px-2 py-0.5 rounded border border-[#f18a22] bg-[#f18a22]/10 text-[#f18a22] font-mono text-[10px] mx-0.5`}>
                  {matchText}
                </span>
              );
            }
            matchIdx++;
          }
        });
      });
      parts = nextParts;
    };

    applyRegex(priceRangeRegex, 'RANGE');
    applyRegex(hsnRegex, 'HSN');

    return parts;
  };

  const renderContent = () => {
    if (!isAi) return <p className="text-base leading-relaxed text-zinc-300 font-inter">{message.content}</p>;

    const showJobCard = message.job_status_update === 'INTAKE' || message.job_status_update === 'AUTH_INTAKE';
    const showHistory = !!message.service_history && message.service_history.length > 0;
    const showEstimate = (message.job_status_update === 'ESTIMATION' || message.estimate_data) && onEstimateAuthorize;
    const showMetrics = !!message.visual_metrics;
    const showDiagnostics = !!message.diagnostic_data;
    const showMGAnalysis = !!message.mg_analysis;
    const showPdi = !!message.pdi_checklist && onPdiVerify;
    const showRecalls = !!message.recall_data;

    return (
      <div className="space-y-6">
        <div className="text-base leading-relaxed text-zinc-200 font-inter">
          {message.content.split('\n').map((line, i) => {
            const formatted = formatTechnicalTags(line);
            if (!formatted) return null;
            return (
              <div key={i} className="mb-2 last:mb-0">
                {formatted}
              </div>
            );
          })}
        </div>

        {showRecalls && message.recall_data && (
          <RecallReport data={message.recall_data} />
        )}

        {showMetrics && message.visual_metrics && (
          <div className="report-frame">
            <VehicleVisuals metric={message.visual_metrics} />
          </div>
        )}

        {showMGAnalysis && message.mg_analysis && (
          <MGAnalysisView data={message.mg_analysis} />
        )}

        {showDiagnostics && message.diagnostic_data && (
          <DiagnosticResult data={message.diagnostic_data} />
        )}

        {showHistory && (
          <ServiceHistory 
            regNo={vehicleContext?.registrationNumber || 'VEHICLE_ARCH'} 
            history={message.service_history} 
          />
        )}

        {showJobCard && (
          <DigitalJobCard 
            customerName="Authorized Tech"
            vehicleModel={`${vehicleContext?.brand} ${vehicleContext?.model}`}
            regNo={vehicleContext?.registrationNumber || 'MH-12-G4G'}
            odometer="12,450"
            status={message.job_status_update === 'INTAKE' ? 'IN_PROGRESS' : 'AWAITING_SYNC'}
            onComplete={onJobCardComplete}
          />
        )}

        {showEstimate && message.estimate_data && (
          <EstimateGovernance 
            data={message.estimate_data} 
            onAuthorize={onEstimateAuthorize} 
          />
        )}

        {showPdi && message.pdi_checklist && (
          <PDIChecklist 
            items={message.pdi_checklist.items}
            technician_declaration={message.pdi_checklist.technician_declaration}
            evidence_provided={message.pdi_checklist.evidence_provided}
            onVerify={onPdiVerify}
          />
        )}

        {message.grounding_links && message.grounding_links.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#f18a22]/30 space-y-2">
            <span className="text-[9px] font-black text-[#f18a22] uppercase tracking-widest font-mono">Verified References:</span>
            <div className="flex flex-wrap gap-2">
              {message.grounding_links.map((link, i) => (
                <a 
                  key={i} 
                  href={link.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-zinc-900 border border-[#f18a22]/50 rounded text-[10px] font-mono text-[#f18a22] hover:bg-[#f18a22] hover:text-black transition-all"
                >
                  {link.title || "External Logic Source"}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col mb-10 ${isAi ? 'items-start' : 'items-end'} w-full`}>
      <div className={`message-card transition-all duration-300 ${isAi ? 'ai-style' : 'user-style'}`}>
        <div className="flex items-center gap-2 mb-4 border-b border-[#f18a22]/20 pb-3">
           <span className={`text-[10px] font-black uppercase tracking-[2px] font-mono ${isAi ? 'text-[#f18a22]' : 'text-zinc-500'}`}>
             {isAi ? 'EKA-AI ONLINE' : 'USER TERMINAL'}
           </span>
           {isAi && onPlayAudio && message.response_content?.audio_text && (
             <button 
                onClick={() => onPlayAudio(message.response_content!.audio_text)}
                className={`ml-auto p-1.5 rounded-md transition-all ${isAudioPlaying ? 'bg-[#f18a22] text-black shadow-[0_0_10px_#f18a22]' : 'text-[#f18a22] hover:bg-[#f18a22]/10'}`}
                disabled={isAudioPlaying}
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
             </button>
           )}
        </div>

        <div className="content-box">
          {renderContent()}
        </div>

        <div className="mt-5 pt-3 border-t border-zinc-900/50 flex items-center justify-between opacity-50 text-[9px] font-mono font-black uppercase tracking-widest">
           <div className="flex items-center gap-2">
             <span className="w-1 h-1 rounded-full bg-[#f18a22]"></span>
             <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
           </div>
           {isAi && <span>OS: {message.intelligenceMode} • SYNC_OK</span>}
        </div>
      </div>

      <style>{`
        .message-card {
          border-radius: 12px;
          max-width: 90%;
          width: fit-content;
          min-width: 320px;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }

        .ai-style {
          background: #0b0b0b;
          border: 2px solid #f18a22;
          border-left: 10px solid #f18a22;
          padding: 24px;
          box-shadow: inset -5px 0 30px rgba(241, 138, 34, 0.05), 0 20px 50px -10px rgba(0, 0, 0, 0.8);
        }

        .user-style {
          background: #111111;
          border: 1px solid #222222;
          padding: 24px;
          color: #eee;
          box-shadow: 0 10px 40px -15px rgba(0, 0, 0, 0.6);
        }

        .content-box {
          position: relative;
          width: 100%;
          z-index: 10;
        }

        .report-frame {
          border: 1px solid #262626;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          margin-top: 1.5rem;
          box-shadow: 0 15px 40px -10px rgba(0,0,0,0.4);
        }

        .ai-style::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(241, 138, 34, 0.2), transparent);
          z-index: 1;
          pointer-events: none;
          animation: scanline 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ChatMessage;
