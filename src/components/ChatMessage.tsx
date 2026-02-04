
import React from 'react';
import { Message, VehicleContext, EstimateData } from '../types/types';
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
    <div className={`flex gap-4 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
      
      {/* AI Indicator - Orange Square Avatar with "EKA" text for AI, no avatar for User (right-aligned bubble) */}
      {isAi ? (
        <div 
          className="shrink-0 w-8 h-8 mt-1 rounded-sm flex items-center justify-center text-xs font-bold font-headers"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-primary)', border: '1px solid var(--border-color)' }}
          aria-label="AI message indicator"
          role="img"
        >
          EKA
        </div>
      ) : null}

      {/* Content */}
      <div className={`flex-1 max-w-[85%] text-[15px] leading-7 
        ${isAi 
          ? 'text-[var(--text-primary)]' 
          : 'bg-[var(--bg-tertiary)] p-4 rounded-2xl rounded-tr-sm text-[var(--text-primary)] ml-auto'
        }`}>
        
        {/* Name Label for AI */}
        {isAi && (
          <div className="font-semibold text-xs mb-1 text-[var(--accent-primary)] flex items-center gap-2 font-headers">
            EKA
          </div>
        )}
        
        {/* Text Body */}
        <div className="whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
          {message.content}
        </div>

        {/* Dynamic Content Containers (Keep existing logic) */}
        {isAi && (
          <div className="mt-4 space-y-4 border-l-2 border-[var(--accent-primary)]/30 pl-4">
            {message.diagnostic_data && <DiagnosticResult data={message.diagnostic_data} />}
            {message.visual_metrics && <VehicleVisuals metric={message.visual_metrics} />}
            {message.service_history && <ServiceHistory regNo={vehicleContext?.registrationNumber || ''} history={message.service_history} />}
            {message.estimate_data && onEstimateAuthorize && <EstimateGovernance data={message.estimate_data} onAuthorize={onEstimateAuthorize} />}
            {message.pdi_checklist && onPdiVerify && <PDIChecklist {...message.pdi_checklist} onVerify={onPdiVerify} />}
            {message.recall_data && <RecallReport data={message.recall_data} />}
            {message.mg_analysis && <MGAnalysisView data={message.mg_analysis} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
