
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
  onEstimateAuthorize,
  onJobCardComplete,
  onPdiVerify
}) => {
  const isAi = message.role === 'assistant';

  return (
    <div className={`flex flex-col mb-10 ${isAi ? 'items-start' : 'items-end'} w-full animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`message-bubble ${isAi ? 'ai-bubble' : 'user-bubble'}`}>
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
           <span className={`text-[10px] font-black uppercase tracking-[2px] font-mono ${isAi ? 'text-[#f18a22]' : 'text-zinc-500'}`}>
             {isAi ? 'EKA-AI ONLINE' : 'USER TERMINAL'}
           </span>
           {isAi && onPlayAudio && (
             <button 
                onClick={() => onPlayAudio(message.content)}
                className={`p-1.5 rounded-md hover:bg-[#f18a22]/10 transition-colors ${isAudioPlaying ? 'text-[#f18a22] shadow-[0_0_10px_rgba(241,138,34,0.3)]' : 'text-zinc-500'}`}
                title="Play Audio Briefing"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
             </button>
           )}
        </div>

        <div className="text-base leading-relaxed text-zinc-200 font-inter">
          {message.content.split('\n').map((line, i) => <p key={i} className="mb-2 last:mb-0">{line}</p>)}
        </div>

        {isAi && (
          <div className="mt-6 space-y-6">
            {message.diagnostic_data && <DiagnosticResult data={message.diagnostic_data} />}
            {message.visual_metrics && <VehicleVisuals metric={message.visual_metrics} />}
            {message.service_history && <ServiceHistory regNo={vehicleContext?.registrationNumber || ''} history={message.service_history} />}
            {message.estimate_data && onEstimateAuthorize && <EstimateGovernance data={message.estimate_data} onAuthorize={onEstimateAuthorize} />}
            {message.pdi_checklist && onPdiVerify && <PDIChecklist {...message.pdi_checklist} onVerify={onPdiVerify} />}
            {message.recall_data && <RecallReport data={message.recall_data} />}
            {message.mg_analysis && <MGAnalysisView data={message.mg_analysis} />}
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between opacity-30 text-[9px] font-mono font-black uppercase tracking-widest">
           <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
           {isAi && <span>OS_SYNC: SECURE_STABLE</span>}
        </div>
      </div>

      <style>{`
        .message-bubble {
          max-width: 85%;
          width: fit-content;
          min-width: 300px;
          padding: 24px;
          border-radius: 20px;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.8);
          position: relative;
        }
        .ai-bubble {
          background-color: #0b0b0b;
          border: 1px solid #f18a22;
          border-left: 8px solid #f18a22;
        }
        .user-bubble {
          background-color: #111111;
          border: 1px solid #222222;
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default ChatMessage;
