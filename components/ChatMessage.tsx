
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
    <div className={`flex gap-4 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
      
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded flex items-center justify-center text-xs font-bold 
        ${isAi ? 'bg-[#D97757] text-white' : 'bg-gray-300 text-gray-700'}`}>
        {isAi ? 'AI' : 'U'}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] text-[15px] leading-7 
        ${isAi ? 'text-[var(--text-primary)]' : 'bg-[var(--bg-secondary)] p-3 rounded-2xl rounded-tr-sm text-[var(--text-primary)]'}`}>
        
        {/* Name Label */}
        {isAi && <div className="font-semibold text-sm mb-1 text-[var(--text-primary)]">EKA-AI</div>}
        
        {/* Text Body */}
        <div className="whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Dynamic Content Containers (Keep your existing logic here) */}
        {isAi && (
          <div className="mt-4 space-y-4 border-l-2 border-gray-200 pl-4">
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
