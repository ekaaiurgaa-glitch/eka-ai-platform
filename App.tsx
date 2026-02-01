
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

  const validateResponse = (content: string): boolean => {
    const diagnosticHeaders = [
      'Symptoms:',
      'Probable Cause:',
      'Recommended Action:',
      'Risk Level:',
      'Next Required Input:'
    ];
    
    const isRefusal = content.includes("strictly within the automobile") || content.includes("I am EKA-Ai");
    const isContextRequest = content.includes("Brand") && content.includes("Model") && content.includes("Year");
    
    // If it's one of the gate rejections or requests, it's considered valid format
    if (isRefusal || isContextRequest) return true;
    
    // If it's a diagnostic attempt (usually contains "Symptoms" or long text), it must have ALL headers
    const hasAnyHeader = diagnosticHeaders.some(h => content.includes(h));
    const hasAllHeaders = diagnosticHeaders.every(h => content.includes(h));
    
    // If it looks like a diagnosis but misses headers, it's invalid.
    // If it's a simple clarification question without any headers, we treat it as valid.
    if (hasAnyHeader) return hasAllHeaders;
    
    return true; // Simple responses/clarifications are allowed
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
      console.warn("EKA-Ai: Response failed validation. Requesting reformat...");
      const retryPrompt: Message = {
        id: 'retry-prompt',
        role: 'user',
        content: "[SYSTEM SIGNAL]: Your previous response did not strictly follow the mandatory diagnostic structure. Re-issue the diagnostic now including all fields: Symptoms, Probable Cause, Recommended Action, Risk Level, and Next Required Input.",
        timestamp: new Date()
      };
      aiResponse = await getAiResponse([...messages, userMessage, retryPrompt]);
      isValid = validateResponse(aiResponse);
    }

    // Update state machine
    if (status === 'CREATED' && (text.toLowerCase().includes('brand') || text.split(' ').length > 3)) {
      setStatus('VEHICLE_CONTEXT_COLLECTED');
    }
    if (aiResponse.includes('Probable Cause:')) {
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
                  <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-[#FF6600] rounded-full animate-bounce"></div>
                </div>
                <span className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest">Running Governance Checks...</span>
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
