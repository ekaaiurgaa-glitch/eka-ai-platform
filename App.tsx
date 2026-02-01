
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
      timestamp: new Date()
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

    const aiResponse = await geminiService.sendMessage(history);

    // Simple heuristic to update UI state based on conversation progress
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
      timestamp: new Date()
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
                <span className="text-[10px] font-black text-[#FF6600] uppercase tracking-widest">Running Diagnostic Triple-Gate...</span>
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
