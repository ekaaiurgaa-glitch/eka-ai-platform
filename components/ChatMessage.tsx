
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAi = message.role === 'assistant';

  return (
    <div className={`flex w-full mb-6 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[85%] md:max-w-[75%] p-4 rounded-lg border shadow-sm ${
          isAi 
            ? 'bg-[#0A0A0A] border-[#262626] text-zinc-100' 
            : 'bg-[#171717] border-[#FF6600] text-zinc-100'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          {isAi ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#FF6600] rounded-sm flex items-center justify-center text-[10px] font-bold text-black">E</div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6600]">EKA-AI Service Advisor</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">You</span>
            </div>
          )}
        </div>
        
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        <div className="mt-2 text-[10px] text-zinc-600 font-medium">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
