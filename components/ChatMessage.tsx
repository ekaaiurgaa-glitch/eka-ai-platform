
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAi = message.role === 'assistant';

  // Function to stylize structured output
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const isHeader = line.endsWith(':') && (
        line.startsWith('Symptoms') || 
        line.startsWith('Probable Cause') || 
        line.startsWith('Recommended Action') || 
        line.startsWith('Risk Level') || 
        line.startsWith('Next Required Input')
      );

      if (isHeader) {
        return <div key={i} className="text-[#FF6600] font-bold mt-4 mb-1 text-xs uppercase tracking-wider">{line}</div>;
      }
      
      const isRisk = line.includes('Low') || line.includes('Medium') || line.includes('High');
      if (line.startsWith('Risk Level') || (isRisk && lines[i-1]?.startsWith('Risk Level'))) {
        let color = 'text-green-500';
        if (line.includes('Medium')) color = 'text-yellow-500';
        if (line.includes('High')) color = 'text-red-500';
        return <div key={i} className={`font-bold ${color}`}>{line}</div>;
      }

      return <div key={i} className="mb-0.5">{line}</div>;
    });
  };

  return (
    <div className={`flex w-full mb-6 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[90%] md:max-w-[80%] p-5 rounded-lg border shadow-lg ${
          isAi 
            ? 'bg-[#0A0A0A] border-[#262626] text-zinc-100' 
            : 'bg-[#121212] border-[#FF6600] text-zinc-100'
        }`}
      >
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            {isAi ? (
              <>
                <div className="w-5 h-5 bg-[#FF6600] rounded-sm flex items-center justify-center text-[10px] font-black text-black">E</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6600]">EKA-Ai Agent</span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Service Request</span>
              </>
            )}
          </div>
          <span className="text-[9px] text-zinc-600 font-mono">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        
        <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
          {isAi ? renderContent(message.content) : message.content}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
