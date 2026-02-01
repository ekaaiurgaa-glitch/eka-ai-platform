
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { Message, JobStatus } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "EKA-Ai SYSTEM INITIALIZED. SERVICE ADVISOR ACTIVE.",
      visual_content: "EKA-Ai SYSTEM INITIALIZED. SERVICE ADVISOR ACTIVE.\n\nI provide professional automotive diagnostics and service guidance. To proceed, I require the following locked context:\n- Brand\n- Model\n- Year\n- Fuel Type\n\nPlease provide these details along with your technical query.",
      audio_content: "EKA-Ai system initialized. Service advisor active. Please provide your vehicle's brand, model, year, and fuel type for diagnostic guidance.",
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
    "Analysis: Diagnostic Reasoning",
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

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const history = [...messages, userMessage].map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const responseText = await geminiService.sendMessage(history);
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (e) {
      parsedResponse = {
        visual_content: responseText,
        audio_content: "Response received but structure check failed.",
        language_code: "en",
        available_translations: ["en"]
      };
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: parsedResponse.visual_content,
      visual_content: parsedResponse.visual_content,
      audio_content: parsedResponse.audio_content,
      language_code: parsedResponse.language_code,
      available_translations: parsedResponse.available_translations,
      timestamp: new Date(),
      isValidated: true
    };

    if (status === 'CREATED' && (text.toLowerCase().includes('brand') || text.split(' ').length > 3)) {
      setStatus('VEHICLE_CONTEXT_COLLECTED');
    }
    
    if (parsedResponse.visual_content.includes('Probable Cause:') && parsedResponse.visual_content.includes('Recommended Action:')) {
      setStatus('CONFIDENCE_CONFIRMED');
    }

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-zinc-100 overflow-hidden">
      <Header status={status} />
      
      <main className="flex-1 overflow-y-auto px-4 py-8" ref={scrollRef}>
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          {messages.map((msg) => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              onPlayAudio={handlePlayAudio}
              isAudioPlaying={isAudioPlaying}
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
      </main>

      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;
