import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { Message, JobStatus, VehicleContext, IntelligenceMode, OperatingMode } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [vehicleContext, setVehicleContext] = useState<VehicleContext>({
    vehicleType: '',
    brand: '',
    model: '',
    year: '',
    fuelType: '',
    registrationNumber: '',
    pdiVerified: false
  });

  const [intelligenceMode, setIntelligenceMode] = useState<IntelligenceMode>('FAST');
  const [operatingMode, setOperatingMode] = useState<OperatingMode>(0);
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome', 
    role: 'assistant', 
    content: "EKA-AI online. Governed automobile intelligence active.", 
    timestamp: new Date(), 
    operatingMode: 0
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<JobStatus>('CREATED');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); 
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text, 
      timestamp: new Date(),
      intelligenceMode,
      operatingMode
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const history = [...messages, userMsg].map(m => ({ 
      role: m.role === 'user' ? 'user' : 'model', 
      parts: [{ text: m.content }] 
    }));
    const response = await geminiService.sendMessage(history, vehicleContext, status, intelligenceMode, operatingMode);
    
    if (response.job_status_update) setStatus(response.job_status_update as JobStatus);
    
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(), 
      role: 'assistant', 
      content: response.response_content.visual_text,
      visual_metrics: response.visual_metrics, 
      diagnostic_data: response.diagnostic_data, 
      mg_analysis: response.mg_analysis,
      service_history: response.service_history,
      estimate_data: response.estimate_data,
      pdi_checklist: response.pdi_checklist,
      recall_data: response.recall_data,
      timestamp: new Date(),
      intelligenceMode,
      operatingMode
    };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleModeChange = (mode: OperatingMode) => {
    setOperatingMode(mode);
    const entryStatus: JobStatus = mode === 1 ? 'AUTH_INTAKE' : mode === 2 ? 'MG_ACTIVE' : 'IGNITION_TRIAGE';
    setStatus(entryStatus);
    
    setMessages(prev => [...prev, {
      id: `mode-pivot-${Date.now()}`,
      role: 'assistant',
      content: mode === 1 ? "Workshop Protocol Active. Provide Registration Number." : mode === 2 ? "Fleet Governance Engine Active." : "Ignition Mode Active.",
      timestamp: new Date(),
      operatingMode: mode,
      job_status_update: entryStatus
    }]);
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar hidden md:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#f18a22] rounded-lg flex items-center justify-center font-black text-black text-xs">G4</div>
          <h1 className="text-xl font-bold tracking-tight text-white">EKA-AI</h1>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="w-full py-3 px-4 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] rounded-xl text-sm font-medium text-white flex items-center gap-2 mb-6"
        >
          <span className="text-[#f18a22] text-lg font-bold">+</span> New Session
        </button>
        
        {/* Mode Switcher */}
        <div className="mb-4">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-2 block">Mode</span>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => handleModeChange(0)} 
              className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all tracking-wide text-left ${operatingMode === 0 ? 'bg-[#f18a22] text-black' : 'text-zinc-500 hover:text-white hover:bg-[#1a1a1a]'}`}
            >
              IGNITION
            </button>
            <button 
              onClick={() => handleModeChange(1)} 
              className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all tracking-wide text-left ${operatingMode === 1 ? 'bg-[#f18a22] text-black' : 'text-zinc-500 hover:text-white hover:bg-[#1a1a1a]'}`}
            >
              WORKSHOP
            </button>
            <button 
              onClick={() => handleModeChange(2)} 
              className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all tracking-wide text-left ${operatingMode === 2 ? 'bg-[#f18a22] text-black' : 'text-zinc-500 hover:text-white hover:bg-[#1a1a1a]'}`}
            >
              FLEET
            </button>
          </div>
        </div>

        {/* Intelligence Mode */}
        <div className="mb-4">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-2 block">Intelligence</span>
          <div className="flex gap-1">
            <button 
              onClick={() => setIntelligenceMode('FAST')} 
              className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wide ${intelligenceMode === 'FAST' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              FAST
            </button>
            <button 
              onClick={() => setIntelligenceMode('THINKING')} 
              className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wide ${intelligenceMode === 'THINKING' ? 'bg-purple-600/50 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              EXPERT
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 bg-[#111] rounded-lg border border-[#222] text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-500">STATUS</span>
              <span className="text-[#f18a22] font-mono">{status}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="main-chat-area">
        <div className="chat-scroll-container" ref={scrollRef}>
          <div className="content-width flex flex-col gap-6 pb-32">
            {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
            {isLoading && (
              <div className="flex gap-4 animate-pulse ml-2">
                <div className="w-2 h-2 bg-[#f18a22] rounded-full"></div>
                <div className="w-2 h-2 bg-[#f18a22] rounded-full animation-delay-200"></div>
                <div className="w-2 h-2 bg-[#f18a22] rounded-full animation-delay-400"></div>
              </div>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black to-transparent">
          <div className="content-width">
            <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
};
export default App;
