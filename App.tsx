import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { Message, JobStatus, VehicleContext, IntelligenceMode, OperatingMode } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  // --- STATE ---
  const [vehicleContext, setVehicleContext] = useState<VehicleContext>({
    vehicleType: '',
    brand: '',
    model: '',
    year: '',
    fuelType: ''
  });
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

  const getOperatingModeLabel = (mode: OperatingMode): string => {
    switch (mode) {
      case 0: return 'IGNITION';
      case 1: return 'WORKSHOP';
      case 2: return 'FLEET';
      default: return 'IGNITION';
    }
  };

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
          <div className="w-8 h-8 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center font-black text-black">G4</div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">EKA-AI</h1>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-3 px-4 bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] transition-all flex items-center gap-2 mb-6"
        >
          <span>+</span> New Diagnostic Session
        </button>

        <div className="flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-widest mb-4">Active Context</h3>
          <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">MODE</span>
              <span className="text-[var(--text-primary)] font-mono">{getOperatingModeLabel(operatingMode)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">STATUS</span>
              <span className="text-[var(--accent-primary)] font-mono">{status}</span>
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
              <ChatMessage key={msg.id} message={msg} vehicleContext={vehicleContext} />
            ))}
            {isLoading && (
              <div className="flex gap-4 animate-pulse ml-2">
                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full"></div>
                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full delay-75"></div>
                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full delay-150"></div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Input Pill */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black to-transparent">
          <div className="content-width">
            <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            <p className="text-center text-[10px] text-[var(--text-secondary)] mt-3 font-mono">
              EKA-AI GOVERNANCE ENGINE • v4.5 • AUDIT GRADE
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
