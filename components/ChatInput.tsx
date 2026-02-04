
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

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div 
      className="relative rounded-3xl transition-all"
      style={{ 
        backgroundColor: 'var(--input-bg)', 
        border: '1px solid var(--accent-primary)',
        boxShadow: '0 0 20px rgba(241, 138, 34, 0.1)'
      }}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
        placeholder="How can EKA-AI help with your fleet today?"
        className="w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none py-4 px-5 min-h-[56px] max-h-[200px] text-base"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-main)' }}
        rows={1}
        disabled={isLoading}
      />
      
      <div className="flex justify-between items-center px-3 pb-3">
        {/* Attachment Icon */}
        <button 
          className="p-2 rounded-lg transition-all hover:bg-white/5"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Attach file"
          title="Attach file"
        >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        </button>

        {/* Send Button - Orange Arrow */}
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="p-3 rounded-xl transition-all"
          style={{ 
            backgroundColor: input.trim() ? 'var(--accent-primary)' : 'var(--border-color)',
            color: input.trim() ? 'var(--text-on-accent)' : 'var(--text-secondary)'
          }}
          aria-label="Send message"
          title="Send message"
        >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
