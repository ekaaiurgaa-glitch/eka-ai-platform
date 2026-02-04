
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import VehicleContextPanel from './components/VehicleContextPanel';
import TelemetryDashboard from './components/TelemetryDashboard';
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
    <div className="flex flex-col h-screen bg-[#000000] text-white overflow-hidden selection:bg-[#f18a22]/30">
      <Header status={status} vehicle={vehicleContext} isLoading={isLoading} operatingMode={operatingMode} />
      
      <div className="bg-zinc-950 border-b border-white/5 px-8 py-3 flex items-center justify-between z-10">
        <div className="flex gap-5">
          <div className="flex bg-black rounded-xl p-1 border border-white/10 shadow-lg">
            <button onClick={() => setIntelligenceMode('FAST')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-widest font-outfit ${intelligenceMode === 'FAST' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>FAST</button>
            <button onClick={() => setIntelligenceMode('THINKING')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-widest font-outfit ${intelligenceMode === 'THINKING' ? 'bg-purple-600/50 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>EXPERT</button>
          </div>
          <div className="flex bg-black rounded-xl p-1 border border-white/10 shadow-lg">
            <button onClick={() => handleModeChange(0)} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-widest font-outfit ${operatingMode === 0 ? 'bg-[#f18a22] text-black' : 'text-zinc-600 hover:text-zinc-400'}`}>IGNITION</button>
            <button onClick={() => handleModeChange(1)} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-widest font-outfit ${operatingMode === 1 ? 'bg-[#f18a22] text-black' : 'text-zinc-600 hover:text-zinc-400'}`}>WORKSHOP</button>
            <button onClick={() => handleModeChange(2)} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-widest font-outfit ${operatingMode === 2 ? 'bg-[#f18a22] text-black' : 'text-zinc-600 hover:text-zinc-400'}`}>FLEET</button>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
           <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest font-mono">Dossier ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-8 py-10" ref={scrollRef}>
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
          <TelemetryDashboard status={status} complianceScore={94} systemHealth={99} />
          
          {(operatingMode === 1 || !isContextComplete(vehicleContext)) && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
              <VehicleContextPanel 
                context={vehicleContext} 
                onUpdate={setVehicleContext} 
                operatingMode={operatingMode}
              />
            </div>
          )}

          <div className="flex flex-col">
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                vehicleContext={vehicleContext} 
                onEstimateAuthorize={(data) => console.log('Audit Auth Logged:', data)}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-12 animate-in fade-in duration-300">
                <div className="px-8 py-4 bg-[#0b0b0b] border-2 border-[#f18a22]/40 rounded-full animate-pulse text-[11px] font-black uppercase tracking-[0.3em] text-[#f18a22] font-mono shadow-[0_0_20px_rgba(241,138,34,0.1)]">
                  Architectural Sync In Progress...
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <ChatInput onSend={handleSendMessage} isLoading={isLoading} operatingMode={operatingMode} status={status} />
    </div>
  );
};

export default App;
