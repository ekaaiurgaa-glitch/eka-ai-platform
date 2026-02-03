
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
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
    batteryCapacity: '',
    motorPower: '',
    hvSafetyConfirmed: false
  });

  const [intelligenceMode, setIntelligenceMode] = useState<IntelligenceMode>('FAST');
  const [operatingMode, setOperatingMode] = useState<OperatingMode>(0);
  const [panelTriggered, setPanelTriggered] = useState(false);

  const STANDARD_PROTOCOL = ["Boundary Auth", "URGAA Query", "Symptom Triage", "RSA Gating", "Audit Finalization"];
  const JOBCARD_PROTOCOL = ["Workshop Auth", "Service Normalization", "Inventory Gating", "Compliance Audit", "PDI Verification"];
  const MG_PROTOCOL = ["Contract Validation", "Utilization Analytics", "SLA Breach Logic", "Settlement Logic", "Cycle Closure"];
  const THINKING_PROTOCOL = ["Logic Node Branching", "Ecosystem Integration", "Pattern Synthesis", "EKA Governance Audit"];

  const [activeProtocol, setActiveProtocol] = useState(STANDARD_PROTOCOL);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "EKA-Ai Online. Architecture Loaded. Awaiting Directive.",
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

  const getActiveTab = (): OperatingMode => {
    const workshopStates: JobStatus[] = ['AUTH_INTAKE', 'SYMPTOM_RECORDING', 'DIAGNOSTICS_WISDOM', 'INVENTORY_GATING', 'ESTIMATE_GOVERNANCE', 'APPROVAL_GATE', 'EXECUTION_QUALITY', 'PDI_CHECKLIST'];
    const fleetStates: JobStatus[] = ['CONTRACT_VALIDATION', 'UTILIZATION_TRACKING', 'SETTLEMENT_LOGIC', 'SLA_BREACH_CHECK', 'MG_COMPLETE'];

    if (workshopStates.includes(status)) return 1;
    if (fleetStates.includes(status)) return 2;
    return operatingMode;
  };

  const handleSendMessage = async (text: string) => {
    const trimmedText = text.trim();
    const lowerText = trimmedText.toLowerCase();
    
    // Logic to trigger the vehicle context panel if certain keywords are used
    const vehicleKeywords = ['car', 'bike', 'registration', 'vehicle', 'repair', 'service', 'engine', 'fuel', 'hsn', 'estimate', 'job card'];
    if (vehicleKeywords.some(kw => lowerText.includes(kw))) {
      setPanelTriggered(true);
    }

    if (lowerText === 'exit' || lowerText === 'cancel' || lowerText === 'menu') {
      handleModeChange(0);
      setPanelTriggered(false);
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
    
    // If the AI response indicates a vehicle status update, trigger panel
    if (responseData.job_status_update) {
      setStatus(responseData.job_status_update as JobStatus);
      setPanelTriggered(true);
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseData.response_content.visual_text,
      response_content: responseData.response_content,
      job_status_update: responseData.job_status_update as JobStatus,
      ui_triggers: responseData.ui_triggers,
      visual_assets: responseData.visual_assets,
      grounding_links: responseData.grounding_links,
      service_history: responseData.service_history,
      estimate_data: responseData.estimate_data,
      visual_metrics: responseData.visual_metrics,
      timestamp: new Date(),
      intelligenceMode,
      operatingMode
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleModeChange = (mode: OperatingMode) => {
    setOperatingMode(mode);
    if (mode !== 0) setPanelTriggered(true);
    
    const entryStatus: JobStatus = mode === 1 ? 'AUTH_INTAKE' : mode === 2 ? 'CONTRACT_VALIDATION' : 'IGNITION_TRIAGE';
    setStatus(entryStatus);
    
    let promptContent = "EKA-Ai Online. Architecture Loaded. Awaiting Directive.";
    if (mode === 1) promptContent = "Enter Vehicle Registration Number to proceed with Workshop Intake.";
    if (mode === 2) promptContent = "Enter Fleet ID or Billing Month to proceed with Contract Governance.";

    setMessages(prev => [...prev, {
      id: `mode-pivot-${Date.now()}`,
      role: 'assistant',
      content: promptContent,
      timestamp: new Date(),
      operatingMode: mode,
      job_status_update: entryStatus
    }]);
  };

  const handleEstimateAuthorize = (finalData: EstimateData) => {
    // Lock the status and notify system
    setStatus('APPROVAL_GATE');
    setMessages(prev => [...prev, {
      id: `auth-success-${Date.now()}`,
      role: 'assistant',
      content: `ESTIMATE AUTHORIZED: Compliance checks for HSN 8708/9987 passed. Dossier ${finalData.estimate_id} has been moved to APPROVAL_GATE. Awaiting customer signature.`,
      timestamp: new Date(),
      job_status_update: 'APPROVAL_GATE',
      operatingMode: 1
    }]);
    
    // Scroll to new message
    setTimeout(scrollToBottom, 100);
  };

  const handlePlayAudio = async (text: string) => {
    if (!text || isAudioPlaying) return;
    
    try {
      setIsAudioPlaying(true);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const audioData = await geminiService.generateSpeech(text);
      if (audioData) {
        const audioBuffer = await geminiService.decodeAudioData(audioData, audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          setIsAudioPlaying(false);
        };
        source.start(0);
      } else {
        setIsAudioPlaying(false);
      }
    } catch (error) {
      console.error("Audio Playback Error:", error);
      setIsAudioPlaying(false);
    }
  };

  const activeTab = getActiveTab();
  const showPanel = panelTriggered || isContextComplete(vehicleContext) || activeTab !== 0;

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-zinc-100 overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#f18a22]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <Header status={status} vehicle={vehicleContext} isLoading={isLoading} operatingMode={activeTab} />
      
      <div className="backdrop-blur-xl bg-black/40 border-b border-white/5 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-4">
          <div className="flex bg-black/60 border border-white/10 rounded-xl p-1 shadow-2xl">
            <button onClick={() => setIntelligenceMode('FAST')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${intelligenceMode === 'FAST' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Core AI</button>
            <button onClick={() => setIntelligenceMode('THINKING')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${intelligenceMode === 'THINKING' ? 'bg-purple-600/80 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Expert</button>
          </div>
          <div className="h-4 w-[1px] bg-zinc-800 hidden md:block"></div>
          <div className="flex bg-black/60 border border-white/10 rounded-xl p-1 shadow-2xl">
            <button onClick={() => handleModeChange(0)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${activeTab === 0 ? 'bg-[#f18a22] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Ignition</button>
            <button onClick={() => handleModeChange(1)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${activeTab === 1 ? 'bg-[#f18a22] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Workshop</button>
            <button onClick={() => handleModeChange(2)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${activeTab === 2 ? 'bg-[#f18a22] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Fleet</button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pt-8 pb-4 z-0" ref={scrollRef}>
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          {showPanel && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 px-4">
              <VehicleContextPanel 
                context={vehicleContext} 
                onUpdate={setVehicleContext} 
                operatingMode={activeTab}
                status={status}
              />
            </div>
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
                onEstimateAuthorize={handleEstimateAuthorize}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-8 animate-pulse text-[10px] font-black uppercase tracking-[0.2em] text-[#f18a22] px-10">
                Logic Engine Processing...
              </div>
            )}
          </div>
        </div>
      </main>
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} operatingMode={activeTab} status={status} />
    </div>
  );
};

export default App;
