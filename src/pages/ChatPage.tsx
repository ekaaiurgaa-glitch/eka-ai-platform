import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Bolt, Brain, Plus, Camera, Globe, PenTool, ChevronDown } from 'lucide-react';
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
      // Call the AI Service
      const response = await geminiService.sendMessage([...history, userMsg], {}, status, mode, operatingMode);
      
      const aiText = response.response_content?.visual_text || "System processing...";
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: aiText }] }]);
      
      if (response.job_status_update) setStatus(response.job_status_update);
    } catch (error) {
      console.error(error);
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: "Governance system offline. Please try again." }] }]);
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
              <div className="relative">
                <select 
                  value={operatingMode}
                  onChange={(e) => setOperatingMode(parseInt(e.target.value) as OperatingMode)}
                  className="appearance-none text-xs font-medium bg-transparent border-none outline-none cursor-pointer pr-4"
                >
                  <option value={0}>🔥 Ignition</option>
                  <option value={1}>🔧 Workshop</option>
                  <option value={2}>🚛 Fleet</option>
                </select>
                <ChevronDown size={12} className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"/>
              </div>
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
               <p className="text-gray-500 text-lg">How can I assist with your workshop today?</p>
             </div>

             {/* Welcome Grid Suggestions */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <SuggestionCard 
                  icon={<Bolt className="text-orange-500" size={20}/>} 
                  title="Diagnose Symptoms" 
                  desc="Brake vibration at 60km/h" 
                  onClick={() => handleSend("Diagnose brake vibration at 60km/h")}
                />
                <SuggestionCard 
                  icon={<PenTool className="text-blue-500" size={20}/>} 
                  title="Create Job Card" 
                  desc="Service estimate for Fortuner" 
                  onClick={() => handleSend("Create job card for Toyota Fortuner service")}
                />
                <SuggestionCard 
                  icon={<Camera className="text-purple-500" size={20}/>} 
                  title="PDI Checklist" 
                  desc="New vehicle delivery inspection" 
                  onClick={() => handleSend("Generate PDI checklist for new delivery")}
                />
                <SuggestionCard 
                  icon={<Brain className="text-brand-green" size={20}/>} 
                  title="Fleet Analysis" 
                  desc="Calculate MG Contract utilization" 
                  onClick={() => handleSend("Analyze fleet MG contract utilization for this month")}
                />
             </div>
          </div>
        )}
        
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-green flex items-center justify-center flex-shrink-0 mr-3 mt-1 shadow-sm">
                <Brain className="text-white" size={14} />
              </div>
            )}
            <div className={`max-w-[85%] px-5 py-3 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#f3f4f6] text-gray-900 rounded-[18px_18px_4px_18px]' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-[18px_18px_18px_4px]'
            }`}>
              {msg.parts[0].text.split('\n').map((line, i) => (
                <p key={i} className="mb-1 last:mb-0">{line}</p>
              ))}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-green flex items-center justify-center flex-shrink-0 animate-pulse">
                <Brain className="text-white" size={14} />
             </div>
             <div className="bg-white border border-gray-200 px-5 py-4 rounded-[18px_18px_18px_4px] shadow-sm flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-md p-4 pb-6">
        <div className="max-w-3xl mx-auto relative">
           
           {/* Controls Row */}
           <div className="flex items-center justify-between mb-2 px-1">
             <button 
               onClick={() => setMode(mode === 'FAST' ? 'THINKING' : 'FAST')}
               className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
             >
               {mode === 'FAST' ? <Bolt size={12} className="text-orange-500"/> : <Brain size={12} className="text-brand-purple"/>}
               {mode === 'FAST' ? 'FAST (Gemini)' : 'EXPERT (Claude)'}
             </button>
           </div>

           {/* Input Box */}
           <div className="relative bg-white border border-gray-200 rounded-2xl flex items-end gap-2 p-2 shadow-sm focus-within:shadow-md transition-shadow">
             
             {/* Attachment Menu */}
             {showAttachMenu && (
               <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20 overflow-hidden">
                 <MenuItem icon={<Paperclip size={16}/>} label="Upload Files" onClick={() => setShowAttachMenu(false)} />
                 <MenuItem icon={<Camera size={16}/>} label="Take Photo" onClick={() => setShowAttachMenu(false)} />
                 <MenuItem icon={<Globe size={16}/>} label="Web Search" onClick={() => setShowAttachMenu(false)} />
               </div>
             )}

             <button 
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors mb-1"
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
               className="p-2 bg-brand-purple text-white rounded-xl hover:bg-[#4a2360] disabled:opacity-40 disabled:cursor-not-allowed transition-all mb-1 shadow-sm"
             >
               <Send size={16} />
             </button>
           </div>
           
           <div className="text-center mt-2">
             <p className="text-[10px] text-gray-400">EKA-AI can make mistakes. Verify critical repairs with certified mechanics.</p>
           </div>
        </div>
      </div>
    </main>
  );
};

// Helper Components
const SuggestionCard = ({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) => (
  <button onClick={onClick} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-brand-purple hover:shadow-md transition-all text-left flex items-start gap-3 group">
    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white transition-colors">{icon}</div>
    <div>
      <div className="font-medium text-sm text-gray-900 mb-0.5">{title}</div>
      <div className="text-xs text-gray-500 group-hover:text-gray-700">{desc}</div>
    </div>
  </button>
);

const MenuItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button onClick={onClick} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
    {icon} {label}
  </button>
);

export default ChatPage;
