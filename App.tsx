
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import VehicleContextPanel from './components/VehicleContextPanel';
import { Message, JobStatus, VehicleContext, isContextComplete, IntelligenceMode, OperatingMode } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [vehicleContext, setVehicleContext] = useState<VehicleContext>({
    vehicleType: '',
    brand: '',
    model: '',
    year: '',
    fuelType: '',
    batteryCapacity: '',
    motorPower: '',
    hvSafetyConfirmed: false
  });

  const [intelligenceMode, setIntelligenceMode] = useState<IntelligenceMode>('FAST');
  const [operatingMode, setOperatingMode] = useState<OperatingMode>(0);

  const STANDARD_PROTOCOL = ["Boundary Auth", "URGAA Query", "Symptom Triage", "RSA Gating", "Audit Finalization"];
  const JOBCARD_PROTOCOL = ["Workshop Auth", "Service Normalization", "Inventory Gating", "Compliance Audit", "PDI Verification"];
  const MG_PROTOCOL = ["Contract Validation", "Utilization Analytics", "SLA Breach Logic", "Settlement Logic", "Cycle Closure"];
  const THINKING_PROTOCOL = ["Logic Node Branching", "Ecosystem Integration", "Pattern Synthesis", "Governance Audit"];

  const [activeProtocol, setActiveProtocol] = useState(STANDARD_PROTOCOL);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "[[STATE:CHAT]] EKA-Ai Online. Awaiting Governance Mode Selection.",
      timestamp: new Date(),
      isValidated: true,
      operatingMode: 0
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [status, setStatus] = useState<JobStatus>('CREATED');
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < activeProtocol.length - 1 ? prev + 1 : prev));
      }, 600);
    }
    return () => clearInterval(interval);
  }, [isLoading, activeProtocol]);

  // Unified Protocol Governor: Syncs visualization based on intelligence and operating modes
  useEffect(() => {
    if (intelligenceMode === 'THINKING') {
      setActiveProtocol(THINKING_PROTOCOL);
    } else {
      switch (operatingMode) {
        case 1: setActiveProtocol(JOBCARD_PROTOCOL); break;
        case 2: setActiveProtocol(MG_PROTOCOL); break;
        default: setActiveProtocol(STANDARD_PROTOCOL); break;
      }
    }
  }, [intelligenceMode, operatingMode]);

  const handlePlayAudio = async (text: string) => {
    if (isAudioPlaying) return;
    setIsAudioPlaying(true);
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioData = await geminiService.generateSpeech(text);
    if (audioData && audioContextRef.current) {
      const buffer = await geminiService.decodeAudioData(audioData, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsAudioPlaying(false);
      source.start();
    } else setIsAudioPlaying(false);
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date(), intelligenceMode, operatingMode };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const history = [...messages, userMessage].map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const responseData = await geminiService.sendMessage(history, vehicleContext, status, intelligenceMode, operatingMode);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseData.response_content.visual_text,
      response_content: responseData.response_content,
      job_status_update: responseData.job_status_update as JobStatus,
      ui_triggers: responseData.ui_triggers,
      visual_assets: responseData.visual_assets,
      grounding_links: responseData.grounding_links,
      timestamp: new Date(),
      intelligenceMode,
      operatingMode
    };
    
    if (responseData.job_status_update) setStatus(responseData.job_status_update as JobStatus);
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleModeChange = (mode: OperatingMode) => {
    // SILENT MODE SWITCHING: Immediate internal state update without meta-commentary filler.
    setOperatingMode(mode);
    
    let initialResponse = "";
    let newStatus: JobStatus = 'CREATED';

    // Adopt target persona and ask for domain-specific input immediately.
    switch (mode) {
      case 0:
        initialResponse = "[[STATE:CHAT]] EKA-Ai Online. How can I assist with your EV or Service today?";
        newStatus = 'CREATED';
        break;
      case 1:
        initialResponse = "[[STATE:DASHBOARD]] Vehicle Registration Number:";
        newStatus = 'AUTH_INTAKE';
        break;
      case 2:
        initialResponse = "[[STATE:DASHBOARD]] Fleet ID:";
        newStatus = 'CONTRACT_VALIDATION';
        break;
    }

    setStatus(newStatus);
    
    // Output ONLY the direct request for input relevant to the new mode.
    setMessages(prev => [...prev, {
      id: `mode-switch-${Date.now()}`,
      role: 'assistant',
      content: initialResponse,
      timestamp: new Date(),
      operatingMode: mode,
      job_status_update: newStatus,
      ui_triggers: {
        theme_color: '#f18a22',
        brand_identity: mode === 0 ? 'G4G_IGNITION' : mode === 1 ? 'G4G_WORKSHOP' : 'G4G_FLEET',
        show_orange_border: true
      }
    }]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-zinc-100 overflow-hidden">
      <Header status={status} vehicle={vehicleContext} />
      
      <div className="bg-[#0A0A0A] border-b border-white/5 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex bg-black border border-white/10 rounded-lg p-0.5 shadow-inner">
            <button onClick={() => setIntelligenceMode('FAST')} className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${intelligenceMode === 'FAST' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Core AI</button>
            <button onClick={() => setIntelligenceMode('THINKING')} className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${intelligenceMode === 'THINKING' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Expert</button>
          </div>
          <div className="h-4 w-[1px] bg-zinc-800 hidden md:block"></div>
          <div className="flex bg-black border border-white/10 rounded-lg p-0.5 shadow-inner">
            <button onClick={() => handleModeChange(0)} className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${operatingMode === 0 ? 'bg-[#f18a22] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Ignition</button>
            <button onClick={() => handleModeChange(1)} className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${operatingMode === 1 ? 'bg-[#f18a22] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Workshop</button>
            <button onClick={() => handleModeChange(2)} className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${operatingMode === 2 ? 'bg-[#f18a22] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Fleet</button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-[#f18a22] uppercase tracking-[0.2em]">
           Governor: <span className="text-white">{operatingMode === 0 ? 'PUBLIC' : operatingMode === 1 ? 'WORKSHOP' : 'FLEET'}</span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pt-8 pb-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          <VehicleContextPanel context={vehicleContext} onUpdate={setVehicleContext} />
          <div className="px-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} onPlayAudio={handlePlayAudio} isAudioPlaying={isAudioPlaying} vehicleContext={vehicleContext} onUpdateContext={setVehicleContext} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-6">
                <div className={`bg-[#0A0A0A] border border-[#262626] p-5 rounded-lg flex flex-col gap-4 shadow-2xl min-w-[300px] border-l-4 transition-all duration-500 border-l-[#f18a22]`}>
                  <div className="flex flex-col gap-2">
                    {activeProtocol.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${idx < loadingStep ? 'bg-[#f18a22]' : idx === loadingStep ? 'bg-zinc-100 animate-pulse' : 'bg-zinc-800'}`}></div>
                        <span className={`text-[9px] font-bold uppercase tracking-tight ${idx === loadingStep ? 'text-zinc-100' : idx < loadingStep ? 'text-zinc-400' : 'text-zinc-700'}`}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;
