import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import JobCardsPage from './pages/JobCardsPage';
import MGFleetPage from './pages/MGFleetPage';
import InvoicesPage from './pages/InvoicesPage';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';
import PricingPage from './pages/PricingPage';
import LegalPage from './pages/LegalPage';
import PublicApprovalPage from './pages/PublicApprovalPage';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// ═══════════════════════════════════════════════════════════════
// PROTECTED ROUTE WRAPPER
// ═══════════════════════════════════════════════════════════════

const ProtectedRoute: React.FC = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-zinc-500 text-sm">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

// ═══════════════════════════════════════════════════════════════
// PUBLIC ROUTE WRAPPER (Redirects if already logged in)
// ═══════════════════════════════════════════════════════════════

const PublicRoute: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};

// ═══════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════════

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ═══════════════════════════════════════════════════════
              PUBLIC ROUTES
          ═══════════════════════════════════════════════════════ */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Legal Pages (Public) */}
          <Route path="/legal/:type" element={<LegalPage />} />
          
          {/* Public Approval (No Auth Required) */}
          <Route path="/approve" element={<PublicApprovalPage />} />

          {/* ═══════════════════════════════════════════════════════
              PROTECTED ROUTES (Requires Authentication)
          ═══════════════════════════════════════════════════════ */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<MainLayout />}>
              {/* Default Route - Dashboard */}
              <Route index element={<DashboardPage />} />
              
              {/* Dashboard */}
              <Route path="dashboard" element={<DashboardPage />} />
              
              {/* AI Diagnostics / Chat */}
              <Route path="diagnostics" element={<ChatPage />} />
              <Route path="chats" element={<ChatPage />} />
              
              {/* Job Cards */}
              <Route path="job-cards" element={<JobCardsPage />} />
              <Route path="job-cards/new" element={<JobCardsPage />} />
              <Route path="job-cards/:id" element={<JobCardsPage />} />
              
              {/* PDI */}
              <Route path="pdi" element={<ChatPage />} />
              <Route path="pdi/:id" element={<ChatPage />} />
              
              {/* Fleet Management */}
              <Route path="fleet" element={<MGFleetPage />} />
              <Route path="fleet/mg" element={<MGFleetPage />} />
              
              {/* Invoices */}
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="invoices/new" element={<InvoicesPage />} />
              
              {/* Settings */}
              <Route path="settings" element={<SettingsPage />} />
              
              {/* Pricing / Upgrade */}
              <Route path="pricing" element={<PricingPage />} />
              
              {/* Scan VIN */}
              <Route path="scan" element={<ChatPage />} />
            </Route>
          </Route>

          {/* ═══════════════════════════════════════════════════════
              REDIRECTS
          ═══════════════════════════════════════════════════════ */}
          
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/app" replace />} />
          
          {/* Catch all - 404 */}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
