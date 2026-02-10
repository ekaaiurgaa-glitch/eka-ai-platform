import React from 'react';
import { Message, IntelligenceMode } from '../types';
import DiagnosticResult from './DiagnosticResult';
import MGAnalysis from './MGAnalysis';
import VehicleVisuals from './VehicleVisuals';
import EstimateGovernance from './EstimateGovernance';
import PDIChecklist from './PDIChecklist';
import ServiceHistory from './ServiceHistory';
import RecallReport from './RecallReport';

const MODEL_CONFIG: Record<IntelligenceMode, { name: string; color: string }> = {
  'FAST': { name: 'Gemini', color: 'text-brand-orange' },
  'THINKING': { name: 'Claude', color: 'text-brand-orange' },
  'DEEP_CONTEXT': { name: 'Kimi', color: 'text-brand-orange' }
};

interface ChatMessageProps {
  message: Message;
  onEstimateApprove?: (data: any) => void;
  onPDIVerify?: (data: any) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onEstimateApprove, onPDIVerify }) => {
  const isAi = message.role === 'assistant';
  const modelConfig = message.intelligenceMode ? MODEL_CONFIG[message.intelligenceMode] : null;
  
  return (
    <div className={`flex gap-4 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className={`shrink-0 w-8 h-8 rounded border border-black flex items-center justify-center text-xs font-bold ${
        isAi ? 'bg-white text-brand-orange' : 'bg-white text-black'
      }`}>
        {isAi ? 'EKA' : 'U'}
      </div>
      <div className={`flex-1 max-w-[85%] text-[15px] leading-7 ${
        isAi ? 'message-ai' : 'message-user'
      }`}>
        <div className="whitespace-pre-wrap">
          {message.content}
          {isAi && modelConfig && (
            <span className={`text-[10px] ml-2 ${modelConfig.color}`}>
              • {modelConfig.name}
            </span>
          )}
        </div>
        {isAi && (
          <div className="mt-4 space-y-4">
            {message.diagnostic_data && <DiagnosticResult data={message.diagnostic_data} />}
            {message.mg_analysis && <MGAnalysis data={message.mg_analysis} />}
            {message.visual_metrics && <VehicleVisuals metric={message.visual_metrics} />}
            {message.estimate_data && (
              <EstimateGovernance 
                data={message.estimate_data} 
                onAuthorize={onEstimateApprove || (() => {})} 
              />
            )}
            {message.pdi_checklist && (
              <PDIChecklist 
                items={message.pdi_checklist.items}
                technician_declaration={message.pdi_checklist.technician_declaration}
                evidence_provided={message.pdi_checklist.evidence_provided}
                onVerify={onPDIVerify || (() => {})}
              />
            )}
            {message.service_history && message.service_history.length > 0 && (
              <ServiceHistory 
                history={message.service_history}
                regNo="Vehicle"
              />
            )}
            {message.recall_data && <RecallReport data={message.recall_data} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
