
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import VehicleContextPanel from './components/VehicleContextPanel';
import { Message, JobStatus, VehicleContext, isContextComplete } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [vehicleContext, setVehicleContext] = useState<VehicleContext>({
    brand: '',
    model: '',
    year: '',
    fuelType: ''
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "EKA-Ai SYSTEM INITIALIZED. SERVICE ADVISOR ACTIVE.",
      response_content: {
        visual_text: "1. EKA-Ai SYSTEM INITIALIZED. SERVICE ADVISOR ACTIVE.\n   a. I provide professional automotive diagnostics and service guidance.\n   b. To proceed, please describe your vehicle's current symptoms or input a Diagnostic Trouble Code (DTC).\n   c. I am programmed to scan for official safety recalls and common manufacturer issues.",
        audio_text: "EKA-Ai system initialized. Service advisor active. Please describe your vehicle's symptoms or input a Diagnostic Trouble Code to begin diagnostic guidance."
      },
      job_status_update: 'CREATED',
      ui_triggers: { theme_color: "#FF6600", show_orange_border: true },
      visual_assets: { vehicle_display_query: "Modern Car Diagnostic Interface", part_display_query: null },
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
    "Acquisition: Vehicle Context Lock",
    "Analysis: DTC & Symptom Reasoning",
    "Confidence Gating: Root Cause Validation",
    "Finalization: Safety Governance Audit"
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
    // Sync UI state if context is manually completed but status hasn't transitioned
    if (isContextComplete(vehicleContext) && status === 'VEHICLE_CONTEXT_COLLECTED') {
      // In a real scenario, the AI should trigger the next status, but this ensures the UI responds.
    }
  }, [vehicleContext, status]);

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

  const checkProtocolViolations = (content: string): { violated: boolean; reason?: string; remedy?: string } => {
    const forbidden = [
      { 
        term: 'chatbot', 
        reason: 'Identity Breach: AI identified as generic chatbot.', 
        remedy: 'Restoring EKA-Ai agent identity. Please re-state your vehicle query focusing on technical symptoms.' 
      },
      { 
        term: 'large language model', 
        reason: 'Identity Breach: Technical self-reference detected.', 
        remedy: 'System reset required. Ensure vehicle identification (Brand/Model/Year) is fully provided.' 
      },
      { 
        term: 'assistant', 
        reason: 'Identity Breach: Generic terminology used.', 
        remedy: 'Switching back to Service Advisor mode. Please describe the mechanical symptom again.' 
      },
      { 
        term: 'storytelling', 
        reason: 'Domain Violation: Non-automotive operational mode detected.', 
        remedy: 'EKA-Ai only operates on vehicle diagnostics. Please ask a car-repair related question.' 
      },
      { 
        term: 'price is exactly', 
        reason: 'Financial Governance: Fixed pricing detected.', 
        remedy: 'Pricing is governed by local workshop labor rates. Please focus on diagnostic next steps.' 
      }
    ];

    for (const item of forbidden) {
      if (content.toLowerCase().includes(item.term)) {
        return { violated: true, reason: item.reason, remedy: item.remedy };
      }
    }
    return { violated: false };
  };

  const handleSendMessage = async (text: string) => {
    const isRecallScan = text.toLowerCase().includes('recall') || text.toLowerCase().includes('scan');
    setActiveProtocol(isRecallScan ? RECALL_PROTOCOL : STANDARD_PROTOCOL);

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

    let attempts = 0;
    let finalParsedResponse = null;
    let validationError = false;
    let lastViolationReason = "";

    while (attempts < 2) {
      const responseData = await geminiService.sendMessage(currentHistory, vehicleContext, status);
      
      const violation = checkProtocolViolations(responseData.response_content.visual_text);
      
      if (!violation.violated) {
        finalParsedResponse = responseData;
        validationError = false;
        break;
      } else {
        lastViolationReason = violation.reason || "Unknown Breach";
        attempts++;
        validationError = true;
        
        currentHistory.push({
          role: 'user',
          parts: [{ text: `[GOVERNANCE SIGNAL]: Your previous response contained a protocol violation: "${lastViolationReason}". RE-ISSUE diagnostic response strictly following EKA-Ai Constitution.` }]
        });

        await new Promise(r => setTimeout(r, 1000));
        setLoadingStep(3); 
      }
    }

    if (!finalParsedResponse) {
      finalParsedResponse = {
        response_content: {
          visual_text: "1. AUDIT ALERT: GOVERNANCE BREACH DETECTED\n   a. Breach Type: Protocol Violation\n   b. Remediation Required: System reset required.",
          audio_text: "Response blocked due to protocol breach."
        },
        job_status_update: status,
        ui_triggers: { theme_color: "#FF0000", show_orange_border: true },
        visual_assets: { vehicle_display_query: "Protocol Violation", part_display_query: null },
        grounding_urls: []
      };
      validationError = true;
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: finalParsedResponse.response_content.visual_text,
      response_content: finalParsedResponse.response_content,
      job_status_update: finalParsedResponse.job_status_update as JobStatus,
      ui_triggers: finalParsedResponse.ui_triggers,
      visual_assets: finalParsedResponse.visual_assets,
      grounding_urls: finalParsedResponse.grounding_urls,
      timestamp: new Date(),
      isValidated: !validationError,
      validationError: validationError
    };
    
    if (finalParsedResponse.job_status_update) {
      setStatus(finalParsedResponse.job_status_update as JobStatus);
    }

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleScanRecalls = () => {
    handleSendMessage("Initiate audit-grade safety scan for official recalls and common patterns for this vehicle identity.");
  };

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-zinc-100 overflow-hidden">
      <Header status={status} vehicle={vehicleContext} />
      
      <main className="flex-1 overflow-y-auto pt-8 pb-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          {/* STRICTER HIDDEN MODE: Only show if AI has acknowledged intent OR if already complete */}
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
                <div className={`bg-[#0A0A0A] border border-[#262626] p-5 rounded-lg flex flex-col gap-4 shadow-2xl min-w-[300px] border-l-4 transition-colors duration-500 ${activeProtocol === RECALL_PROTOCOL ? 'border-l-red-600' : 'border-l-[#FF6600]'}`}>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-ping ${activeProtocol === RECALL_PROTOCOL ? 'bg-red-600' : 'bg-[#FF6600]'}`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${activeProtocol === RECALL_PROTOCOL ? 'text-red-500' : 'text-[#FF6600]'}`}>
                        {activeProtocol === RECALL_PROTOCOL ? 'EKA Safety Audit Engine' : 'EKA Governance Engine'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {activeProtocol.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${idx < loadingStep ? (activeProtocol === RECALL_PROTOCOL ? 'bg-red-600' : 'bg-[#FF6600]') : idx === loadingStep ? 'bg-zinc-100 animate-pulse' : 'bg-zinc-800'}`}></div>
                        <span className={`text-[9px] font-bold uppercase tracking-tight ${idx === loadingStep ? 'text-zinc-100' : idx < loadingStep ? (activeProtocol === RECALL_PROTOCOL ? 'text-red-500/80' : 'text-[#FF6600]/80') : 'text-zinc-700'}`}>
                          {step}
                          {idx === loadingStep && (
                            <span className="ml-2 inline-flex gap-0.5">
                              <span className="animate-[bounce_1s_infinite_0ms]">.</span>
                              <span className="animate-[bounce_1s_infinite_200ms]">.</span>
                              <span className="animate-[bounce_1s_infinite_400ms]">.</span>
                            </span>
                          )}
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
