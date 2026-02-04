
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import VehicleContextPanel from './components/VehicleContextPanel';
import VehicleVisuals from './components/VehicleVisuals';
import TelemetryDashboard from './components/TelemetryDashboard';
import { Message, JobStatus, VehicleContext, isContextComplete, IntelligenceMode, OperatingMode, EstimateData, VisualMetric } from './types';
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
  const [panelTriggered, setPanelTriggered] = useState(false);
  const [activeMetric, setActiveMetric] = useState<VisualMetric | null>(null);

  const STANDARD_PROTOCOL = ["Logic Node Boot", "Governed Auth", "Audit Finalization"];
  const JOBCARD_PROTOCOL = ["Intake Logic", "Diagnosis Gate", "Estimate Audit", "PDI Checklist", "Completion"];
  const MG_PROTOCOL = ["Contract Sync", "Utilization Logic", "Stability Index", "Settlement Logic"];
  const THINKING_PROTOCOL = ["Logic Node Branching", "Pattern Synthesis", "EKA Governance Audit"];

  const [activeProtocol, setActiveProtocol] = useState(STANDARD_PROTOCOL);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "EKA-AI online. Governed automobile intelligence active. Awaiting vehicle context or fleet ID.",
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
    const workshopStates: JobStatus[] = ['INTAKE', 'DIAGNOSIS', 'ESTIMATION', 'APPROVAL', 'EXECUTION', 'PDI', 'COMPLETION', 'INVOICING', 'CLOSED', 'AUTH_INTAKE', 'DIAGNOSED', 'ESTIMATED', 'CUSTOMER_APPROVED', 'PDI_COMPLETED'];
    const fleetStates: JobStatus[] = ['MG_ACTIVE', 'BILLING_CYCLE_CLOSED', 'SETTLED', 'TERMINATED', 'MG_CREATED', 'MG_CONSUMING', 'MG_THRESHOLD_ALERT', 'MG_EXHAUSTED'];

    if (workshopStates.includes(status)) return 1;
    if (fleetStates.includes(status)) return 2;
    return operatingMode;
  };

  const handleSendMessage = async (text: string) => {
    const trimmedText = text.trim();
    const lowerText = trimmedText.toLowerCase();
    
    const vehicleKeywords = ['car', 'bike', 'registration', 'vehicle', 'repair', 'service', 'engine', 'fuel', 'hsn', 'estimate', 'job card', 'fleet', 'contract', 'mg'];
    if (vehicleKeywords.some(kw => lowerText.includes(kw))) {
      setPanelTriggered(true);
    }

    if (lowerText === 'exit' || lowerText === 'cancel' || lowerText === 'menu') {
      handleModeChange(0);
      setPanelTriggered(false);
      setActiveMetric(null);
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
    
    if (responseData.job_status_update) {
      setStatus(responseData.job_status_update as JobStatus);
    }

    if (responseData.visual_metrics) {
      setActiveMetric(responseData.visual_metrics);
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
      recall_data: responseData.recall_data,
      mg_analysis: responseData.mg_analysis,
      diagnostic_data: responseData.diagnostic_data,
      pdi_checklist: responseData.pdi_checklist,
      timestamp: new Date(),
      intelligenceMode,
      operatingMode
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleModeChange = (mode: OperatingMode) => {
    setOperatingMode(mode);
    setPanelTriggered(mode !== 0);
    
    const entryStatus: JobStatus = mode === 1 ? 'AUTH_INTAKE' : mode === 2 ? 'MG_ACTIVE' : 'IGNITION_TRIAGE';
    setStatus(entryStatus);
    
    let promptContent = "EKA-AI online. Governed automobile intelligence active. Awaiting vehicle context or fleet instruction.";
    if (mode === 1) promptContent = "Automobile Intake protocol active. Provide vehicle context or Registration Number.";
    if (mode === 2) promptContent = "Fleet Governance Engine active. Enter Fleet ID or Billing Cycle reference.";

    setMessages(prev => [...prev, {
      id: `mode-pivot-${Date.now()}`,
      role: 'assistant',
      content: promptContent,
      timestamp: new Date(),
      operatingMode: mode,
      job_status_update: entryStatus
    }]);
  };

  const handleScanRecalls = () => {
    if (isContextComplete(vehicleContext)) {
      handleSendMessage(`Scan official safety recalls and common reported mechanical issues for ${vehicleContext.brand} ${vehicleContext.model} ${vehicleContext.year}.`);
    }
  };

  const handleEstimateAuthorize = (finalData: EstimateData) => {
    setStatus('APPROVAL');
    setMessages(prev => [...prev, {
      id: `auth-success-${Date.now()}`,
      role: 'assistant',
      content: `ESTIMATE AUTHORIZED: Logic dossier ${finalData.estimate_id} has been moved to APPROVAL gate. Awaiting explicit customer authorization.`,
      timestamp: new Date(),
      job_status_update: 'APPROVAL',
      operatingMode: 1
    }]);
    
    setTimeout(scrollToBottom, 100);
  };

  const handlePdiVerify = (data: { verified: boolean }) => {
    setVehicleContext(prev => ({ ...prev, pdiVerified: data.verified }));
    setStatus('COMPLETION');
    setMessages(prev => [...prev, {
      id: `pdi-verify-${Date.now()}`,
      role: 'assistant',
      content: "PDI VERIFIED. Safety checklist and evidence confirmed on central node. Transitioning to COMPLETION. Vehicle is now INVOICE ELIGIBLE.",
      timestamp: new Date(),
      job_status_update: 'COMPLETION',
      operatingMode: 1
    }]);
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
  const showVehiclePanel = operatingMode === 1 
    ? (status === 'AUTH_INTAKE' || status === 'PDI' || status === 'INTAKE') 
    : (panelTriggered || isContextComplete(vehicleContext) || operatingMode === 2);
  const showTelemetry = operatingMode === 0 || operatingMode === 2;

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-zinc-100 overflow-hidden relative font-inter">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#f18a22]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <Header status={status} vehicle={vehicleContext} isLoading={isLoading} operatingMode={activeTab} />
      
      <div className="backdrop-blur-xl bg-black/40 border-b border-white/5 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-4">
          <div className="flex bg-black/60 border border-white/10 rounded-xl p-1 shadow-2xl">
            <button onClick={() => setIntelligenceMode('FAST')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all font-outfit ${intelligenceMode === 'FAST' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>CORE AI</button>
            <button onClick={() => setIntelligenceMode('THINKING')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all font-outfit ${intelligenceMode === 'THINKING' ? 'bg-purple-600/80 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>EXPERT</button>
          </div>
          <div className="h-4 w-[1px] bg-zinc-800 hidden md:block"></div>
          <div className="flex bg-black/60 border border-white/10 rounded-xl p-1 shadow-2xl">
            <button onClick={() => handleModeChange(0)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all font-outfit ${operatingMode === 0 ? 'bg-[#f18a22] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>IGNITION</button>
            <button onClick={() => handleModeChange(1)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all font-outfit ${operatingMode === 1 ? 'bg-[#f18a22] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>WORKSHOP</button>
            <button onClick={() => handleModeChange(2)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all font-outfit ${operatingMode === 2 ? 'bg-[#f18a22] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>FLEET</button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex z-0">
        <div className="flex-1 overflow-y-auto pt-8 pb-4 relative scroll-smooth" ref={scrollRef}>
          <div className="max-w-4xl mx-auto flex flex-col min-h-full">
            <div className="px-4">
               {showTelemetry && (
                 <TelemetryDashboard 
                   status={status} 
                   complianceScore={status === 'APPROVAL' ? 100 : status === 'ESTIMATION' ? 75 : 40} 
                   systemHealth={98} 
                 />
               )}
            </div>
            {showVehiclePanel && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 px-4">
                <VehicleContextPanel 
                  context={vehicleContext} 
                  onUpdate={setVehicleContext} 
                  onScanRecalls={handleScanRecalls}
                  operatingMode={operatingMode}
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
                  onPdiVerify={handlePdiVerify}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-12 animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-[#f18a22] px-10 border-l-4 border-[#f18a22] py-2 ml-4 font-mono">
                  {activeProtocol[loadingStep]}... [LOGIC ENGINE SYNC]
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden xl:flex w-[450px] flex-col bg-[#050505] border-l border-zinc-900 p-8 overflow-y-auto animate-in slide-in-from-right duration-700 shadow-2xl relative">
             <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f18a22 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
             
             <div className="flex items-center justify-between mb-10 border-b border-zinc-800 pb-6 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono">REAL-TIME TELEMETRY</span>
                  <span className="text-white font-black uppercase font-outfit text-xl tracking-tighter mt-1">ARCHITECTURAL HUD</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-green-500 font-mono">SYNC_ACTIVE</span>
                    <span className="text-[10px] font-black text-white font-mono uppercase">NODE_v1.5</span>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_#22c55e]"></div>
                </div>
             </div>
             
             <div className="space-y-10 relative z-10">
               {activeMetric ? (
                 <VehicleVisuals metric={activeMetric} />
               ) : (
                 <div className="p-12 border-4 border-dashed border-zinc-900 rounded-3xl flex flex-col items-center justify-center text-center group hover:border-zinc-700 transition-all">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 opacity-30 group-hover:opacity-60 transition-opacity">
                      <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] font-mono leading-relaxed">
                      TELEMETRY MATRIX <br/> AWAITING CORE SIGNAL
                    </span>
                 </div>
               )}
               
               <div className="p-8 bg-zinc-900/30 rounded-3xl border-2 border-zinc-800/50 backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
                     <div className="w-2 h-4 bg-[#f18a22]"></div>
                     <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">SESSION AUDIT SUMMARY</span>
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center group">
                        <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase">LOGICAL STATE</span>
                        <span className="text-[#f18a22] font-black font-mono text-[11px] uppercase tracking-tighter">{status}</span>
                     </div>
                     <div className="flex justify-between items-center group">
                        <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase">IDENTITY SYNC</span>
                        <span className={`text-[11px] font-black font-mono uppercase ${isContextComplete(vehicleContext) ? 'text-green-500' : 'text-red-500'}`}>
                          {isContextComplete(vehicleContext) ? 'SECURED' : 'AWAITING_ID'}
                        </span>
                     </div>
                  </div>
               </div>
             </div>
        </aside>
      </main>
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} operatingMode={operatingMode} status={status} />
    </div>
  );
};

export default App;
