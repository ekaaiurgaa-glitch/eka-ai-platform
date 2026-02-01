
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

    // Find the very first header
    for (let i = 0; i < lines.length; i++) {
      if (DIAGNOSTIC_HEADERS.some(h => lines[i].trim().startsWith(h))) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) return content; // No diagnostic headers found, return as is (could be a clarification)

    // Find the last header and its content
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim().startsWith(DIAGNOSTIC_HEADERS[4])) { // Next Required Input:
        endIndex = i;
        // Find the actual end of the content for the last header
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== '' && !DIAGNOSTIC_HEADERS.some(h => lines[j].trim().startsWith(h))) {
          endIndex = j;
          j++;
        }
        break;
      }
    }

    if (endIndex === -1) return content; // Malformed, validateResponse will catch it

    return lines.slice(startIndex, endIndex + 1).join('\n').trim();
  };

  /**
   * Enhanced validation logic to enforce EKA-Ai Constitution.
   */
  const validateResponse = (content: string): boolean => {
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
    const hasAnyDiagnosticToken = DIAGNOSTIC_HEADERS.some(h => trimmed.includes(h));
    
    if (hasAnyDiagnosticToken) {
      // If the AI starts a diagnosis, it MUST include all 5 headers
      return DIAGNOSTIC_HEADERS.every(h => trimmed.includes(h));
    }

    // 4. Clarification / Context Request (Gate 2 & 3)
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

    const getAiResponse = async (currentHistory: Message[]) => {
      const history = currentHistory.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      return await geminiService.sendMessage(history);
    };

    let rawAiResponse = await getAiResponse([...messages, userMessage]);
    
    // Step 1: Attempt to extract diagnostic block to remove "fluff"
    let aiResponse = extractDiagnosticBlock(rawAiResponse);
    
    // Step 2: Validate the result
    let isValid = validateResponse(aiResponse);

    // Automatic Re-formatting Request (One-time retry)
    if (!isValid) {
      console.warn("EKA-Ai: Protocol violation detected. Requesting immediate compliance reformat...");
      const retryPrompt: Message = {
        id: 'retry-prompt',
        role: 'user',
        content: "[SYSTEM GOVERNANCE SIGNAL]: Your response violated strict diagnostic structure. RE-ISSUE now. Use ONLY the headers: Symptoms, Probable Cause, Recommended Action, Risk Level, and Next Required Input. Remove all preamble, introductions, and closing remarks.",
        timestamp: new Date()
      };
      const retryRaw = await getAiResponse([...messages, userMessage, retryPrompt]);
      aiResponse = extractDiagnosticBlock(retryRaw);
      isValid = validateResponse(aiResponse);
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
                <span className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest">Enforcing Diagnostic Structure...</span>
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
