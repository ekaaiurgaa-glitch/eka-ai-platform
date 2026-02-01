
import React, { useState } from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  onPlayAudio?: (text: string) => void;
  isAudioPlaying?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onPlayAudio, isAudioPlaying }) => {
  const isAi = message.role === 'assistant';

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const isHeader = line.endsWith(':') && (
        line.startsWith('Symptoms') || 
        line.startsWith('Probable Cause') || 
        line.startsWith('Recommended Action') || 
        line.startsWith('Risk Level') || 
        line.startsWith('Next Required Input') ||
        line.startsWith('**Breach Type**') ||
        line.startsWith('**Remediation Required**')
      );

      if (isHeader) {
        const color = line.includes('Breach') ? 'text-red-500' : 'text-[#FF6600]';
        return <div key={i} className={`${color} font-bold mt-4 mb-1 text-xs uppercase tracking-wider`}>{line}</div>;
      }
      
      const isRisk = line.includes('Low') || line.includes('Medium') || line.includes('High');
      if (line.startsWith('Risk Level') || (isRisk && lines[i-1]?.startsWith('Risk Level'))) {
        let color = 'text-green-500';
        if (line.includes('Medium')) color = 'text-yellow-500';
        if (line.includes('High')) color = 'text-red-500';
        return <div key={i} className={`font-bold ${color}`}>{line}</div>;
      }

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

      if (line.startsWith('### AUDIT ALERT')) {
        return (
          <div key={i} className="flex items-center gap-2 mb-2 p-2 bg-red-900/20 border-l-4 border-red-500 rounded">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-black text-red-400 uppercase tracking-widest">{line.replace('### ', '')}</span>
          </div>
        );
      }

      const priceRegex = /((?:[\$₹£€]\s?)?\d+(?:,\d+)*(?:\.\d+)?\s*(?:to|-|and)\s*(?:[\$₹£€]\s?)?\d+(?:,\d+)*(?:\.\d+)?)/gi;
      
      if (line.match(priceRegex)) {
        const parts = line.split(priceRegex);
        return (
          <div key={i} className="mb-0.5">
            {parts.map((part, index) => {
              if (part.match(priceRegex)) {
                return (
                  <span key={index} className="inline-flex flex-col items-start gap-1 p-2 bg-amber-500/5 border border-amber-500/30 rounded-md my-1">
                    <span className="text-amber-400 font-black text-sm tracking-tight">{part}</span>
                    <span className="flex items-center gap-1">
                      <span className="text-[7px] bg-amber-500 text-black px-1.5 py-0.5 rounded-sm font-black uppercase tracking-tighter">NON-BINDING ESTIMATE</span>
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

  const displayContent = isAi ? (message.visual_content || message.content) : message.content;

  return (
    <div className={`flex w-full mb-6 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[90%] md:max-w-[80%] p-5 rounded-lg border shadow-lg relative ${
          isAi 
            ? message.validationError 
              ? 'bg-[#1a0a0a] border-red-900/50 text-zinc-100' 
              : 'bg-[#0A0A0A] border-[#262626] text-zinc-100' 
            : 'bg-[#121212] border-[#FF6600] text-zinc-100'
        }`}
      >
        {isAi && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            {message.audio_content && (
              <button 
                onClick={() => onPlayAudio?.(message.audio_content!)}
                className={`p-1.5 rounded-full ring-2 ring-black shadow-xl transition-all ${isAudioPlaying ? 'bg-[#FF6600] animate-pulse' : 'bg-zinc-800 hover:bg-[#FF6600]'}`}
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isAudioPlaying ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  )}
                </svg>
              </button>
            )}
            <div className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-xl ring-2 ring-black ${message.validationError ? 'bg-red-600' : 'bg-green-600'}`}>
              {message.validationError ? 'Audit Breach' : 'Verified Output'}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            {isAi ? (
              <>
                <div className={`w-5 h-5 ${message.validationError ? 'bg-red-600' : 'bg-[#FF6600]'} rounded-sm flex items-center justify-center text-[10px] font-black text-black`}>E</div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${message.validationError ? 'text-red-400' : 'text-[#FF6600]'}`}>EKA-Ai Agent</span>
                {message.language_code && (
                  <span className="text-[8px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-bold uppercase">{message.language_code}</span>
                )}
              </>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Service Request</span>
            )}
          </div>
          <span className="text-[9px] text-zinc-600 font-mono font-bold">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className={`text-sm leading-relaxed whitespace-pre-wrap font-medium ${message.validationError ? 'text-red-100/90' : 'text-zinc-100'}`}>
          {isAi ? renderContent(displayContent) : displayContent}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
