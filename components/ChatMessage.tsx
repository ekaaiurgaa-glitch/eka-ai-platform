
import React from 'react';
import { Message, VehicleContext, EstimateData } from '../types';
import DigitalJobCard from './DigitalJobCard';
import ServiceHistory from './ServiceHistory';
import EstimateGovernance from './EstimateGovernance';

interface ChatMessageProps {
  message: Message;
  onPlayAudio?: (text: string) => void;
  isAudioPlaying?: boolean;
  vehicleContext?: VehicleContext;
  onUpdateContext?: (context: VehicleContext) => void;
  onEstimateAuthorize?: (data: EstimateData) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onPlayAudio, 
  isAudioPlaying, 
  vehicleContext,
  onUpdateContext,
  onEstimateAuthorize
}) => {
  const isAi = message.role === 'assistant';

  const formatTechnicalTags = (text: string) => {
    const cleanText = text.replace(/\[\[STATE:.*?\]\]/g, '').trim();
    if (!cleanText && text.includes('[[STATE:')) return null;

    const rangeRegex = /((\d+[\d,]*)\s*(?:-|to)\s*(\d+[\d,]*))/gi;
    const hsnRegex = /(HSN:\s*\d+)/gi;
    const gstRegex = /(GST:\s*\d+%\s*\([^)]+\))/gi;

    let parts: (string | React.ReactNode)[] = [cleanText];

    const applyRegex = (regex: RegExp, className: string) => {
      let nextParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          nextParts.push(part);
          return;
        }
        const matches = part.split(regex);
        matches.forEach((subPart, i) => {
          if (subPart.match(regex)) {
            nextParts.push(
              <span key={i} className={`inline-block px-2 py-0.5 rounded border border-[#f18a22] bg-[#f18a22]/10 text-[#f18a22] font-mono text-[10px] mx-0.5`}>
                {subPart}
              </span>
            );
          } else {
            nextParts.push(subPart);
          }
        });
      });
      parts = nextParts;
    };

    applyRegex(rangeRegex, "");
    applyRegex(hsnRegex, "");
    applyRegex(gstRegex, "");

    return parts;
  };

  const renderContent = () => {
    if (!isAi) return <p className="text-base leading-relaxed text-zinc-300 font-inter">{message.content}</p>;

    const showJobCard = message.visual_assets?.vehicle_display_query === 'DIGITAL_JOB_CARD' || message.job_status_update === 'SYMPTOM_RECORDING';
    const showHistory = message.service_history !== undefined || (message.job_status_update === 'SYMPTOM_RECORDING' && vehicleContext?.registrationNumber);
    const showEstimate = (message.job_status_update === 'ESTIMATE_GOVERNANCE' || message.estimate_data) && onEstimateAuthorize;

    return (
      <div className="space-y-6">
        <div className="text-base leading-relaxed text-zinc-200 font-inter">
          {message.content.split('\n').map((line, i) => {
            const formatted = formatTechnicalTags(line);
            if (!formatted) return null;
            return (
              <div key={i} className="mb-2">
                {formatted}
              </div>
            );
          })}
        </div>

        {showHistory && (
          <ServiceHistory 
            regNo={vehicleContext?.registrationNumber || 'VEHICLE_ARCH'} 
            history={message.service_history} 
          />
        )}

        {showJobCard && (
          <DigitalJobCard 
            customerName="Authorized Tech"
            contact="N/A"
            vehicleModel={`${vehicleContext?.brand} ${vehicleContext?.model}`}
            regNo={vehicleContext?.registrationNumber || ''}
            odometer="12,450"
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
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
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
