
import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import VehicleContextPanel from './components/VehicleContextPanel';
import { Message, JobStatus, VehicleContext, isContextComplete, IntelligenceMode, OperatingMode, EstimateData } from './types';
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "EKA-AI online. Governed automobile intelligence active. Awaiting vehicle context or fleet ID.",
      timestamp: new Date(),
      operatingMode: 0
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<JobStatus>('CREATED');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date(), intelligenceMode, operatingMode };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const history = [...messages, userMessage].map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const responseData = await geminiService.sendMessage(history, vehicleContext, status, intelligenceMode, operatingMode);
    
    if (responseData.job_status_update) {
      setStatus(responseData.job_status_update as JobStatus);
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseData.response_content.visual_text,
      job_status_update: responseData.job_status_update as JobStatus,
      visual_metrics: responseData.visual_metrics,
      diagnostic_data: responseData.diagnostic_data,
      service_history: responseData.service_history,
      estimate_data: responseData.estimate_data,
      mg_analysis: responseData.mg_analysis,
      pdi_checklist: responseData.pdi_checklist,
      recall_data: responseData.recall_data,
      timestamp: new Date(),
      intelligenceMode,
      operatingMode
    };
    
    setMessages(prev => [...prev, assistantMessage]);
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
      {/* 1. Sidebar (New Component for Navigation) */}
      <aside className="sidebar hidden md:flex flex-col">
        <div className="mb-6 px-2">
           <div className="w-8 h-8 bg-[#D97757] rounded-lg mb-2"></div>
           <h2 className="font-semibold text-sm text-[var(--text-secondary)]">EKA-AI History</h2>
        </div>
        {/* Placeholder for history items */}
        <div className="flex-1 overflow-y-auto space-y-2">
           <div className="p-2 text-sm bg-white/50 rounded cursor-pointer">Previous Chat...</div>
        </div>
        {/* User Profile / Settings at bottom */}
        <div className="mt-auto border-t border-black/5 pt-4">
           <div className="text-xs font-medium">Go4Garage User</div>
        </div>
      </aside>

      {/* 2. Main Chat Area */}
      <main className="main-chat-area">
        {/* Top Bar / Model Selector */}
        <header className="sticky top-0 z-10 bg-[var(--bg-primary)]/80 backdrop-blur p-4 flex justify-center border-b border-black/5">
           <div className="bg-[var(--bg-secondary)] p-1 rounded-lg flex text-xs font-medium">
              <button 
                onClick={() => setIntelligenceMode('FAST')} 
                className={`px-3 py-1 rounded-md transition-all ${intelligenceMode === 'FAST' ? 'bg-white shadow-sm' : 'text-[var(--text-secondary)]'}`}
              >
                Fast 2.0
              </button>
              <button 
                onClick={() => setIntelligenceMode('THINKING')} 
                className={`px-3 py-1 rounded-md transition-all ${intelligenceMode === 'THINKING' ? 'bg-white shadow-sm' : 'text-[var(--text-secondary)]'}`}
              >
                Claude 3.5
              </button>
           </div>
           <div className="ml-4 bg-[var(--bg-secondary)] p-1 rounded-lg flex text-xs font-medium">
              <button 
                onClick={() => handleModeChange(0)} 
                className={`px-3 py-1 rounded-md transition-all ${operatingMode === 0 ? 'bg-[#D97757] text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}
              >
                Ignition
              </button>
              <button 
                onClick={() => handleModeChange(1)} 
                className={`px-3 py-1 rounded-md transition-all ${operatingMode === 1 ? 'bg-[#D97757] text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}
              >
                Workshop
              </button>
              <button 
                onClick={() => handleModeChange(2)} 
                className={`px-3 py-1 rounded-md transition-all ${operatingMode === 2 ? 'bg-[#D97757] text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}
              >
                Fleet
              </button>
           </div>
        </header>

        {/* Chat Stream */}
        <div className="chat-scroll-container" ref={scrollRef}>
          <div className="chat-content-width flex flex-col gap-6">
            {(operatingMode === 1 || !isContextComplete(vehicleContext)) && (
              <VehicleContextPanel 
                context={vehicleContext} 
                onUpdate={setVehicleContext} 
                operatingMode={operatingMode}
              />
            )}
            
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                vehicleContext={vehicleContext}
                onEstimateAuthorize={(data) => console.log('Audit Auth Logged:', data)}
              />
            ))}
            {isLoading && (
               <div className="flex gap-4 items-start animate-pulse">
                  <div className="w-8 h-8 rounded bg-[#D97757] opacity-20"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded mt-2"></div>
               </div>
            )}
          </div>
        </div>

        {/* Input Area (Fixed Bottom) */}
        <div className="p-4 bg-[var(--bg-primary)]">
           <div className="chat-content-width">
              <ChatInput 
                onSend={handleSendMessage} 
                isLoading={isLoading} 
                operatingMode={operatingMode} 
                status={status} 
              />
              <div className="text-center mt-2 text-[10px] text-[var(--text-secondary)]">
                 AI can make mistakes. Please verify important information.
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
