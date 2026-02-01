
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

      // 3. Pricing Firewall: Handle Mandatory Disclaimer
      if (line.includes('Exact pricing is governed externally')) {
        return (
          <div key={i} className="my-4 p-4 bg-amber-950/20 border-2 border-dashed border-amber-600/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest">Pricing Firewall (Protocol 4.1)</span>
            </div>
            <p className="text-xs font-bold text-amber-200 leading-relaxed">{line}</p>
          </div>
        );
      }

      // 4. Highlight Estimated Price Ranges with explicit "NON-BINDING" labeling
      // Regex captures common currency symbols and range formats (e.g., ₹500 - ₹1000, $10 to $20)
      const priceRegex = /((?:[\$₹£€]\s?)?\d+(?:,\d+)*(?:\.\d+)?\s*(?:to|-|and)\s*(?:[\$₹£€]\s?)?\d+(?:,\d+)*(?:\.\d+)?)/gi;
      
      if (line.match(priceRegex)) {
        const parts = line.split(priceRegex);
        return (
          <div key={i} className="mb-0.5">
            {parts.map((part, index) => {
              if (part.match(priceRegex)) {
                return (
                  <span key={index} className="inline-flex flex-col items-start gap-1 p-2 bg-amber-500/5 border border-amber-500/30 rounded-md my-1">
                    <span className="text-amber-400 font-black text-sm tracking-tight">
                      {part}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-[7px] bg-amber-500 text-black px-1.5 py-0.5 rounded-sm font-black uppercase tracking-tighter">
                        NON-BINDING ESTIMATE
                      </span>
                      <span className="text-[7px] text-zinc-500 font-bold uppercase italic">
                        Subject to Workshop Audit
                      </span>
                    </span>
                  </span>
                );
              }
              return <span key={index}>{part}</span>;
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
          <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-xl ring-2 ring-black">
            Protocol Warning: Format Violation
          </div>
        )}
        
        {isAi && !message.validationError && message.isValidated && (
          <div className="absolute -top-2 -right-2 bg-green-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-xl ring-2 ring-black">
            Verified Output
          </div>
        )}

        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            {isAi ? (
              <>
                <div className="w-5 h-5 bg-[#FF6600] rounded-sm flex items-center justify-center text-[10px] font-black text-black shadow-[0_0_10px_rgba(255,102,0,0.3)]">E</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6600]">EKA-Ai Agent</span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Service Request</span>
              </>
            )}
          </div>
          <span className="text-[9px] text-zinc-600 font-mono font-bold">
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
