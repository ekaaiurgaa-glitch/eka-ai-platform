import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';

// Placeholder Pages
const Projects = () => <div className="p-10 font-serif text-2xl">Projects (Coming Soon)</div>;
const Artifacts = () => <div className="p-10 font-serif text-2xl">Artifacts (Coming Soon)</div>;
const Settings = () => <div className="p-10 font-serif text-2xl">Settings (Coming Soon)</div>;

const App = () => {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#fafaf9]">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/artifacts" element={<Artifacts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
