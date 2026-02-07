import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Brain } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { useJobCard } from '../hooks/useJobCard';
import { JobStatus, IntelligenceMode, OperatingMode } from '../types';

const ChatPage = () => {
  const [messages, setMessages] = useState<{role: string, parts: {text: string}[]}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [mode, setMode] = useState<IntelligenceMode>('FAST');
  const [status, setStatus] = useState<JobStatus>('CREATED');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Connect to Job Card system
  const [jobCardState, jobCardActions] = useJobCard();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Add User Message
    const userMsg = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 2. Call AI Service with existing history
      const response = await geminiService.sendMessage(
        [...messages, userMsg], 
        jobCardState.vehicleData || undefined,
        status,
        mode,
        0 as OperatingMode
      );
      
      // 3. Add AI Response
      const aiText = response.response_content?.visual_text || "System processing...";
      const aiMsg = { role: 'model', parts: [{ text: aiText }] };
      setMessages(prev => [...prev, aiMsg]);

      // 4. Handle "Side Effects" - Initialize Job Card if AI signals
      if (response.ui_triggers?.show_orange_border && !jobCardState.jobCard) {
        // Extract registration from message or use default
        const regMatch = input.match(/([A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{0,2}[\s-]?\d{1,4})/i);
        jobCardActions.initializeJobCard({
          vehicleType: '4W',
          brand: '',
          model: '',
          year: '',
          fuelType: '',
          registrationNumber: regMatch ? regMatch[1].toUpperCase() : 'NEW-VEHICLE',
        });
      }

      // Update status if provided
      if (response.job_status_update) {
        setStatus(response.job_status_update);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Connection error. Please check backend." }] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      
      {/* 1. Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40 mt-20">
            <div className="w-16 h-16 bg-brand-orange rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl font-bold text-white">E</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">How can I help with the garage today?</h2>
            <p className="text-text-secondary">Create job cards, diagnose issues, or check inventory.</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
           <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
             {msg.role === 'model' && (
               <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-brand-orange flex-shrink-0">
                 <Brain size={14} />
               </div>
             )}
             <div className={`px-4 py-3 rounded-2xl max-w-[85%] leading-relaxed text-sm ${
               msg.role === 'user' 
                 ? 'bg-surface text-text-primary border border-border' 
                 : 'text-text-primary'
             }`}>
               {msg.parts[0].text.split('\n').map((line, i) => (
                 <p key={i} className="mb-1 last:mb-0">{line}</p>
               ))}
             </div>
           </div>
        ))}

        {isLoading && (
           <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-xs animate-pulse">
               <Brain size={14} className="text-brand-orange" />
             </div>
             <div className="text-text-secondary text-sm flex items-center gap-1">
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></span>
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
             </div>
           </div>
        )}
      </div>

      {/* 2. Input Area (Floating at bottom) */}
      <div className="p-4 pb-6">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between mb-2 px-1 max-w-3xl mx-auto">
          <button 
            onClick={() => setMode(mode === 'FAST' ? 'THINKING' : 'FAST')}
            className="flex items-center gap-2 text-xs font-medium text-text-secondary bg-surface px-3 py-1.5 rounded-full hover:bg-[#333] transition-colors border border-border"
          >
            {mode === 'FAST' ? '⚡ FAST (Gemini)' : '🧠 THINKING (Claude)'}
          </button>
        </div>

        <div className="bg-surface border border-border rounded-2xl shadow-lg p-2 focus-within:ring-1 focus-within:ring-brand-orange transition-all max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Describe the vehicle issue or ask a question..."
            className="w-full bg-transparent text-white placeholder-text-muted px-3 py-2 outline-none resize-none min-h-[60px] max-h-[200px] text-sm"
            rows={1}
          />
          <div className="flex justify-between items-center px-2 pb-1">
            <div className="flex gap-2">
              <button className="p-2 text-text-muted hover:text-white transition-colors rounded-lg hover:bg-[#333]">
                <Paperclip size={18} />
              </button>
              <button className="p-2 text-text-muted hover:text-white transition-colors rounded-lg hover:bg-[#333]">
                <Mic size={18} />
              </button>
            </div>
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className={`p-2 rounded-lg transition-colors ${
                input.trim() ? 'bg-brand-orange text-white hover:bg-brand-hover' : 'bg-[#333] text-text-muted'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        <div className="text-center mt-2">
           <p className="text-[10px] text-text-muted">EKA-AI can make mistakes. Please verify critical diagnostics.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
