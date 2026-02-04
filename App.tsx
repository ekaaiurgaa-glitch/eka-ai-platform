
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
      {/* 1. Sidebar - EKA-AI Dark Theme */}
      <aside className={`sidebar hidden md:flex flex-col`} style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        {/* New Chat Button */}
        <button 
          className="w-full mb-6 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
          style={{ 
            backgroundColor: 'transparent', 
            border: '1px solid var(--accent-primary)',
            color: 'var(--accent-primary)',
            fontFamily: 'var(--font-headers)'
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>

        {/* History Header */}
        <div className="mb-4 px-2">
          <h2 className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-headers)' }}>History</h2>
        </div>

        {/* Placeholder history items */}
        <div className="flex-1 overflow-y-auto space-y-1">
          <div className="p-3 text-sm rounded-lg cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
            Previous Chat Session...
          </div>
          <div className="p-3 text-sm rounded-lg cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
            Fleet Diagnostic Report
          </div>
          <div className="p-3 text-sm rounded-lg cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
            Workshop Job Card #1234
          </div>
        </div>

        {/* User Profile at bottom */}
        <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--text-on-accent)' }}>
              G4G
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Go4Garage User</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Fleet Manager</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Chat Area */}
      <main className="main-chat-area">
        {/* Top Bar / Model Selector - Dark Theme */}
        <header className="sticky top-0 z-10 p-4 flex justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border-color)' }}>
           <div className="p-1 rounded-xl flex text-xs font-medium" style={{ backgroundColor: 'var(--bg-secondary)', fontFamily: 'var(--font-headers)' }}>
              <button 
                onClick={() => setIntelligenceMode('FAST')} 
                className="px-4 py-2 rounded-lg transition-all"
                style={{ 
                  backgroundColor: intelligenceMode === 'FAST' ? 'var(--accent-primary)' : 'transparent',
                  color: intelligenceMode === 'FAST' ? 'var(--text-on-accent)' : 'var(--text-secondary)'
                }}
              >
                Fast 2.0
              </button>
              <button 
                onClick={() => setIntelligenceMode('THINKING')} 
                className="px-4 py-2 rounded-lg transition-all"
                style={{ 
                  backgroundColor: intelligenceMode === 'THINKING' ? 'var(--accent-primary)' : 'transparent',
                  color: intelligenceMode === 'THINKING' ? 'var(--text-on-accent)' : 'var(--text-secondary)'
                }}
              >
                Deep Think
              </button>
           </div>
           <div className="ml-4 p-1 rounded-xl flex text-xs font-medium" style={{ backgroundColor: 'var(--bg-secondary)', fontFamily: 'var(--font-headers)' }}>
              <button 
                onClick={() => handleModeChange(0)} 
                className="px-4 py-2 rounded-lg transition-all"
                style={{ 
                  backgroundColor: operatingMode === 0 ? 'var(--accent-primary)' : 'transparent',
                  color: operatingMode === 0 ? 'var(--text-on-accent)' : 'var(--text-secondary)'
                }}
              >
                Ignition
              </button>
              <button 
                onClick={() => handleModeChange(1)} 
                className="px-4 py-2 rounded-lg transition-all"
                style={{ 
                  backgroundColor: operatingMode === 1 ? 'var(--accent-primary)' : 'transparent',
                  color: operatingMode === 1 ? 'var(--text-on-accent)' : 'var(--text-secondary)'
                }}
              >
                Workshop
              </button>
              <button 
                onClick={() => handleModeChange(2)} 
                className="px-4 py-2 rounded-lg transition-all"
                style={{ 
                  backgroundColor: operatingMode === 2 ? 'var(--accent-primary)' : 'transparent',
                  color: operatingMode === 2 ? 'var(--text-on-accent)' : 'var(--text-secondary)'
                }}
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
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'var(--accent-primary)' }}></div>
                  <div className="h-4 w-24 rounded mt-1" style={{ backgroundColor: 'var(--border-color)' }}></div>
               </div>
            )}
          </div>
        </div>

        {/* Input Area (Floating Pill at Bottom) */}
        <div className="p-4" style={{ backgroundColor: 'transparent' }}>
           <div className="chat-content-width">
              <ChatInput 
                onSend={handleSendMessage} 
                isLoading={isLoading} 
                operatingMode={operatingMode} 
                status={status} 
              />
              <div className="text-center mt-3 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                 EKA-AI can make mistakes. Please verify important information.
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
