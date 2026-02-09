import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Send, Bot, User, Sparkles, Paperclip, 
  MoreVertical, Trash2, Download, Loader2 
} from 'lucide-react';
import Button from '../../shared/Button';
import { ChatMessage, MessageRole } from '../../../types/api.types';

interface AIAssistantChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  jobCardId?: string;
  initialMessage?: string;
  context?: {
    registrationNumber?: string;
    brand?: string;
    model?: string;
  };
}

/**
 * AIAssistantChatWindow Component
 * 
 * A self-contained, floating AI chat interface that manages its own state
 * for messages, input, and typing indicators. Can be toggled open/closed.
 * 
 * Features:
 * - Scrollable message history
 * - Visual distinction between user and assistant messages
 * - Typing indicator simulation
 * - Message persistence during session
 * - Quick action suggestions
 * 
 * @example
 * <AIAssistantChatWindow
 *   isOpen={isChatOpen}
 *   onClose={() => setIsChatOpen(false)}
 *   jobCardId="jb-123"
 *   context={{ registrationNumber: 'MH01AB1234', brand: 'Maruti' }}
 * />
 */
const AIAssistantChatWindow: React.FC<AIAssistantChatWindowProps> = ({
  isOpen,
  onClose,
  jobCardId,
  initialMessage,
  context
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeContent = context?.registrationNumber
        ? `Hello! I'm your AI assistant for job card ${context.registrationNumber}. How can I help you with this vehicle today?`
        : initialMessage || "Hello! I'm your EKA-AI assistant. How can I help you with your workshop tasks today?";

      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeContent,
          timestamp: new Date().toISOString(),
          domain_gate_passed: true,
          confidence_score: 1.0
        }
      ]);
    }
  }, [isOpen, context, initialMessage, messages.length]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      // Simulate API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      // Mock AI response
      const responses = [
        "I've analyzed the symptoms you described. Based on the vehicle history, this could be related to the fuel injection system. Would you like me to generate a diagnostic report?",
        "I can help you create an estimate for this repair. Based on similar cases, the cost would likely be between ₹8,000-12,000 including parts and labor.",
        "The PDI checklist for this vehicle shows all critical items have been verified. You can proceed with invoicing.",
        "I've checked the MG contract details. The current odometer reading is within the assured kilometers, so this will be fully covered.",
      ];

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString(),
        confidence_score: 0.92 + Math.random() * 0.08,
        domain_gate_passed: true,
        job_card_id: jobCardId
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        confidence_score: 0
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  }, [inputValue, isLoading, jobCardId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
  };

  const suggestions = [
    "Generate a repair estimate",
    "Check PDI status",
    "Analyze diagnostic codes",
    "Review vehicle service history",
    "Calculate MG fleet billing",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Chat Window */}
      <div 
        className="relative w-full max-w-md h-[600px] bg-[#0f0f0f] rounded-2xl shadow-2xl border border-white/10 pointer-events-auto flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-600/20 to-orange-500/10 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">EKA AI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-gray-400">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={clearChat}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-orange-400" />
              </div>
              <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-white/5">
            <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-xs bg-white/5 text-gray-300 rounded-full hover:bg-orange-500/20 hover:text-orange-400 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                className="w-full px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500/50 resize-none min-h-[48px] max-h-32"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
              <button 
                className="absolute right-3 bottom-3 p-1 text-gray-500 hover:text-gray-300"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleSendMessage}
              isLoading={isLoading}
              disabled={!inputValue.trim()}
              className="flex-shrink-0 h-12 w-12 !p-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual Message Bubble Component
 */
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
        ${isUser ? 'bg-indigo-500/20' : 'bg-orange-500/20'}
      `}>
        {isUser ? (
          <User className="w-4 h-4 text-indigo-400" />
        ) : (
          <Bot className="w-4 h-4 text-orange-400" />
        )}
      </div>

      {/* Message Content */}
      <div className={`
        max-w-[75%] rounded-2xl px-4 py-3
        ${isUser 
          ? 'bg-indigo-600 text-white rounded-tr-sm' 
          : 'bg-white/5 text-gray-200 rounded-tl-sm'
        }
      `}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        
        {/* Metadata */}
        <div className={`flex items-center gap-2 mt-2 text-xs ${isUser ? 'text-indigo-200' : 'text-gray-500'}`}>
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isAssistant && message.confidence_score && (
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {Math.round(message.confidence_score * 100)}% confident
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistantChatWindow;
