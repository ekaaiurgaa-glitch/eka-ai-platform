import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';
import ProjectsPage from './pages/ProjectsPage';
import ArtifactsPage from './pages/ArtifactsPage';
import SettingsPage from './pages/SettingsPage';
import ChatsPage from './pages/ChatsPage';
import LandingPage from './pages/LandingPage';

// Layout wrapper for the Dashboard (Sidebar + Page Content)
const DashboardLayout = () => (
  <div className="flex h-screen bg-[#fafaf9]">
    <Sidebar />
    <Outlet /> {/* This renders the child route (Chat, Projects, etc.) */}
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected Dashboard Routes */}
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<ChatPage />} /> {/* /app goes to Chat */}
          <Route path="chats" element={<ChatsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="artifacts" element={<ArtifactsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
