import React, { useState } from 'react';

const ChatInput: React.FC<any> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="bg-[#050505] border border-[#222] rounded-2xl shadow-2xl flex items-center p-2 focus-within:border-[#f18a22] transition-colors">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
        placeholder="Describe the vehicle issue or fleet query..."
        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-zinc-600 px-4 py-3 resize-none max-h-32 text-sm"
        rows={1}
        disabled={isLoading}
      />
      <button 
        onClick={handleSend}
        disabled={!input.trim() || isLoading}
        className={`p-3 rounded-xl transition-all ${
          input.trim() ? 'bg-[#f18a22] text-black hover:bg-white' : 'bg-[#111] text-zinc-600'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default ChatInput;
