import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { Message, JobStatus, VehicleContext, IntelligenceMode, OperatingMode } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  // --- STATE ---
  const [vehicleContext, setVehicleContext] = useState<VehicleContext>({});
  const [intelligenceMode, setIntelligenceMode] = useState<IntelligenceMode>('FAST');
  const [operatingMode, setOperatingMode] = useState<OperatingMode>(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "EKA-AI online. Governed automobile intelligence active.",
      timestamp: new Date(),
      operatingMode: 0
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<JobStatus>('CREATED');
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- HANDLERS ---
  const scrollToBottom = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Call Backend Proxy
    const response = await geminiService.sendMessage(
      [...messages, userMsg].map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
      vehicleContext, status, intelligenceMode, operatingMode
    );

    if (response.job_status_update) setStatus(response.job_status_update);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.response_content.visual_text,
      // Pass through all data blocks
      visual_metrics: response.visual_metrics,
      diagnostic_data: response.diagnostic_data,
      mg_analysis: response.mg_analysis,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  // --- RENDER ---
  return (
    <div className="app-layout">
      {/* SIDEBAR (Navigation & History) */}
      <aside className="sidebar hidden md:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#f18a22] rounded-lg flex items-center justify-center font-black text-black">G4</div>
          <h1 className="text-xl font-bold tracking-tight text-white">EKA-AI</h1>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-3 px-4 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] rounded-xl text-sm font-medium text-white transition-all flex items-center gap-2 mb-6"
        >
          <span>+</span> New Diagnostic Session
        </button>

        <div className="flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold text-[#f18a22] uppercase tracking-widest mb-4">Active Context</h3>
          <div className="p-3 bg-[#111] rounded-lg border border-[#222] text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-500">MODE</span>
              <span className="text-white font-mono">{operatingMode === 0 ? 'IGNITION' : 'WORKSHOP'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">STATUS</span>
              <span className="text-[#f18a22] font-mono">{status}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="main-chat-area">
        {/* Chat Stream */}
        <div className="chat-scroll-container" ref={scrollRef}>
          <div className="content-width flex flex-col gap-6 pb-32">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex gap-4 animate-pulse ml-2">
                <div className="w-2 h-2 bg-[#f18a22] rounded-full"></div>
                <div className="w-2 h-2 bg-[#f18a22] rounded-full delay-75"></div>
                <div className="w-2 h-2 bg-[#f18a22] rounded-full delay-150"></div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Input Pill */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black to-transparent">
          <div className="content-width">
            <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            <p className="text-center text-[10px] text-zinc-600 mt-3 font-mono">
              EKA-AI GOVERNANCE ENGINE • v4.5 • AUDIT GRADE
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
