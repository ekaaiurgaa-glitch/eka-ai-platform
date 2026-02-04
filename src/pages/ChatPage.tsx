import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Bolt, Brain, Plus, Camera, Globe, PenTool } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { JobStatus, IntelligenceMode, OperatingMode } from '../types';

const getGreeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};

const ChatPage = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{role: string, parts: {text: string}[]}[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<IntelligenceMode>('FAST');
  const [operatingMode, setOperatingMode] = useState<OperatingMode>(0);
  const [status, setStatus] = useState<JobStatus>('CREATED');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user', parts: [{ text: textToSend }] };
    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setShowAttachMenu(false);

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
               onChange={(e) => setOperatingMode(parseInt(e.target.value) as OperatingMode)}
               className="text-xs font-medium bg-transparent border-none outline-none cursor-pointer"
             >
               <option value={0}>🔥 Ignition</option>
               <option value={1}>🔧 Workshop</option>
               <option value={2}>🚛 Fleet</option>
             </select>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {history.length === 0 && (
          <div className="max-w-3xl mx-auto pt-12 pb-8 animate-fade-in">
             <div className="text-center mb-12">
               <h1 className="font-serif text-4xl md:text-5xl text-gray-900 mb-4">
                 <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-green italic">{getGreeting()}, Go4Garage</span>
               </h1>
               <p className="text-gray-500">How can I assist with your workshop today?</p>
             </div>

             {/* Welcome Grid Suggestions */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <SuggestionCard 
                  icon={<Bolt className="text-orange-500"/>} 
                  title="Diagnose Symptoms" 
                  desc="Brake vibration at 60km/h" 
                  onClick={() => handleSend("Diagnose brake vibration at 60km/h")}
                />
                <SuggestionCard 
                  icon={<PenTool className="text-blue-500"/>} 
                  title="Create Job Card" 
                  desc="Service estimate for Fortuner" 
                  onClick={() => handleSend("Create job card for Toyota Fortuner service")}
                />
                <SuggestionCard 
                  icon={<Camera className="text-purple-500"/>} 
                  title="PDI Checklist" 
                  desc="New vehicle delivery inspection" 
                  onClick={() => handleSend("Generate PDI checklist for new delivery")}
                />
             </div>
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

           {/* Input Box Container */}
           <div className="relative bg-white border border-gray-200 rounded-2xl flex items-end gap-2 p-2 shadow-sm focus-within:shadow-md transition-shadow">
             
             {/* Attachment Menu Popup */}
             {showAttachMenu && (
               <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20">
                 <MenuItem icon={<Paperclip size={16}/>} label="Upload Files" onClick={() => setShowAttachMenu(false)} />
                 <MenuItem icon={<Camera size={16}/>} label="Take Photo" onClick={() => setShowAttachMenu(false)} />
                 <MenuItem icon={<Globe size={16}/>} label="Web Search" onClick={() => setShowAttachMenu(false)} />
               </div>
             )}

             <button 
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                aria-label="Attach files"
                aria-expanded={showAttachMenu}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
             >
               <Plus size={20}/>
             </button>

             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSend();
                 }
               }}
               placeholder="Message EKA-AI..."
               className="flex-1 resize-none border-0 focus:ring-0 text-gray-900 placeholder-gray-400 py-3 px-2 max-h-32 bg-transparent text-sm outline-none"
               rows={1}
             />
             
             <button 
               onClick={() => handleSend()}
               disabled={!input.trim()}
               className="p-2 bg-brand-purple text-white rounded-xl hover:bg-[#4a2360] disabled:opacity-40 transition-all mb-1"
             >
               <Send size={16} />
             </button>
           </div>
           
           <div className="text-center mt-2">
             <p className="text-[11px] text-gray-400">EKA-AI can make mistakes. Verify critical repairs.</p>
           </div>
        </div>
      </div>
    </main>
  );
};

const SuggestionCard = ({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) => (
  <button onClick={onClick} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-brand-purple hover:shadow-sm transition-all text-left flex items-start gap-3 group">
    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white transition-colors">{icon}</div>
    <div>
      <div className="font-medium text-sm text-gray-900 mb-0.5">{title}</div>
      <div className="text-xs text-gray-500">{desc}</div>
    </div>
  </button>
);

const MenuItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button onClick={onClick} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
    {icon} {label}
  </button>
);

export default ChatPage;
