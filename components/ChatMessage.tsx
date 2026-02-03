
import React from 'react';
import { Message, VehicleContext, EstimateData } from '../types';
import DigitalJobCard from './DigitalJobCard';
import ServiceHistory from './ServiceHistory';
import EstimateGovernance from './EstimateGovernance';
import VehicleVisuals from './VehicleVisuals';
import DiagnosticResult from './DiagnosticResult';

interface ChatMessageProps {
  message: Message;
  onPlayAudio?: (text: string) => void;
  isAudioPlaying?: boolean;
  vehicleContext?: VehicleContext;
  onUpdateContext?: (context: VehicleContext) => void;
  onEstimateAuthorize?: (data: EstimateData) => void;
  onJobCardComplete?: (data: any) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onPlayAudio, 
  isAudioPlaying, 
  vehicleContext,
  onUpdateContext,
  onEstimateAuthorize,
  onJobCardComplete
}) => {
  const isAi = message.role === 'assistant';

  const formatTechnicalTags = (text: string) => {
    const cleanText = text.replace(/\[\[STATE:.*?\]\]/g, '').trim();
    if (!cleanText && text.includes('[[STATE:')) return null;

    // Improved regex for Price Ranges (Pricing Firewall enforcement)
    // Matches: ₹5,000 - ₹7,000, 5000-7000, 5k to 7k, etc.
    const priceRangeRegex = /(?:₹|Rs\.?|INR)?\s*(\d+[\d,kK]*)\s*(?:-|to|until)\s*(?:₹|Rs\.?|INR)?\s*(\d+[\d,kK]*)/gi;
    const hsnRegex = /(HSN:\s*\d+)/gi;
    const gstRegex = /(GST:\s*\d+%\s*\([^)]+\))/gi;

    let parts: (string | React.ReactNode)[] = [cleanText];

    const applyRegex = (regex: RegExp, type: 'RANGE' | 'HSN' | 'GST') => {
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
                <span key={`range-${matchIdx}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border-2 border-dashed border-[#f18a22]/50 bg-[#f18a22]/5 text-[#f18a22] font-mono text-[11px] font-black mx-1 animate-in fade-in zoom-in duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f18a22] animate-pulse"></span>
                  <span className="opacity-60 text-[8px] tracking-widest">EST:</span>
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
    applyRegex(gstRegex, 'GST');

    return parts;
  };

  const renderContent = () => {
    if (!isAi) return <p className="text-base leading-relaxed text-zinc-300 font-inter">{message.content}</p>;

    const showJobCard = message.visual_assets?.vehicle_display_query === 'DIGITAL_JOB_CARD' || message.job_status_update === 'SYMPTOM_RECORDING' || message.job_status_update === 'AUTH_INTAKE';
    const showHistory = !!message.service_history && message.service_history.length > 0;
    const showEstimate = (message.job_status_update === 'ESTIMATE_GOVERNANCE' || message.estimate_data) && onEstimateAuthorize;
    const showMetrics = !!message.visual_metrics;
    const showDiagnostics = !!message.diagnostic_data;

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

        {showDiagnostics && message.diagnostic_data && (
          <DiagnosticResult data={message.diagnostic_data} />
        )}

        {showMetrics && message.visual_metrics && (
          <VehicleVisuals metric={message.visual_metrics} />
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
            status={message.job_status_update === 'AUTH_INTAKE' ? 'AWAITING_SYNC' : 'IN_PROGRESS'}
            onComplete={onJobCardComplete}
          />
        )}

        {showEstimate && message.estimate_data && (
          <EstimateGovernance 
            data={message.estimate_data} 
            onAuthorize={onEstimateAuthorize} 
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
      <div className={`message-container transition-all duration-300 ${isAi ? 'ai-style' : 'user-style'}`}>
        <div className="flex items-center gap-2 mb-4 border-b border-[#f18a22]/20 pb-2">
           <span className={`text-[10px] font-black uppercase tracking-[2px] font-mono ${isAi ? 'text-[#f18a22]' : 'text-zinc-500'}`}>
             {isAi ? 'EKA-Ai Architecture' : 'User Terminal'}
           </span>
           {isAi && onPlayAudio && message.response_content?.audio_text && (
             <button 
                onClick={() => onPlayAudio(message.response_content!.audio_text)}
                className={`ml-auto p-1.5 rounded transition-all ${isAudioPlaying ? 'bg-[#f18a22] text-black' : 'text-[#f18a22] hover:bg-[#f18a22]/10'}`}
                disabled={isAudioPlaying}
             >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
             </button>
           )}
        </div>

        <div className="content-box">
          {renderContent()}
        </div>

        <div className="mt-4 flex items-center justify-between opacity-40 text-[9px] font-mono font-bold uppercase">
           <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
           {isAi && <span>{message.intelligenceMode} MODE</span>}
        </div>
      </div>

      <style>{`
        .message-container {
          padding: 24px;
          border-radius: 12px;
          max-width: 90%;
          width: fit-content;
          min-width: 300px;
        }

        .ai-style {
          background: #050505;
          border: 2px solid #f18a22;
          box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        }

        .user-style {
          background: #0A0A0A;
          border: 1px solid #333;
          color: #eee;
        }

        .content-box {
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default ChatMessage;
