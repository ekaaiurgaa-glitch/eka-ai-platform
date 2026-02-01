
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
  const [status, setStatus] = useState<JobStatus>('CREATED');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
      'CRITICAL:',             // Service connectivity/engine errors
      'hallucination',         // Self-admission of guessing
      'storytelling',          // Non-deterministic output
      'as an AI model',        // Identity breach
      'I am a chatbot',        // Identity breach
      'I am a large language', // Identity breach
      'exact price is',        // Pricing firewall breach
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

    // --- PASS 1: INITIAL REQUEST ---
    let rawAiResponse = await getAiResponse([...messages, userMessage]);
    let aiResponse = extractDiagnosticBlock(rawAiResponse);
    let isValid = validateResponse(aiResponse);

    // --- PASS 2: FORMAT RETRY ---
    if (!isValid) {
      console.warn("EKA-Ai: Format violation. Retrying...");
      const retryFormatPrompt = "[SYSTEM GOVERNANCE SIGNAL]: Your response violated diagnostic structure. RE-ISSUE now using ONLY the mandated headers: Symptoms, Probable Cause, Recommended Action, Risk Level, Next Required Input. No other text.";
      const retryRaw = await getAiResponse([...messages, userMessage], retryFormatPrompt);
      aiResponse = extractDiagnosticBlock(retryRaw);
      isValid = validateResponse(aiResponse);
    }

    // --- PASS 3: PROTOCOL VIOLATION CHECK (Post-Validation) ---
    // Even if format is valid, check for 'CRITICAL' errors or identity leaks
    let hasViolation = checkProtocolViolations(aiResponse);
    if (isValid && hasViolation) {
      console.warn("EKA-Ai: Protocol violation detected. Triggering correction retry...");
      const retryViolationPrompt = "[SYSTEM GOVERNANCE SIGNAL]: Protocol breach detected. Correct the following errors: 1. No identity disclosure (You are EKA-Ai only). 2. No exact pricing. 3. Ensure engine connectivity. RE-ISSUE professional diagnostic response now.";
      const violationRetryRaw = await getAiResponse([...messages, userMessage], retryViolationPrompt);
      aiResponse = extractDiagnosticBlock(violationRetryRaw);
      isValid = validateResponse(aiResponse);
      hasViolation = checkProtocolViolations(aiResponse);
    }

    // State Machine Transitions
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
              <div className="bg-[#0A0A0A] border border-[#262626] p-4 rounded-lg flex items-center gap-4 shadow-2xl">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-pulse"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest leading-none">EKA Governance Engine</span>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-tight mt-0.5">Auditing Protocol & Safety Gates...</span>
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
