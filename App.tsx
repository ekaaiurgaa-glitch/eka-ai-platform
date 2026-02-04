import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import StartScreen from './components/StartScreen';
import VehicleContextPanel from './components/VehicleContextPanel';
import VehicleVisuals from './components/VehicleVisuals';
import { Message, JobStatus, VehicleContext, isContextComplete, IntelligenceMode, OperatingMode, EstimateData, VisualMetric } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [vehicleContext, setVehicleContext] = useState<VehicleContext>({ vehicleType: '', brand: '', model: '', year: '', fuelType: '', registrationNumber: '', batteryCapacity: '', motorPower: '', hvSafetyConfirmed: false });
  const [intelligenceMode, setIntelligenceMode] = useState<IntelligenceMode>('FAST');
  const [operatingMode, setOperatingMode] = useState<OperatingMode>(0);
  const [activeMetric, setActiveMetric] = useState<VisualMetric | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<JobStatus>('CREATED');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isLoading]);

  const getActiveTab = (): OperatingMode => {
    const workshopStates: JobStatus[] = ['AUTH_INTAKE', 'SYMPTOM_RECORDING', 'DIAGNOSTICS_WISDOM', 'INVENTORY_GATING', 'ESTIMATE_GOVERNANCE', 'APPROVAL_GATE', 'EXECUTION_QUALITY', 'PDI_CHECKLIST'];
    const fleetStates: JobStatus[] = ['CONTRACT_VALIDATION', 'UTILIZATION_TRACKING', 'SETTLEMENT_LOGIC', 'SLA_BREACH_CHECK', 'MG_COMPLETE'];
    if (workshopStates.includes(status)) return 1;
    if (fleetStates.includes(status)) return 2;
    return operatingMode;
  };

  const handleSendMessage = async (text: string) => {
    setShowStartScreen(false);
    const trimmedText = text.trim();
    if (trimmedText.toLowerCase() === 'exit') { setMessages([]); setShowStartScreen(true); setOperatingMode(0); return; }
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: trimmedText, timestamp: new Date(), intelligenceMode, operatingMode };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
    history.push({ role: 'user', parts: [{ text: trimmedText }] });

    const responseData = await geminiService.sendMessage(history, vehicleContext, status, intelligenceMode, operatingMode);
    if (responseData.job_status_update) setStatus(responseData.job_status_update as JobStatus);
    if (responseData.visual_metrics) setActiveMetric(responseData.visual_metrics);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(), role: 'assistant', content: responseData.response_content.visual_text,
      response_content: responseData.response_content, job_status_update: responseData.job_status_update as JobStatus,
      ui_triggers: responseData.ui_triggers, visual_assets: responseData.visual_assets, grounding_links: responseData.grounding_links,
      service_history: responseData.service_history, estimate_data: responseData.estimate_data, visual_metrics: responseData.visual_metrics,
      timestamp: new Date(), intelligenceMode, operatingMode
    };
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const startNewChat = () => { setMessages([]); setShowStartScreen(true); setStatus('CREATED'); setActiveMetric(null); };
  const activeTab = getActiveTab();

  return (
    <div className="flex h-screen bg-[#000000] text-zinc-100 font-sans overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} onNewChat={startNewChat} />
      <div className="flex-1 flex flex-col relative h-full max-w-full">
        <div className="p-4 flex justify-between items-center z-20 bg-[#000000]/80 backdrop-blur-md">
            <div className="flex items-center gap-2"><span className="text-[#f18a22] font-black text-lg tracking-tighter">Eka-Ai 2.0 Flash</span><span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400 font-mono">EXPERIMENTAL</span></div>
            <div className="flex bg-[#1a1a1a] rounded-lg p-1">
                <button onClick={() => setIntelligenceMode('FAST')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${intelligenceMode === 'FAST' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Fast</button>
                <button onClick={() => setIntelligenceMode('THINKING')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${intelligenceMode === 'THINKING' ? 'bg-[#f18a22] text-black' : 'text-zinc-500'}`}>Thinking</button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 scroll-smooth custom-scrollbar" ref={scrollRef}>
            <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-center">
                {showStartScreen ? ( <StartScreen onOptionSelect={handleSendMessage} /> ) : (
                    <div className="flex flex-col justify-end min-h-0 pt-10">
                         {activeMetric && ( <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-[#0A0A0A]"><VehicleVisuals metric={activeMetric} /></div> )}
                         {messages.map((msg) => ( <ChatMessage key={msg.id} message={msg} vehicleContext={vehicleContext} onUpdateContext={setVehicleContext} /> ))}
                         {isLoading && ( <div className="flex items-center gap-3 p-6 animate-pulse"><div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f18a22] to-yellow-500 animate-spin"></div><span className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Processing Logic...</span></div> )}
                    </div>
                )}
            </div>
        </div>
        <div className="w-full bg-[#000000] p-4 pb-6">
            <div className="max-w-3xl mx-auto">
                <ChatInput onSend={handleSendMessage} isLoading={isLoading} operatingMode={activeTab} status={status} />
                <p className="text-center text-[10px] text-zinc-600 mt-3">EKA AI may display inaccurate info, so double-check its responses.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
export default App;
