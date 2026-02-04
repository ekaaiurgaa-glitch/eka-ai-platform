import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import JobCardProgress from './components/JobCardProgress';
import AuditLog from './components/AuditLog';
import ErrorBoundary from './components/ErrorBoundary';
import { Message, JobStatus, VehicleContext, IntelligenceMode, OperatingMode, AuditEntry } from './types';
import { geminiService } from './services/geminiService';

// Environment validation - checks for required configuration
const validateEnvironment = (): { valid: boolean; error?: string } => {
  // In Vite, environment variables are available via import.meta.env
  // For this application, we check if the build was successful and basic runtime is available
  // API key validation happens in geminiService when making requests
  if (typeof window === 'undefined') {
    return { valid: false, error: 'Browser environment required' };
  }
  return { valid: true };
};

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
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome', 
    role: 'assistant', 
    content: "EKA-AI online. Governed automobile intelligence active.", 
    timestamp: new Date(), 
    operatingMode: 0
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<JobStatus>('CREATED');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toISOString(),
      action: 'Session initialized',
      actor: 'SYSTEM',
    }
  ]);
  const [envError, setEnvError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Environment validation on startup
  useEffect(() => {
    const envCheck = validateEnvironment();
    if (!envCheck.valid) {
      setEnvError(envCheck.error || 'Configuration error');
    }
  }, []);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K to focus the chat input (uses document query as ChatInput manages its own input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const chatInput = document.querySelector('textarea[placeholder*="vehicle issue"]') as HTMLTextAreaElement;
        chatInput?.focus();
      }
      // Escape to close sidebar on mobile
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Auto-scroll
  useEffect(() => { 
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); 
  }, [messages, isLoading]);

  // Add audit entry helper
  const addAuditEntry = useCallback((action: string, actor: AuditEntry['actor'], confidence_score?: number) => {
    setAuditTrail(prev => [...prev, {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      actor,
      confidence_score,
    }]);
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text, 
      timestamp: new Date(),
      intelligenceMode,
      operatingMode
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    addAuditEntry(`User message: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`, 'USER');

    try {
      const history = [...messages, userMsg].map(m => ({ 
        role: m.role === 'user' ? 'user' : 'model', 
        parts: [{ text: m.content }] 
      }));
      const response = await geminiService.sendMessage(history, vehicleContext, status, intelligenceMode, operatingMode);
      
      if (response.job_status_update) {
        setStatus(response.job_status_update as JobStatus);
        addAuditEntry(`Status updated to ${response.job_status_update}`, 'AI');
      }
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: response.response_content.visual_text,
        visual_metrics: response.visual_metrics, 
        diagnostic_data: response.diagnostic_data, 
        mg_analysis: response.mg_analysis,
        service_history: response.service_history,
        estimate_data: response.estimate_data,
        pdi_checklist: response.pdi_checklist,
        recall_data: response.recall_data,
        timestamp: new Date(),
        intelligenceMode,
        operatingMode
      };
      setMessages(prev => [...prev, aiMsg]);
      addAuditEntry('AI response generated', 'AI', 95);
    } catch (error) {
      addAuditEntry(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SYSTEM');
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        operatingMode
      }]);
    }
    
    setIsLoading(false);
  };

  const handleModeChange = (mode: OperatingMode) => {
    setOperatingMode(mode);
    const entryStatus: JobStatus = mode === 1 ? 'AUTH_INTAKE' : mode === 2 ? 'MG_ACTIVE' : 'IGNITION_TRIAGE';
    setStatus(entryStatus);
    addAuditEntry(`Mode changed to ${mode === 0 ? 'IGNITION' : mode === 1 ? 'WORKSHOP' : 'FLEET'}`, 'USER');
    
    setMessages(prev => [...prev, {
      id: `mode-pivot-${Date.now()}`,
      role: 'assistant',
      content: mode === 1 ? "Workshop Protocol Active. Provide Registration Number." : mode === 2 ? "Fleet Governance Engine Active." : "Ignition Mode Active.",
      timestamp: new Date(),
      operatingMode: mode,
      job_status_update: entryStatus
    }]);
    
    // Close sidebar on mobile after mode change
    setSidebarOpen(false);
  };

  const handleEstimateApprove = (data: unknown) => {
    addAuditEntry('Estimate approved', 'USER');
    setStatus('CUSTOMER_APPROVED');
  };

  const handlePDIVerify = (data: unknown) => {
    addAuditEntry('PDI verification completed', 'USER');
    setStatus('PDI_COMPLETED');
  };

  // Environment error display
  if (envError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-[#050505] border-4 border-red-500 rounded-xl p-8 max-w-md text-center">
          <h1 className="text-xl font-black text-red-500 uppercase font-mono mb-4">Configuration Error</h1>
          <p className="text-zinc-400 font-mono text-sm mb-6">{envError}</p>
          <p className="text-zinc-600 font-mono text-xs">Please check your environment variables and restart the application.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-layout">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="offline-banner" role="alert" aria-live="polite">
            EKA-AI Offline Mode — Changes will sync when reconnected
          </div>
        )}

        {/* Mobile Header */}
        <div className="mobile-header md:hidden">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="hamburger-btn touch-target"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#f18a22] rounded-md flex items-center justify-center font-black text-black text-[10px]">G4</div>
            <span className="text-sm font-bold text-white">EKA-AI</span>
          </div>
          <div className="w-11" /> {/* Spacer for centering */}
        </div>

        {/* Mobile Overlay */}
        <div 
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''} md:flex`} aria-label="Main navigation">
          {/* Mobile close button */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute top-4 right-4 p-2 text-zinc-500 hover:text-white"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="mb-8 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#f18a22] rounded-lg flex items-center justify-center font-black text-black text-xs">G4</div>
            <h1 className="text-xl font-bold tracking-tight text-white">EKA-AI</h1>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-3 px-4 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] rounded-xl text-sm font-medium text-white flex items-center gap-2 mb-6 touch-target"
          >
            <span className="text-[#f18a22] text-lg font-bold">+</span> New Session
          </button>
          
          {/* Mode Switcher */}
          <div className="mb-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-2 block">Mode</span>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => handleModeChange(0)} 
                className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all tracking-wide text-left touch-target ${operatingMode === 0 ? 'bg-[#f18a22] text-black' : 'text-zinc-500 hover:text-white hover:bg-[#1a1a1a]'}`}
              >
                IGNITION
              </button>
              <button 
                onClick={() => handleModeChange(1)} 
                className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all tracking-wide text-left touch-target ${operatingMode === 1 ? 'bg-[#f18a22] text-black' : 'text-zinc-500 hover:text-white hover:bg-[#1a1a1a]'}`}
              >
                WORKSHOP
              </button>
              <button 
                onClick={() => handleModeChange(2)} 
                className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase transition-all tracking-wide text-left touch-target ${operatingMode === 2 ? 'bg-[#f18a22] text-black' : 'text-zinc-500 hover:text-white hover:bg-[#1a1a1a]'}`}
              >
                FLEET
              </button>
            </div>
          </div>

          {/* Intelligence Mode */}
          <div className="mb-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-2 block">Intelligence</span>
            <div className="flex gap-1">
              <button 
                onClick={() => setIntelligenceMode('FAST')} 
                className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wide touch-target ${intelligenceMode === 'FAST' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                FAST
              </button>
              <button 
                onClick={() => setIntelligenceMode('THINKING')} 
                className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wide touch-target ${intelligenceMode === 'THINKING' ? 'bg-purple-600/50 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                EXPERT
              </button>
            </div>
          </div>
          
          {/* Status Panel */}
          <div className="mb-4">
            <div className="p-3 bg-[#111] rounded-lg border border-[#222] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">STATUS</span>
                <span className="text-[#f18a22] font-mono text-[10px]">{status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ONLINE</span>
                <span className={`font-mono text-[10px] ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                  {isOnline ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Log */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <AuditLog entries={auditTrail} jobId="current" />
          </div>

          {/* Keyboard Shortcut Hint */}
          <div className="pt-4 mt-4 border-t border-zinc-900">
            <p className="text-[8px] text-zinc-700 font-mono text-center">
              Ctrl+K to focus input • Esc to close
            </p>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="main-chat-area" role="main" aria-label="Chat area">
          {/* Job Card Progress - Show for Workshop mode */}
          {operatingMode === 1 && (
            <JobCardProgress currentStatus={status} />
          )}

          <div 
            className="chat-scroll-container" 
            ref={scrollRef}
            aria-live="polite"
            aria-label="Chat messages"
          >
            <div className="content-width flex flex-col gap-6 pb-32">
              {messages.map(msg => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg}
                  onEstimateApprove={handleEstimateApprove}
                  onPDIVerify={handlePDIVerify}
                />
              ))}
              {isLoading && (
                <div className="flex items-center gap-3 ml-2" aria-label="EKA-AI is thinking">
                  <div className="typing-indicator">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                    EKA-AI is analyzing...
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black to-transparent">
            <div className="content-width">
              <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
              <p className="text-[8px] text-zinc-700 font-mono text-center mt-2 hidden md:block">
                Press Enter to send • Shift+Enter for new line • Ctrl+K to focus
              </p>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};
export default App;
