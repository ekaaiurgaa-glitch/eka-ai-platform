
import React from 'react';
import { Message, VehicleContext } from '../types';
import DigitalJobCard from './DigitalJobCard';
import ServiceHistory from './ServiceHistory';

interface ChatMessageProps {
  message: Message;
  onPlayAudio?: (text: string) => void;
  isAudioPlaying?: boolean;
  vehicleContext?: VehicleContext;
  onUpdateContext?: (context: VehicleContext) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onPlayAudio, 
  isAudioPlaying, 
  vehicleContext,
  onUpdateContext 
}) => {
  const isAi = message.role === 'assistant';

  const formatTechnicalTags = (text: string) => {
    const cleanText = text.replace(/\[\[STATE:.*?\]\]/g, '').trim();
    if (!cleanText && text.includes('[[STATE:')) return null;

    const rangeRegex = /((\d+[\d,]*)\s*(?:-|to)\s*(\d+[\d,]*))/gi;
    const hsnRegex = /(HSN:\s*\d+)/gi;
    const gstRegex = /(GST:\s*\d+%\s*\([^)]+\))/gi;

    let parts: (string | React.ReactNode)[] = [cleanText];

    const applyRegex = (regex: RegExp, className: string, iconType: 'price' | 'hsn' | 'gst') => {
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
              <span key={`${iconType}-${i}`} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-black text-[10px] shadow-sm mx-0.5 group/tag ${className}`}>
                {iconType === 'price' && (
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2v-3M13 11l-4-4m0 4l4-4" />
                  </svg>
                )}
                {iconType === 'hsn' && (
                   <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                   </svg>
                )}
                {iconType === 'gst' && (
                   <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                )}
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

    applyRegex(rangeRegex, "bg-[#f18a22]/10 border border-[#f18a22]/30 text-[#f18a22]", 'price');
    applyRegex(hsnRegex, "bg-blue-500/10 border border-blue-500/30 text-blue-400", 'hsn');
    applyRegex(gstRegex, "bg-green-500/10 border border-green-500/30 text-green-400", 'gst');

    return parts;
  };

  const renderContent = () => {
    if (!isAi) return <p className="text-base leading-relaxed text-zinc-300 font-inter">{message.content}</p>;

    const showJobCard = message.visual_assets?.vehicle_display_query === 'DIGITAL_JOB_CARD' || message.job_status_update === 'SYMPTOM_RECORDING';
    const showHistory = message.service_history !== undefined || (message.job_status_update === 'SYMPTOM_RECORDING' && vehicleContext?.registrationNumber);

    return (
      <div className="space-y-4">
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
            customerName="Authorized User"
            contact="N/A"
            vehicleModel={`${vehicleContext?.brand} ${vehicleContext?.model}`}
            regNo={vehicleContext?.registrationNumber || ''}
            odometer="12,450"
            onComplete={(data) => {
              console.log("Job Card Initialized:", data);
            }}
          />
        )}

        {message.grounding_links && message.grounding_links.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest font-mono block mb-2">Sources Found:</span>
            <div className="flex flex-wrap gap-2">
              {message.grounding_links.map((link, i) => (
                <a 
                  key={i} 
                  href={link.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-white/5 rounded-lg text-[10px] font-bold text-zinc-400 hover:border-[#f18a22]/40 hover:text-white transition-all group"
                >
                  <svg className="w-3 h-3 text-[#f18a22] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 00-2 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {link.title || "External Source"}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col mb-8 ${isAi ? 'items-start' : 'items-end'} w-full`}>
      <div className={`message-card transition-all duration-300 ${isAi ? 'ai-message' : 'user-message'} ${!isAi && message.ui_triggers?.show_orange_border ? 'border-r-4 border-r-[#f18a22]' : ''}`}>
        
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
           <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isAi ? 'bg-[#f18a22]' : 'bg-zinc-600'}`}></div>
              <span className="text-[11px] font-black uppercase tracking-[1.5px] text-zinc-500 font-mono">
                {isAi ? 'EKA Central OS' : 'User Terminal'}
              </span>
           </div>
           {isAi && onPlayAudio && message.response_content?.audio_text && (
             <button 
                onClick={() => onPlayAudio(message.response_content!.audio_text)}
                className={`p-2 rounded-lg transition-all ${isAudioPlaying ? 'bg-[#f18a22] text-black' : 'bg-zinc-800 text-zinc-400 hover:text-[#f18a22]'}`}
                disabled={isAudioPlaying}
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
             </button>
           )}
        </div>

        <div className="flex-1 overflow-x-auto">
          {renderContent()}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-3">
           <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
             {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })} • {message.intelligenceMode || 'FAST'} ENGINE
           </span>
           {isAi && message.job_status_update && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-black text-zinc-500 uppercase tracking-tighter font-mono">
                <span className="text-[8px] text-zinc-600 uppercase mr-1">STATE:</span>
                <span className="text-zinc-400">{message.job_status_update}</span>
              </div>
           )}
        </div>
      </div>

      <style>{`
        .message-card {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        }

        .ai-message {
          background-color: #050505;
          border: 1px solid #222222;
          border-left: 4px solid #FF9F1C;
          border-radius: 4px 12px 12px 4px;
          padding: 24px 32px;
        }

        .user-message {
          background-color: rgba(241, 138, 34, 0.1);
          border: 1px solid rgba(241, 138, 34, 0.3);
          border-radius: 16px 4px 16px 16px;
          padding: 20px 24px;
          max-width: 80%;
          align-self: flex-end;
        }

        /* Perfect alignment for the orange bar content */
        .ai-message > .flex-1 {
          margin-left: 4px;
        }
      `}</style>
    </div>
  );
};

export default ChatMessage;
