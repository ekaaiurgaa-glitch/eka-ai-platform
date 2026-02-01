
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import VehicleContextPanel from './components/VehicleContextPanel';
import { Message, JobStatus, VehicleContext, isContextComplete } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [vehicleContext, setVehicleContext] = useState<VehicleContext>({
    vehicleType: '',
    brand: '',
    model: '',
    year: '',
    fuelType: ''
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "EKA-Ai SYSTEM INITIALIZED. G4G SERVICE GOVERNOR ACTIVE.",
      response_content: {
        visual_text: "1. EKA-Ai SYSTEM INITIALIZED. G4G SERVICE GOVERNOR ACTIVE.\n   a. I enforce deterministic automobile diagnostics and fleet intelligence.\n   b. Please describe the vehicle symptom, input a DTC, or provide MG Contract parameters.\n   c. Note: I require a 5-Point Contextual Lock before proceeding to diagnosis.\n   d. Pricing output is restricted to market ranges only.",
        audio_text: "EKA-Ai system initialized. G-4-G Service Governor active. Please describe your vehicle's symptoms, provide a diagnostic trouble code, or input fleet contract parameters to begin."
      },
      job_status_update: 'CREATED',
      ui_triggers: { theme_color: "#f18a22", brand_identity: "G4G_EKA", show_orange_border: true },
      visual_assets: { vehicle_display_query: "Modern Automotive Service Center", part_display_query: null },
      timestamp: new Date(),
      isValidated: true
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [status, setStatus] = useState<JobStatus>('CREATED');
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const STANDARD_PROTOCOL = [
    "Verification: Domain Boundary Check",
    "Acquisition: Confidence Gating (>90%)",
    "Lock: 5-Point Vehicle Identity Sync",
    "Analysis: Deterministic Symptom Mapping",
    "Finalization: Governance & Safety Audit"
  ];

  const MG_PROTOCOL = [
    "Verification: Fleet ID & Contract Sync",
    "Acquisition: Assured KM & Rate Lock",
    "Analysis: Cycle Performance Calculation",
    "Governance: Penalty & Bonus Audit",
    "Finalization: Deterministic Report Generation"
  ];

  const RECALL_PROTOCOL = [
    "Verification: Safety Audit Initiation",
    "Connection: Grounding Data Engine",
    "Scan: NHTSA & Manufacturer Database",
    "Analysis: Common Issue Pattern Logic",
    "Verification: Audit-Grade Finalization"
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
    const lowerText = text.toLowerCase();
    const isRecallScan = lowerText.includes('recall') || lowerText.includes('safety scan');
    const isMgRequest = lowerText.includes('mg ') || lowerText.includes('fleet') || lowerText.includes('minimum guarantee');

    if (isRecallScan) setActiveProtocol(RECALL_PROTOCOL);
    else if (isMgRequest) setActiveProtocol(MG_PROTOCOL);
    else setActiveProtocol(STANDARD_PROTOCOL);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let currentHistory = [...messages, userMessage].map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || m.response_content?.visual_text || '' }]
    }));

    const responseData = await geminiService.sendMessage(currentHistory, vehicleContext, status);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseData.response_content.visual_text,
      response_content: responseData.response_content,
      job_status_update: responseData.job_status_update as JobStatus,
      ui_triggers: responseData.ui_triggers,
      visual_assets: responseData.visual_assets,
      grounding_urls: responseData.grounding_urls,
      timestamp: new Date(),
      isValidated: true,
      validationError: false
    };
    
    if (responseData.job_status_update) setStatus(responseData.job_status_update as JobStatus);

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleScanRecalls = () => {
    handleSendMessage("Initiate audit-grade safety scan for official recalls and common patterns for this vehicle identity.");
  };

  const getLoadingColor = () => {
    if (activeProtocol === RECALL_PROTOCOL) return 'border-l-red-600';
    if (activeProtocol === MG_PROTOCOL) return 'border-l-blue-400';
    return 'border-l-[#f18a22]';
  };

  const getLoadingLabel = () => {
    if (activeProtocol === RECALL_PROTOCOL) return 'G4G Safety Audit Engine';
    if (activeProtocol === MG_PROTOCOL) return 'G4G Fleet Performance Engine';
    return 'G4G Service Governor';
  };

  const getLoadingTextColor = () => {
    if (activeProtocol === RECALL_PROTOCOL) return 'text-red-500';
    if (activeProtocol === MG_PROTOCOL) return 'text-blue-400';
    return 'text-[#f18a22]';
  };

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-zinc-100 overflow-hidden">
      <Header status={status} vehicle={vehicleContext} />
      
      <main className="flex-1 overflow-y-auto pt-8 pb-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          { (status === 'VEHICLE_CONTEXT_COLLECTED' || isContextComplete(vehicleContext)) && (
            <VehicleContextPanel 
              context={vehicleContext} 
              onUpdate={setVehicleContext} 
              onScanRecalls={handleScanRecalls}
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
                        {getLoadingLabel()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {activeProtocol.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${idx < loadingStep ? getLoadingTextColor().replace('text-', 'bg-') : idx === loadingStep ? 'bg-zinc-100 animate-pulse' : 'bg-zinc-800'}`}></div>
                        <span className={`text-[9px] font-bold uppercase tracking-tight ${idx === loadingStep ? 'text-zinc-100' : idx < loadingStep ? 'text-zinc-400' : 'text-zinc-700'}`}>
                          {step}
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
