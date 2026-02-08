import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  MessageSquare, 
  Wrench,
  Truck, 
  FileText,
  ClipboardCheck,
  Settings,
  Zap,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  onNavigate?: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  active?: boolean;
  badge?: string | number;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, path, active, badge, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
        ${active 
          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
        }
      `}
    >
      <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className={`
          px-2 py-0.5 text-xs rounded-full font-semibold
          ${active ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}
        `}>
          {badge}
        </span>
      )}
      {active && (
        <ChevronRight size={14} className="text-orange-400/50" />
      )}
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentPath = location.pathname;

  const handleNavigate = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const mainNavItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/app', badge: undefined },
    { icon: <MessageSquare size={18} />, label: 'AI Diagnostics', path: '/app/diagnostics', badge: undefined },
    { icon: <Wrench size={18} />, label: 'Job Cards', path: '/app/job-cards', badge: 12 },
    { icon: <ClipboardCheck size={18} />, label: 'PDI Checklist', path: '/app/pdi', badge: 5 },
    { icon: <Truck size={18} />, label: 'Fleet Mgmt', path: '/app/fleet', badge: undefined },
    { icon: <FileText size={18} />, label: 'Invoices', path: '/app/invoices', badge: 7 },
  ];

  const secondaryNavItems = [
    { icon: <Settings size={18} />, label: 'Settings', path: '/app/settings' },
  ];

  return (
    <aside 
      className={`
        h-full w-[280px] glass-panel-elevated border-r border-white/[0.06] 
        flex flex-col flex-shrink-0 transition-all duration-300
      `}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-xl font-bold text-white">E</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              EKA<span className="text-orange-400">AI</span>
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
              Command Center
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Primary Nav */}
        <div className="space-y-1">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              Operations
            </span>
          </div>
          {mainNavItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              active={currentPath === item.path || currentPath.startsWith(`${item.path}/`)}
              badge={item.badge}
              onClick={() => handleNavigate(item.path)}
            />
          ))}
        </div>

        {/* Recent Activity (Mock) */}
        <div className="space-y-1">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              Recent
            </span>
          </div>
          <button
            onClick={() => handleNavigate('/app/job-cards/JC-2026-0042')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
          >
            <p className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate">
              Fortuner Brake Service
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">MH02-AB-1234</p>
          </button>
          <button
            onClick={() => handleNavigate('/app/job-cards/JC-2026-0041')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
          >
            <p className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate">
              Honda City AC Repair
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">MH01-CD-5678</p>
          </button>
        </div>

        {/* Secondary Nav */}
        <div className="space-y-1">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              System
            </span>
          </div>
          {secondaryNavItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              active={currentPath === item.path}
              onClick={() => handleNavigate(item.path)}
            />
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="glass-card p-4 relative overflow-hidden group cursor-pointer hover:border-orange-500/30 transition-colors">
          {/* Glow effect */}
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/30 transition-colors" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-orange-400 fill-orange-400" />
              <span className="text-sm font-semibold text-white">Pro Plan</span>
            </div>
            <p className="text-xs text-zinc-500 mb-3">
              Unlock unlimited AI diagnostics and priority support.
            </p>
            <button 
              onClick={() => handleNavigate('/app/pricing')}
              className="w-full py-2 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-white border border-zinc-600">
            G4
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-300 truncate">Go4Garage</p>
            <p className="text-xs text-zinc-600">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
