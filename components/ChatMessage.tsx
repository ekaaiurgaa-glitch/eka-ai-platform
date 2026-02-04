import React from 'react';
import { Message } from '../types';
import DiagnosticResult from './DiagnosticResult';
import MGAnalysis from './MGAnalysis';
import VehicleVisuals from './VehicleVisuals';
import EstimateGovernance from './EstimateGovernance';
import PDIChecklist from './PDIChecklist';
import ServiceHistory from './ServiceHistory';
import RecallReport from './RecallReport';

interface ChatMessageProps {
  message: Message;
  onEstimateApprove?: (data: any) => void;
  onPDIVerify?: (data: any) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onEstimateApprove, onPDIVerify }) => {
  const isAi = message.role === 'assistant';
  
  return (
    <div className={`flex gap-4 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className={`shrink-0 w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
        isAi ? 'bg-transparent text-[#f18a22] border border-[#f18a22]' : 'bg-[#222] text-white'
      }`}>
        {isAi ? 'EKA' : 'U'}
      </div>
      <div className={`flex-1 max-w-[85%] text-[15px] leading-7 ${
        isAi ? 'text-white' : 'bg-[var(--msg-user-bg)] p-3 rounded-2xl rounded-tr-sm text-white'
      }`}>
        <div className="whitespace-pre-wrap">
          {message.content}
          {isAi && message.intelligenceMode && (
            <span className={`text-[10px] ml-2 ${
              message.intelligenceMode === 'THINKING' 
                ? 'text-purple-400' 
                : message.intelligenceMode === 'DEEP_CONTEXT'
                ? 'text-blue-400'
                : 'text-[#f18a22]/70'
            }`}>
              • {message.intelligenceMode === 'THINKING' ? 'Claude' : message.intelligenceMode === 'DEEP_CONTEXT' ? 'Kimi' : 'Gemini'}
            </span>
          )}
        </div>
        {isAi && (
          <div className="mt-4 space-y-4">
            {/* Diagnostic Result */}
            {message.diagnostic_data && <DiagnosticResult data={message.diagnostic_data} />}
            
            {/* MG Analysis for Fleet mode */}
            {message.mg_analysis && <MGAnalysis data={message.mg_analysis} />}
            
            {/* Visual Metrics */}
            {message.visual_metrics && <VehicleVisuals metric={message.visual_metrics} />}
            
            {/* Estimate Governance */}
            {message.estimate_data && (
              <EstimateGovernance 
                data={message.estimate_data} 
                onAuthorize={onEstimateApprove || (() => {})} 
              />
            )}
            
            {/* PDI Checklist */}
            {message.pdi_checklist && (
              <PDIChecklist 
                items={message.pdi_checklist.items}
                technician_declaration={message.pdi_checklist.technician_declaration}
                evidence_provided={message.pdi_checklist.evidence_provided}
                onVerify={onPDIVerify || (() => {})}
              />
            )}
            
            {/* Service History */}
            {message.service_history && message.service_history.length > 0 && (
              <ServiceHistory 
                history={message.service_history}
                regNo="Vehicle"
              />
            )}
            
            {/* Recall Report */}
            {message.recall_data && <RecallReport data={message.recall_data} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
