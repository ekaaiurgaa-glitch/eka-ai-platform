
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
  const THINKING_PROTOCOL = ["Logic Node Branching", "Ecosystem Integration", "Pattern Synthesis", "EKA Governance Audit"];

  const [activeProtocol, setActiveProtocol] = useState(STANDARD_PROTOCOL);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "EKA-Ai Online. Connected to Go4Garage Ecosystem. Awaiting Mode Selection.",
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
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isLoading, activeProtocol]);

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
    const trimmedText = text.trim();
    
    // Command Interceptor: Start/Status
    if (trimmedText.toLowerCase() === 'start' || trimmedText.toLowerCase() === 'status') {
      const initResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "EKA-Ai Online. Architecture Loaded. Awaiting Directive.",
        timestamp: new Date(),
        intelligenceMode,
        operatingMode
      };
      setMessages(prev => [...prev, { id: (Date.now() - 1).toString(), role: 'user', content: trimmedText, timestamp: new Date() }, initResponse]);
      return;
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: trimmedText, timestamp: new Date(), intelligenceMode, operatingMode };
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
    setOperatingMode(mode);
    
    let intakePrompt = "";
    let entryStatus: JobStatus = 'CREATED';
    let brandId = 'G4G_IGNITION';

    switch (mode) {
      case 0:
        intakePrompt = "EKA-Ai Online. How can I assist with your EV or Service today?";
        entryStatus = 'IGNITION_TRIAGE';
        brandId = 'G4G_IGNITION';
        break;
      case 1:
        intakePrompt = "Workshop Mode Active. Please enter the Vehicle Registration Number.";
        entryStatus = 'AUTH_INTAKE';
        brandId = 'G4G_WORKSHOP';
        break;
      case 2:
        intakePrompt = "Fleet Mode Active. Please provide the Fleet ID and Billing Month.";
        entryStatus = 'CONTRACT_VALIDATION';
        brandId = 'G4G_FLEET';
        break;
    }

    setStatus(entryStatus);
    
    setMessages(prev => [...prev, {
      id: `mode-pivot-${Date.now()}`,
      role: 'assistant',
      content: intakePrompt,
      timestamp: new Date(),
      operatingMode: mode,
      job_status_update: entryStatus,
      ui_triggers: {
        theme_color: '#f18a22',
        brand_identity: brandId,
        show_orange_border: true
      }
    }]);

    scrollToBottom();
  };

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-zinc-100 overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#f18a22]/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-green-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <Header status={status} vehicle={vehicleContext} />
      
      <div className="backdrop-blur-xl bg-black/40 border-b border-white/5 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-4">
          <div className="flex bg-black/60 border border-white/10 rounded-xl p-1 shadow-2xl">
            <button onClick={() => setIntelligenceMode('FAST')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${intelligenceMode === 'FAST' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Core AI</button>
            <button onClick={() => setIntelligenceMode('THINKING')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${intelligenceMode === 'THINKING' ? 'bg-purple-600/80 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Expert</button>
          </div>
          <div className="h-4 w-[1px] bg-zinc-800 hidden md:block"></div>
          <div className="flex bg-black/60 border border-white/10 rounded-xl p-1 shadow-2xl">
            <button onClick={() => handleModeChange(0)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${operatingMode === 0 ? 'bg-[#f18a22] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Ignition</button>
            <button onClick={() => handleModeChange(1)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${operatingMode === 1 ? 'bg-[#f18a22] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Workshop</button>
            <button onClick={() => handleModeChange(2)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${operatingMode === 2 ? 'bg-[#f18a22] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Fleet</button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-[#f18a22] uppercase tracking-[0.25em]">
           Governor: <span className="text-white bg-zinc-900 px-2 py-1 rounded border border-white/5">{operatingMode === 0 ? 'PUBLIC' : operatingMode === 1 ? 'WORKSHOP' : 'FLEET'}</span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pt-8 pb-4 z-0" ref={scrollRef}>
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          <VehicleContextPanel context={vehicleContext} onUpdate={setVehicleContext} />
          <div className="px-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} onPlayAudio={handlePlayAudio} isAudioPlaying={isAudioPlaying} vehicleContext={vehicleContext} onUpdateContext={setVehicleContext} />
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-12 animate-in slide-in-from-left duration-300">
                <div className={`backdrop-blur-2xl bg-black/40 border border-[#262626] p-6 rounded-3xl flex flex-col gap-6 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] min-w-[340px] border-l-4 transition-all duration-500 border-l-[#f18a22] relative overflow-hidden group`}>
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-12 h-12 text-[#f18a22]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                    </svg>
                  </div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-[#f18a22] uppercase tracking-[0.2em]">
                        {intelligenceMode === 'THINKING' ? 'Deep Reasoning Protocol' : 'Operational Triage'}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">
                        {operatingMode === 1 ? 'Workshop Governance' : operatingMode === 2 ? 'Fleet Settlement' : 'Public Ignition'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[14px] font-mono font-black text-white">
                        {Math.round(((loadingStep + 1) / activeProtocol.length) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 relative z-10">
                    {activeProtocol.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          idx < loadingStep 
                            ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                            : idx === loadingStep 
                              ? 'bg-[#f18a22] animate-pulse shadow-[0_0_10px_rgba(241,138,34,0.8)]' 
                              : 'bg-zinc-800'
                        }`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-tight transition-colors duration-300 ${
                          idx === loadingStep ? 'text-zinc-100' : idx < loadingStep ? 'text-zinc-500' : 'text-zinc-800'
                        }`}>
                          {step}
                        </span>
                        {idx === loadingStep && (
                           <div className="ml-auto w-4 h-1 bg-[#f18a22]/20 rounded-full overflow-hidden">
                              <div className="h-full bg-[#f18a22] animate-shimmer"></div>
                           </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden mt-2 border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-[#f18a22] to-orange-400 transition-all duration-700 ease-out shadow-[0_0_10px_#f18a22]" 
                      style={{ width: `${((loadingStep + 1) / activeProtocol.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} operatingMode={operatingMode} />
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1s infinite linear;
          width: 50%;
        }
      `}</style>
    </div>
  );
};

export default App;
