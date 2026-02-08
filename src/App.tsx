import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import VehicleContextPanel from './components/VehicleContextPanel';
import { useJobCard } from './hooks/useJobCard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

// 🔒 Protected Route Component
const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

// 🏗️ The "Claude-like" Workspace Layout
const WorkspaceLayout = () => {
  const [{ jobCard }] = useJobCard(); // Listen to global job card state
  const [isArtifactManuallyOpen, setArtifactOpen] = useState(false);

  // Auto-open artifact panel if we have active job data OR user toggled it
  const showArtifacts = isArtifactManuallyOpen || (jobCard !== null);

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden">
      {/* 1. Sidebar (Fixed Left) */}
      <Sidebar />

      {/* 2. Main Chat Area (Flexible Center) */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-[#131313]">
        <Outlet /> 
      </main>

      {/* 3. Artifacts Panel (Collapsible Right) */}
      {showArtifacts && (
        <aside className="w-[450px] border-l border-border bg-surface shadow-2xl transition-all duration-300 flex flex-col">
           {/* You can add a close button handler here if needed */}
           <VehicleContextPanel />
        </aside>
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/app" replace />} />

          {/* 🔒 Protected Workspace Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<WorkspaceLayout />}>
              <Route index element={<ChatPage />} />
              <Route path="chats" element={<ChatPage />} />
              <Route path="projects" element={<ChatPage />} />
              <Route path="pricing" element={<PricingPage />} />
              {/* Add more protected routes here (e.g. /app/settings) */}
            </Route>
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
