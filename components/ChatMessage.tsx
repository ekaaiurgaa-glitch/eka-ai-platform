import React from 'react';
import { Message } from '../types';
import DiagnosticResult from './DiagnosticResult';
import MGAnalysis from './MGAnalysis';
import VehicleVisuals from './VehicleVisuals';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAi = message.role === 'assistant';
  
  return (
    <div className={`flex gap-4 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className={`shrink-0 w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
        isAi ? 'bg-transparent text-[#f18a22] border border-[#f18a22]' : 'bg-[#222] text-white'
      }`}>
        {isAi ? 'EKA' : 'U'}
      </div>
      <div className={`flex-1 max-w-[85%] text-[15px] leading-7 ${
        isAi ? 'text-white' : 'bg-[#111] p-3 rounded-2xl rounded-tr-sm text-white'
      }`}>
        <div className="whitespace-pre-wrap">{message.content}</div>
        {isAi && (
          <div className="mt-4 space-y-4">
            {message.diagnostic_data && <DiagnosticResult data={message.diagnostic_data} />}
            {message.mg_analysis && <MGAnalysis data={message.mg_analysis} />}
            {message.visual_metrics && <VehicleVisuals metric={message.visual_metrics} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
