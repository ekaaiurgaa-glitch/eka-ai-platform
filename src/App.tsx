import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';
import VehicleContextPanel from './components/VehicleContextPanel';
import { useJobCard } from './hooks/useJobCard';
import { VehicleContext } from './types';

// The "Claude-like" Workspace Layout with 3 columns
const WorkspaceLayout = () => {
  const [state, actions] = useJobCard();
  const [isArtifactManuallyOpen, setArtifactOpen] = useState(false);

  // Auto-open artifact panel if we have active job data OR user toggled it
  const showArtifacts = isArtifactManuallyOpen || (state.jobCard !== null);

  // Handle vehicle context updates from the panel
  const handleVehicleUpdate = (updated: VehicleContext) => {
    actions.setVehicleData(updated);
  };

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden">
      {/* 1. Sidebar (Fixed Left) */}
      <Sidebar />

      {/* 2. Main Chat Area (Flexible Center) */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-[#131313]">
        <Outlet />
      </main>

      {/* 3. Artifacts Panel (Collapsible Right) */}
      {showArtifacts && state.vehicleData && (
        <aside className="w-[450px] border-l border-border bg-surface shadow-2xl transition-all duration-300 flex flex-col overflow-y-auto">
          <VehicleContextPanel 
            context={state.vehicleData}
            onUpdate={handleVehicleUpdate}
            onScanRecalls={() => console.log('Scan recalls')}
          />
        </aside>
      )}
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to app immediately */}
        <Route path="/" element={<Navigate to="/app" replace />} />

        {/* Protected Workspace Routes */}
        <Route path="/app" element={<WorkspaceLayout />}>
          <Route index element={<ChatPage />} />
          <Route path="chats" element={<ChatPage />} />
          <Route path="projects" element={<ChatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
