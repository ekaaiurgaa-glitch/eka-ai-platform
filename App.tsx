
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
    fuelType: ''
  });

  const [intelligenceMode, setIntelligenceMode] = useState<IntelligenceMode>('FAST');
  const [operatingMode, setOperatingMode] = useState<OperatingMode>(0);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "EKA-Ai Online. Connected to Go4Garage Ecosystem (GST/URGAA/Ignition). Awaiting Mode Selection.",
      response_content: {
        visual_text: "1. EKA-Ai ONLINE. GOVERNANCE PROTOCOLS ACTIVE.\n   a. Identity: Central Operating System for GST, URGAA, and Ignition.\n   b. Mode 0: Ignition (Consumer) & URGAA Charger Locating.\n   c. Mode 1: Workshop (GST) Job Card & Inventory Gating.\n   d. Mode 2: Fleet (MG) Utilization & SLA Governance.",
        audio_text: "EKA-Ai Online. Connected to Go4Garage Ecosystem (GST, URGAA, and Ignition). Awaiting Mode Selection."
      },
      job_status_update: 'CREATED',
      ui_triggers: { theme_color: "#f18a22", show_orange_border: true },
      visual_assets: { vehicle_display_query: "Enterprise EV Operating System Dashboard", part_display_query: null },
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

  const STANDARD_PROTOCOL = [
    "Verification: Domain Boundary Auth",
    "Locating: URGAA Robin/Albatross Query",
    "Triage: Symptom/Range Anxiety Check",
    "Validation: Emergency RSA Gating",
    "Audit: Governance Finalization"
  ];

  const JOBCARD_PROTOCOL = [
    "Verification: GST Workshop Identity",
    "Normalization: GST Service Coding",
    "Gating: Regional Dead Inventory Check",
    "Compliance: HSN Estimate Validation",
    "Finalization: PDI Checklist Verification"
  ];

  const MG_PROTOCOL = [
    "Verification: Fleet MG Contract Terms",
    "Analysis: Actual vs Assured Tracking",
    "Logic: SLA Breach Verification",
    "Synthesis: Settlement Logic Statement",
    "Audit: Reporting Cycle Closure"
  ];

  const THINKING_PROTOCOL = [
    "Synapse: Deep Logic Node Branching",
    "Analysis: Complex Ecosystem Integration",
    "Synthesis: Pattern Recognition Loop",
    "Validation: Expert-Grade Solution Audit"
  ];

  const [activeProtocol, setActiveProtocol] = useState(STANDARD_PROTOCOL);

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
      }, 700);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading, activeProtocol]);

  const handlePlayAudio = async (text: string) => {
    if (isAudioPlaying) return;

    setIsAudioPlaying(true);
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioData = await geminiService.generateSpeech(text);
    if (audioData && audioContextRef.current) {
      const buffer = await geminiService.decodeAudioData(audioData, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsAudioPlaying(false);
      source.start();
    } else {
      setIsAudioPlaying(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (intelligenceMode === 'THINKING') setActiveProtocol(THINKING_PROTOCOL);
    else if (operatingMode === 1) setActiveProtocol(JOBCARD_PROTOCOL);
    else if (operatingMode === 2) setActiveProtocol(MG_PROTOCOL);
    else setActiveProtocol(STANDARD_PROTOCOL);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      intelligenceMode,
      operatingMode
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let currentHistory = [...messages, userMessage].map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || m.response_content?.visual_text || '' }]
    }));

    const responseData = await geminiService.sendMessage(currentHistory, vehicleContext, status, intelligenceMode, operatingMode);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseData.response_content.visual_text,
      response_content: responseData.response_content,
      job_status_update: responseData.job_status_update as JobStatus,
      ui_triggers: responseData.ui_triggers,
      visual_assets: responseData.visual_assets,
      timestamp: new Date(),
      intelligenceMode,
      operatingMode
    };
    
    if (responseData.job_status_update) {
      setStatus(responseData.job_status_update as JobStatus);
      if (responseData.job_status_update === 'CLOSED' || responseData.job_status_update === 'MG_COMPLETE') {
        setOperatingMode(0);
      }
    }

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleModeChange = (mode: OperatingMode) => {
    setOperatingMode(mode);
    setStatus(mode === 1 ? 'AUTH_INTAKE' : mode === 2 ? 'CONTRACT_VALIDATION' : 'CREATED');
    
    const modeName = mode === 0 ? "Ignition Mode" : mode === 1 ? "Workshop Mode" : "Fleet Mode";
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: `[OS SIGNAL]: Identity switched to ${modeName}. Loading specific governance logic.`,
      timestamp: new Date(),
      operatingMode: mode
    }]);
  };

  const getLoadingColor = () => {
    if (intelligenceMode === 'THINKING') return 'border-l-purple-600';
    if (operatingMode === 1) return 'border-l-blue-600';
    if (operatingMode === 2) return 'border-l-emerald-600';
    return 'border-l-[#f18a22]';
  };

  const getLoadingTextColor = () => {
    if (intelligenceMode === 'THINKING') return 'text-purple-500';
    if (operatingMode === 1) return 'text-blue-500';
    if (operatingMode === 2) return 'text-emerald-500';
    return 'text-[#f18a22]';
  };

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-zinc-100 overflow-hidden">
      <Header status={status} vehicle={vehicleContext} />
      
      {/* OS Mode & Intelligence Engine Toggles */}
      <div className="bg-[#0A0A0A] border-b border-white/5 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex bg-black border border-white/10 rounded-lg p-0.5 shadow-inner">
            <button 
              onClick={() => setIntelligenceMode('FAST')}
              className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${intelligenceMode === 'FAST' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Core AI
            </button>
            <button 
              onClick={() => setIntelligenceMode('THINKING')}
              className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${intelligenceMode === 'THINKING' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Expert
            </button>
          </div>
          <div className="h-4 w-[1px] bg-zinc-800 hidden md:block"></div>
          <div className="flex bg-black border border-white/10 rounded-lg p-0.5 shadow-inner">
            <button 
              onClick={() => handleModeChange(0)}
              className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${operatingMode === 0 ? 'bg-[#f18a22] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Ignition / URGAA Mode"
            >
              Ignition
            </button>
            <button 
              onClick={() => handleModeChange(1)}
              className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${operatingMode === 1 ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="GST Workshop Mode"
            >
              Workshop
            </button>
            <button 
              onClick={() => handleModeChange(2)}
              className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${operatingMode === 2 ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Fleet MG Model Mode"
            >
              Fleet
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-[#f18a22] uppercase tracking-[0.2em]">
           Governor: <span className="text-white">{operatingMode === 0 ? 'IGNITION/URGAA' : operatingMode === 1 ? 'GST WORKSHOP' : 'FLEET MG'}</span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pt-8 pb-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          { (status === 'VEHICLE_CONTEXT_COLLECTED' || isContextComplete(vehicleContext)) && (
            <VehicleContextPanel 
              context={vehicleContext} 
              onUpdate={setVehicleContext} 
            />
          )}
          
          <div className="px-4">
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                onPlayAudio={handlePlayAudio}
                isAudioPlaying={isAudioPlaying}
                vehicleContext={vehicleContext}
                onUpdateContext={setVehicleContext}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-6">
                <div className={`bg-[#0A0A0A] border border-[#262626] p-5 rounded-lg flex flex-col gap-4 shadow-2xl min-w-[320px] border-l-4 transition-all duration-500 ${getLoadingColor()}`}>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-ping ${getLoadingTextColor().replace('text-', 'bg-')}`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${getLoadingTextColor()}`}>
                        EKA Central OS
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {activeProtocol.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${idx < loadingStep ? getLoadingTextColor().replace('text-', 'bg-') : idx === loadingStep ? 'bg-zinc-100 animate-pulse' : 'bg-zinc-800'}`}></div>
                        <span className={`text-[9px] font-bold uppercase tracking-tight ${idx === loadingStep ? 'text-zinc-100' : idx < loadingStep ? 'text-zinc-400' : 'text-zinc-700'}`}>
                          {step}
                          {idx === loadingStep && <span className="ml-2 animate-pulse">...</span>}
                        </span>
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
