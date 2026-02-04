import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';
import ProjectsPage from './pages/ProjectsPage';
import ArtifactsPage from './pages/ArtifactsPage';

// Placeholder for Settings (We will implement this next)
const Settings = () => <div className="p-10 font-serif text-2xl">Settings (Coming Soon)</div>;

const App = () => {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#fafaf9]">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/artifacts" element={<ArtifactsPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
