
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

  /**
   * Enhanced validation logic to enforce EKA-Ai Constitution.
   * Handles: Domain Rejections, Context Requests, Clarifications, and Full Diagnostics.
   */
  const validateResponse = (content: string): boolean => {
    const diagnosticHeaders = [
      'Symptoms:',
      'Probable Cause:',
      'Recommended Action:',
      'Risk Level:',
      'Next Required Input:'
    ];
    
    const trimmed = content.trim();

    // 1. Gate 1 Rejections (Domain)
    const isRefusal = 
      trimmed.includes("strictly within the automobile") || 
      trimmed.includes("I am EKA-Ai") ||
      trimmed.includes("cannot assist with non-automotive") ||
      trimmed.includes("safety governance");
    if (isRefusal) return true;

    // 2. System/Admin Messages
    const isSystem = trimmed.includes("INITIALIZED") || trimmed.includes("reset");
    if (isSystem) return true;

    // 3. Diagnostic Identification
    const hasAnyDiagnosticToken = diagnosticHeaders.some(h => trimmed.includes(h));
    
    if (hasAnyDiagnosticToken) {
      // If the AI starts a diagnosis, it MUST include all 5 headers for audit safety.
      return diagnosticHeaders.every(h => trimmed.includes(h));
    }

    // 4. Clarification / Context Request (Gate 2 & 3)
    // If it's a question and NOT attempting a diagnosis, it's valid.
    const isQuestion = trimmed.includes("?");
    const isRequestingContext = (trimmed.includes("Brand") || trimmed.includes("Model") || trimmed.includes("Year") || trimmed.includes("Fuel"));
    
    if (isQuestion || isRequestingContext) {
      // Valid if it's a short, professional query/clarification.
      // Long responses without headers are flagged as "storytelling".
      return trimmed.length < 600; 
    }

    // 5. Fallback for short confirmation/acknowledgment
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

    const getAiResponse = async (currentHistory: Message[]) => {
      const history = currentHistory.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      return await geminiService.sendMessage(history);
    };

    let aiResponse = await getAiResponse([...messages, userMessage]);
    let isValid = validateResponse(aiResponse);

    // Automatic Re-formatting Request (One-time retry)
    if (!isValid) {
      console.warn("EKA-Ai: Protocol violation detected. Requesting immediate compliance reformat...");
      const retryPrompt: Message = {
        id: 'retry-prompt',
        role: 'user',
        content: "[SYSTEM GOVERNANCE SIGNAL]: Your response violated strict diagnostic structure. RE-ISSUE now. If diagnosing, you MUST use all headers: Symptoms, Probable Cause, Recommended Action, Risk Level, Next Required Input. No preamble. No storytelling.",
        timestamp: new Date()
      };
      aiResponse = await getAiResponse([...messages, userMessage, retryPrompt]);
      isValid = validateResponse(aiResponse);
    }

    // State Machine Transitions
    if (status === 'CREATED' && (text.toLowerCase().includes('brand') || text.split(' ').length > 3)) {
      setStatus('VEHICLE_CONTEXT_COLLECTED');
    }
    
    // Explicit state check for successful diagnosis
    if (aiResponse.includes('Probable Cause:') && aiResponse.includes('Recommended Action:')) {
      setStatus('CONFIDENCE_CONFIRMED');
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      isValidated: true,
      validationError: !isValid
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
              <div className="bg-[#0A0A0A] border border-[#262626] p-4 rounded-lg flex items-center gap-4">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-pulse"></div>
                </div>
                <span className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest">Applying Audit Governance...</span>
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
