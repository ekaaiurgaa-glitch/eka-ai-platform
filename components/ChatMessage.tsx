
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
      
      {/* AI Indicator - Orange Square for AI, subtle for User */}
      {isAi ? (
        <div className="shrink-0 flex items-start gap-2">
          <div 
            className="w-2 h-2 rounded-sm mt-2" 
            style={{ backgroundColor: 'var(--accent-primary)' }}
          ></div>
        </div>
      ) : (
        <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
          U
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 max-w-[85%] text-[15px] leading-7 
        ${isAi ? '' : 'p-4 rounded-2xl rounded-tr-sm'}`}
        style={isAi ? { color: 'var(--text-primary)' } : { backgroundColor: 'var(--msg-user-bg)', color: 'var(--text-primary)' }}
      >
        
        {/* EKA Label for AI */}
        {isAi && (
          <div className="font-semibold text-xs mb-2 tracking-wide" style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-headers)' }}>
            EKA
          </div>
        )}
        
        {/* Text Body */}
        <div className="whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
          {message.content}
        </div>

        {/* Dynamic Content Containers (Keep existing logic) */}
        {isAi && (
          <div className="mt-4 space-y-4 pl-4" style={{ borderLeft: '2px solid var(--border-color)' }}>
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
