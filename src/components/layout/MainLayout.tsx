import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  User,
  ChevronDown,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [workshopStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-16 glass-panel-elevated border-b border-white/[0.06] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Workshop Status */}
        <div className="hidden sm:flex items-center gap-2">
          <span className={`status-indicator ${workshopStatus === 'OPEN' ? 'status-online' : 'status-offline'}`}>
            {workshopStatus === 'OPEN' ? 'Workshop Open' : 'Workshop Closed'}
          </span>
        </div>
      </div>

      {/* Center - Search */}
      <div className="hidden md:flex flex-1 max-w-xl mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search job cards, invoices, or customers..."
            className="w-full bg-zinc-950/50 border border-white/[0.06] rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-zinc-600 bg-zinc-900 rounded border border-zinc-800">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Upgrade Badge */}
        <button 
          onClick={() => navigate('/app/pricing')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full hover:bg-orange-500/20 transition-colors"
        >
          <Zap size={12} className="fill-orange-400" />
          Pro Plan
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-white/[0.06] transition-colors">
          <Bell size={20} className="text-zinc-400" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <ChevronDown size={16} className="text-zinc-500 hidden sm:block" />
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 glass-panel-elevated rounded-xl border border-white/[0.06] shadow-2xl z-50 animate-fade-in-scale">
                <div className="p-3 border-b border-white/[0.06]">
                  <p className="text-sm font-medium text-zinc-200">{user?.email}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Go4Garage Workshop</p>
                </div>
                <div className="p-1.5">
                  <button 
                    onClick={() => { navigate('/app/settings'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    <User size={16} />
                    Profile
                  </button>
                  <button 
                    onClick={() => { navigate('/app/settings'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                </div>
                <div className="p-1.5 border-t border-white/[0.06]">
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="h-screen w-screen bg-gradient-mesh flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isMobile ? 'fixed' : 'relative'}
          transition-transform duration-300 ease-in-out z-50
        `}
      >
        <Sidebar onNavigate={() => isMobile && setIsSidebarOpen(false)} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen}
        />
        
        <main className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
