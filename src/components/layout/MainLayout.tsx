import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistantChatWindow from '../features/ai/AIAssistantChatWindow';
import Button from '../shared/Button';

/**
 * MainLayout Component
 * 
 * The main application layout that wraps all protected routes.
 * Includes Sidebar, Header, main content area, and the floating AI Assistant.
 */
export default function MainLayout() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="h-screen flex bg-[#09090b] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Assistant Button */}
      {!isChatOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsChatOpen(true)}
            leftIcon={<MessageCircle className="w-5 h-5" />}
            className="shadow-lg shadow-orange-500/25 rounded-full px-6"
          >
            AI Assistant
          </Button>
        </div>
      )}

      {/* AI Chat Window */}
      <AIAssistantChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
