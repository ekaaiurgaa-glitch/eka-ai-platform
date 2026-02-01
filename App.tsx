
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
      visual_content: "1. EKA-Ai SYSTEM INITIALIZED. SERVICE ADVISOR ACTIVE.\n   a. I provide professional automotive diagnostics and service guidance.\n   b. To proceed, I require your vehicle's identification (Brand, Model, and Year).\n   c. You can also input a Diagnostic Trouble Code (DTC) for an expert breakdown.",
      audio_content: "EKA-Ai system initialized. Service advisor active. Please provide your vehicle's brand, model, and year to begin diagnostic guidance or provide a DTC for code lookup.",
      language_code: "en",
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

  const PROTOCOL_STEPS = [
    "Verification: Domain Boundary Check",
    "Acquisition: Vehicle Context Lock",
    "Analysis: DTC & Symptom Reasoning",
    "Confidence Gating: Root Cause Validation",
    "Finalization: Safety Governance Audit"
  ];

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isContextComplete(vehicleContext) && status === 'CREATED') {
      setStatus('VEHICLE_CONTEXT_COLLECTED');
    }
  }, [vehicleContext, status]);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < PROTOCOL_STEPS.length - 1 ? prev + 1 : prev));
      }, 800);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

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
      parts: [{ text: m.content }]
    }));

    let attempts = 0;
    let finalParsedResponse = null;
    let validationError = false;
    let lastViolationReason = "";
    let lastRemedy = "";

    while (attempts < 2) {
      const responseData = await geminiService.sendMessage(currentHistory, vehicleContext);
      
      const violation = checkProtocolViolations(responseData.visual_content);
      
      if (!violation.violated) {
        finalParsedResponse = responseData;
        validationError = false;
        break;
      } else {
        lastViolationReason = violation.reason || "Unknown Breach";
        lastRemedy = violation.remedy || "Refine query.";
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
        visual_content: "1. AUDIT ALERT: GOVERNANCE BREACH DETECTED\n   a. Breach Type: Protocol Violation\n   b. Remediation Required: System reset required. Please refine your mechanical query.",
        audio_content: "Response blocked due to protocol breach.",
        language_code: "en",
        available_translations: ["en"],
        grounding_urls: []
      };
      validationError = true;
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: finalParsedResponse.visual_content,
      visual_content: finalParsedResponse.visual_content,
      audio_content: finalParsedResponse.audio_content,
      language_code: finalParsedResponse.language_code,
      available_translations: finalParsedResponse.available_translations,
      grounding_urls: finalParsedResponse.grounding_urls,
      timestamp: new Date(),
      isValidated: !validationError,
      validationError: validationError
    };
    
    if (finalParsedResponse.visual_content.toLowerCase().includes('probable cause')) {
      setStatus('CONFIDENCE_CONFIRMED');
    }

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-zinc-100 overflow-hidden">
      <Header status={status} vehicle={vehicleContext} />
      
      <main className="flex-1 overflow-y-auto pt-8 pb-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          <VehicleContextPanel context={vehicleContext} onUpdate={setVehicleContext} />
          
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
                <div className="bg-[#0A0A0A] border border-[#262626] p-5 rounded-lg flex flex-col gap-4 shadow-2xl min-w-[300px] border-l-4 border-l-[#FF6600]">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-ping"></div>
                      <span className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest leading-none">EKA Governance Engine</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {PROTOCOL_STEPS.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${idx < loadingStep ? 'bg-[#FF6600]' : idx === loadingStep ? 'bg-zinc-100 animate-pulse' : 'bg-zinc-800'}`}></div>
                        <span className={`text-[9px] font-bold uppercase tracking-tight ${idx === loadingStep ? 'text-zinc-100' : idx < loadingStep ? 'text-[#FF6600]/80' : 'text-zinc-700'}`}>
                          {step}
                          {idx === loadingStep && (
                            <span className="ml-2 inline-flex gap-0.5">
                              <span className="animate-[bounce_1s_infinite_0ms]">.</span>
                              <span className="animate-[bounce_1s_infinite_200ms]">.</span>
                              <span className="animate-[bounce_1s_infinite_400ms]">.</span>
                            </span>
                          )}
                          {idx < loadingStep && <span className="ml-2 text-[8px] opacity-60">✓ PASS</span>}
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
