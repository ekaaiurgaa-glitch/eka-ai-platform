import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  Wrench, 
  ClipboardCheck,
  Truck,
  FileText,
  Settings,
  Zap
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
  { icon: Wrench, label: 'Job Cards', path: '/app/job-cards' },
  { icon: ClipboardCheck, label: 'PDI Checklist', path: '/app/pdi' },
  { icon: Truck, label: 'Fleet Mgmt', path: '/app/fleet' },
  { icon: FileText, label: 'Invoices', path: '/app/invoices' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-64 h-full bg-[#18181b] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-bold text-black">
            E
          </div>
          <span className="text-xl font-bold text-white">
            EKA<span className="text-orange-500">AI</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-item w-full ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Upgrade CTA */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-white">Pro Plan</span>
          </div>
          <p className="text-xs text-gray-500 mb-3">Unlock unlimited AI diagnostics</p>
          <button 
            onClick={() => navigate('/app/pricing')}
            className="w-full py-2 text-xs font-medium text-orange-500 bg-orange-500/10 rounded-lg hover:bg-orange-500/20 transition-colors"
          >
            Upgrade
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => navigate('/app/settings')}
          className="nav-item w-full"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
