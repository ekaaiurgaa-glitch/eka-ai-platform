
import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      if (isListening) stopListening();
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use a modern browser like Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInput(prev => (prev.trim() + ' ' + finalTranscript).trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error("EKA-Ai Voice Error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="p-4 bg-[#000000] border-t border-[#262626] relative z-20">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening to symptoms..." : "Describe vehicle symptoms or ask a service question..."}
            className={`w-full bg-[#0A0A0A] text-white border border-[#262626] rounded-xl py-4 pl-4 pr-24 focus:outline-none focus:border-[#FF6600] transition-all duration-300 resize-none placeholder:text-zinc-600 text-sm ${
              isListening ? 'ring-2 ring-[#FF6600]/40 border-[#FF6600]/60 shadow-[0_0_20px_rgba(255,102,0,0.1)]' : ''
            }`}
            disabled={isLoading}
          />
          
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isListening 
                  ? 'bg-red-600/20 text-red-500 border border-red-500 animate-pulse' 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-transparent'
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isListening ? (
                  // Stop icon
                  <rect x="6" y="6" width="12" height="12" rx="2" strokeWidth="2.5" />
                ) : (
                  // Microphone icon
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                )}
              </svg>
            </button>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-lg bg-[#FF6600] text-black hover:bg-[#e55c00] disabled:bg-zinc-800 disabled:text-zinc-600 transition-all shadow-[0_0_15px_rgba(255,102,0,0.2)] active:scale-95"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </form>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
            Automotive Intelligence Only
          </p>
          {isListening && (
            <div className="flex items-center gap-1.5">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
              </span>
              <span className="text-[10px] text-red-500 font-black uppercase tracking-tighter">Live Diagnostic Audio Capture</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
