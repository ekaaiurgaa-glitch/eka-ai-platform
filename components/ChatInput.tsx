
import React, { useState, useRef, useEffect } from 'react';
import { OperatingMode, JobStatus } from '../types';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  operatingMode: OperatingMode;
  status: JobStatus;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, operatingMode, status }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="p-6 bg-[#000000] border-t border-[#262626]">
      <div className="max-w-4xl mx-auto flex gap-4 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter symptom, DTC or part name..."
            className="w-full bg-[#050505] text-white border border-[#f18a22] rounded-xl py-4 px-5 focus:outline-none focus:ring-1 focus:ring-[#f18a22] transition-all duration-300 resize-none placeholder:text-zinc-700 text-base"
            disabled={isLoading}
          />
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="h-[58px] px-8 bg-[#f18a22] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#d97a1d] transition-all disabled:bg-zinc-800 disabled:text-zinc-600 shadow-[0_0_20px_rgba(241,138,34,0.3)] active:scale-95 flex items-center gap-3"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
          ) : (
            <>
              <span>SEND</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </div>
      <div className="mt-3 text-center">
        <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.5em] font-mono">
          EKA-AI GOVERNANCE ENGINE ACTIVE • GO4GARAGE PRIVATE LIMITED
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
