import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';
import ProjectsPage from './pages/ProjectsPage';
import ArtifactsPage from './pages/ArtifactsPage';
import SettingsPage from './pages/SettingsPage';
import ChatsPage from './pages/ChatsPage';

const App = () => {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#fafaf9]">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/artifacts" element={<ArtifactsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
