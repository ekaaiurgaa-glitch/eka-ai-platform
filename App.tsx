
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
      content: "EKA-Ai SYSTEM INITIALIZED. SERVICE ADVISOR ACTIVE.\n\nI provide professional automotive diagnostics and service guidance. To proceed, I require the following locked context:\n- Brand\n- Model\n- Year\n- Fuel Type\n\nPlease provide these details along with your technical query.",
      timestamp: new Date(),
      isValidated: true
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [status, setStatus] = useState<JobStatus>('CREATED');
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const DIAGNOSTIC_HEADERS = [
    'Symptoms:',
    'Probable Cause:',
    'Recommended Action:',
    'Risk Level:',
    'Next Required Input:'
  ];

  /**
   * Trims extraneous text before and after the diagnostic block if headers are present.
   */
  const extractDiagnosticBlock = (content: string): string => {
    const lines = content.split('\n');
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (DIAGNOSTIC_HEADERS.some(h => lines[i].trim().startsWith(h))) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) return content;

    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim().startsWith(DIAGNOSTIC_HEADERS[4])) {
        endIndex = i;
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== '' && !DIAGNOSTIC_HEADERS.some(h => lines[j].trim().startsWith(h))) {
          endIndex = j;
          j++;
        }
        break;
      }
    }

    if (endIndex === -1) return content;

    return lines.slice(startIndex, endIndex + 1).join('\n').trim();
  };

  /**
   * Checks for severe protocol violations or system errors.
   */
  const checkProtocolViolations = (content: string): boolean => {
    const forbidden = [
      'CRITICAL:',             
      'hallucination',         
      'storytelling',          
      'as an AI model',        
      'I am a chatbot',        
      'I am a large language', 
      'exact price is',        
    ];
    return forbidden.some(term => content.toLowerCase().includes(term.toLowerCase()));
  };

  /**
   * Enhanced validation logic to enforce EKA-Ai Constitution.
   */
  const validateResponse = (content: string): boolean => {
    const trimmed = content.trim();

    const isRefusal = 
      trimmed.includes("strictly within the automobile") || 
      trimmed.includes("I am EKA-Ai") ||
      trimmed.includes("cannot assist with non-automotive") ||
      trimmed.includes("safety governance");
    if (isRefusal) return true;

    const isSystem = trimmed.includes("INITIALIZED") || trimmed.includes("reset");
    if (isSystem) return true;

    const hasAnyDiagnosticToken = DIAGNOSTIC_HEADERS.some(h => trimmed.includes(h));
    
    if (hasAnyDiagnosticToken) {
      return DIAGNOSTIC_HEADERS.every(h => trimmed.includes(h));
    }

    const isQuestion = trimmed.includes("?");
    const isRequestingContext = (trimmed.includes("Brand") || trimmed.includes("Model") || trimmed.includes("Year") || trimmed.includes("Fuel"));
    
    if (isQuestion || isRequestingContext) {
      return trimmed.length < 600; 
    }

    return trimmed.length < 150;
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

    const getAiResponse = async (historyMessages: Message[], systemPrompt?: string) => {
      const history = historyMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      
      if (systemPrompt) {
        history.push({
          role: 'user',
          parts: [{ text: systemPrompt }]
        });
      }

      return await geminiService.sendMessage(history);
    };

    let rawAiResponse = await getAiResponse([...messages, userMessage]);
    let aiResponse = extractDiagnosticBlock(rawAiResponse);
    let isValid = validateResponse(aiResponse);

    if (!isValid) {
      const retryFormatPrompt = "[SYSTEM GOVERNANCE SIGNAL]: Your response violated diagnostic structure. RE-ISSUE now using ONLY the mandated headers: Symptoms, Probable Cause, Recommended Action, Risk Level, Next Required Input. No other text.";
      const retryRaw = await getAiResponse([...messages, userMessage], retryFormatPrompt);
      aiResponse = extractDiagnosticBlock(retryRaw);
      isValid = validateResponse(aiResponse);
    }

    let hasViolation = checkProtocolViolations(aiResponse);
    if (isValid && hasViolation) {
      const retryViolationPrompt = "[SYSTEM GOVERNANCE SIGNAL]: Protocol breach detected. Correct the following errors: 1. No identity disclosure (You are EKA-Ai only). 2. No exact pricing. 3. Ensure engine connectivity. RE-ISSUE professional diagnostic response now.";
      const violationRetryRaw = await getAiResponse([...messages, userMessage], retryViolationPrompt);
      aiResponse = extractDiagnosticBlock(violationRetryRaw);
      isValid = validateResponse(aiResponse);
      hasViolation = checkProtocolViolations(aiResponse);
    }

    if (status === 'CREATED' && (text.toLowerCase().includes('brand') || text.split(' ').length > 3)) {
      setStatus('VEHICLE_CONTEXT_COLLECTED');
    }
    
    if (aiResponse.includes('Probable Cause:') && aiResponse.includes('Recommended Action:')) {
      setStatus('CONFIDENCE_CONFIRMED');
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      isValidated: true,
      validationError: !isValid || hasViolation
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-zinc-100 overflow-hidden">
      <Header status={status} />
      
      <main className="flex-1 overflow-y-auto px-4 py-8" ref={scrollRef}>
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="bg-[#0A0A0A] border border-[#262626] p-5 rounded-lg flex flex-col gap-4 shadow-2xl min-w-[300px] border-l-4 border-l-[#FF6600]">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-ping"></div>
                    <span className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest leading-none">EKA Governance Engine</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600">AUDIT_LOG_V1.4</span>
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

                {loadingStep === 3 && (
                  <div className="mt-2 py-1.5 px-3 bg-[#FF6600]/10 border border-[#FF6600]/20 rounded flex items-center gap-2 animate-pulse">
                    <svg className="w-3 h-3 text-[#FF6600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[8px] font-black text-[#FF6600] uppercase tracking-tighter">Confidence Gating: Evaluating context depth...</span>
                  </div>
                )}
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
