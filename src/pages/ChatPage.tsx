import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Bolt, Brain } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { JobStatus, IntelligenceMode, OperatingMode } from '../types';

// Get time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const ChatPage = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{role: string, parts: {text: string}[]}[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<IntelligenceMode>('FAST');
  const [operatingMode, setOperatingMode] = useState<OperatingMode>(0);
  const [status, setStatus] = useState<JobStatus>('CREATED');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', parts: [{ text: input }] };
    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await geminiService.sendMessage([...history, userMsg], {}, status, mode, operatingMode);
      
      const aiText = response.response_content?.visual_text || "System Error";
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: aiText }] }]);
      
      if (response.job_status_update) setStatus(response.job_status_update);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOperatingModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOperatingMode(parseInt(e.target.value) as OperatingMode);
  };

  return (
    <main className="flex-1 flex flex-col h-screen relative bg-[#fafaf9]">
      {/* Top Bar */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-gray-800 text-sm">New Chat</h2>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-2">
             <span className="text-xs text-gray-500">Mode:</span>
             <select 
               value={operatingMode}
               onChange={handleOperatingModeChange}
               className="text-xs font-medium bg-transparent border-none outline-none cursor-pointer"
             >
               <option value={0}>🔥 Ignition</option>
               <option value={1}>🔧 Workshop</option>
               <option value={2}>🚛 Fleet</option>
             </select>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {history.length === 0 && (
          <div className="max-w-3xl mx-auto pt-12 pb-8 text-center animate-fade-in">
             <h1 className="font-serif text-4xl md:text-5xl text-gray-900 mb-4">
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-green italic">{getGreeting()}, Go4Garage</span>
             </h1>
             <p className="text-gray-500">How can I assist with your workshop today?</p>
          </div>
        )}
        
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-5 py-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-[#f3f4f6] text-gray-900 rounded-[18px_18px_4px_18px]' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-[18px_18px_18px_4px] shadow-sm'
            }`}>
              {msg.parts[0].text}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-gray-400 text-center animate-pulse">EKA-AI is thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-md p-4">
        <div className="max-w-3xl mx-auto">
           {/* Controls */}
           <div className="flex items-center justify-between mb-2 px-1">
             <button 
               onClick={() => setMode(mode === 'FAST' ? 'THINKING' : 'FAST')}
               className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
             >
               {mode === 'FAST' ? <Bolt size={12} className="text-brand-orange"/> : <Brain size={12} className="text-brand-purple"/>}
               {mode === 'FAST' ? 'FAST (Gemini)' : 'EXPERT (Claude)'}
             </button>
           </div>

           {/* Input Box */}
           <div className="bg-white border border-gray-200 rounded-2xl flex items-end gap-2 p-2 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] focus-within:shadow-[0_0_0_2px_rgba(91,44,111,0.2)] transition-shadow">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={handleKeyDown}
               placeholder="Message EKA-AI..."
               className="flex-1 resize-none border-0 focus:ring-0 text-gray-900 placeholder-gray-400 py-3 px-3 max-h-32 bg-transparent text-sm outline-none"
               rows={1}
             />
             <div className="flex gap-2 pb-1">
                <button className="text-gray-400 hover:text-gray-600 p-2"><Paperclip size={18}/></button>
                <button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2 bg-brand-purple text-white rounded-xl hover:bg-[#4a2360] disabled:opacity-40 transition-all"
                >
                  <Send size={16} />
                </button>
             </div>
           </div>
        </div>
      </div>
    </main>
  );
};

export default ChatPage;
