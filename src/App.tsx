import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';
import ProjectsPage from './pages/ProjectsPage';
import ArtifactsPage from './pages/ArtifactsPage';
import SettingsPage from './pages/SettingsPage';
import ChatsPage from './pages/ChatsPage';
import LandingPage from './pages/LandingPage';
import ClockDemoPage from './pages/ClockDemoPage';
import WorldClockPage from './pages/WorldClockPage';

// New Pages for Production v4.5
import JobCardsPage from './pages/JobCardsPage';
import InvoicesPage from './pages/InvoicesPage';
import MGFleetPage from './pages/MGFleetPage';
import PublicApprovalPage from './pages/PublicApprovalPage';

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
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/customer-approval" element={<PublicApprovalPage />} />

        {/* Protected Dashboard Routes */}
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<ChatPage />} /> {/* /app (default) renders ChatPage */}
          <Route path="chats" element={<ChatsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="artifacts" element={<ArtifactsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="clock" element={<ClockDemoPage />} />
          <Route path="worldclock" element={<WorldClockPage />} />
          
          {/* New Routes for v4.5 */}
          <Route path="job-cards" element={<JobCardsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="mg-fleet" element={<MGFleetPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
