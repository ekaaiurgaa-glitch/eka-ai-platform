
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAi = message.role === 'assistant';

  // Function to stylize structured output and enforce Pricing Firewall visuals
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // 1. Check for Diagnostic Headers
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
      
      // 2. Check for Risk Levels
      const isRisk = line.includes('Low') || line.includes('Medium') || line.includes('High');
      if (line.startsWith('Risk Level') || (isRisk && lines[i-1]?.startsWith('Risk Level'))) {
        let color = 'text-green-500';
        if (line.includes('Medium')) color = 'text-yellow-500';
        if (line.includes('High')) color = 'text-red-500';
        return <div key={i} className={`font-bold ${color}`}>{line}</div>;
      }

      // 3. Pricing Firewall: Handle Disclaimer
      if (line.includes('Exact pricing is governed externally')) {
        return (
          <div key={i} className="my-3 p-3 bg-zinc-900 border-l-4 border-amber-500 rounded-r-md">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pricing Firewall Disclaimer</span>
            </div>
            <p className="text-xs italic text-zinc-300 font-medium">{line}</p>
          </div>
        );
      }

      // 4. Highlight Estimated Price Ranges
      // Simple check for numbers/currency and keywords like "between", "range", "to"
      const priceRegex = /(\$?\d+(?:,\d+)?(?:\.\d+)?\s*(?:to|-|and)\s*\$?\d+(?:,\d+)?(?:\.\d+)?)/gi;
      if (line.match(priceRegex)) {
        const parts = line.split(priceRegex);
        return (
          <div key={i} className="mb-0.5">
            {parts.map((part, index) => {
              if (part.match(priceRegex)) {
                return (
                  <span key={index} className="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 font-bold whitespace-nowrap">
                    {part}
                    <span className="text-[8px] bg-amber-500 text-black px-1 rounded-sm leading-tight">ESTIMATE</span>
                  </span>
                );
              }
              return part;
            })}
          </div>
        );
      }

      return <div key={i} className="mb-0.5">{line}</div>;
    });
  };

  return (
    <div className={`flex w-full mb-6 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[90%] md:max-w-[80%] p-5 rounded-lg border shadow-lg relative ${
          isAi 
            ? 'bg-[#0A0A0A] border-[#262626] text-zinc-100' 
            : 'bg-[#121212] border-[#FF6600] text-zinc-100'
        }`}
      >
        {isAi && message.validationError && (
          <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-xl">
            Protocol Warning: Format Violation
          </div>
        )}
        
        {isAi && !message.validationError && message.isValidated && (
          <div className="absolute -top-2 -right-2 bg-green-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-xl">
            Verified Output
          </div>
        )}

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
