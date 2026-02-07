import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Truck, Settings, PenTool, Database } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="w-[260px] bg-[#191919] flex flex-col h-full border-r border-border p-3 flex-shrink-0 sidebar">
      {/* Brand */}
      <div className="mb-6 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <span className="text-white">EKA</span>
          <span className="text-brand-orange">AI</span>
        </div>
      </div>

      {/* New Chat Action */}
      <button 
        onClick={() => navigate('/app')}
        className="flex items-center gap-2 bg-surface hover:bg-[#333] text-white p-3 rounded-lg text-sm font-medium transition-colors border border-border mb-6 group"
      >
        <Plus size={16} className="text-gray-400 group-hover:text-white" />
        <span>Start new chat</span>
      </button>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto space-y-1">
        <div className="text-xs font-semibold text-text-muted uppercase px-3 py-2">Your Garage</div>
        
        <NavItem icon={<MessageSquare size={18} />} label="Diagnostics" active />
        <NavItem icon={<PenTool size={18} />} label="Job Cards" />
        <NavItem icon={<Truck size={18} />} label="Fleet Mgmt" />
        <NavItem icon={<Database size={18} />} label="Inventory" />

        <div className="text-xs font-semibold text-text-muted uppercase px-3 py-2 mt-6">Recent Chats</div>
        <RecentItem label="MH02 Fortuner Brake Noise" />
        <RecentItem label="Honda City Service 40k" />
        <RecentItem label="Creta AC Cooling Issue" />
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 hover:bg-[#252525] rounded-md cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-orange to-red-500 flex items-center justify-center text-white font-bold text-xs">
            G4
          </div>
          <div className="text-sm">
            <div className="font-medium text-text-primary">Go4Garage</div>
            <div className="text-xs text-text-secondary">Pro Plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <div className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${active ? 'bg-[#2a2a2a] text-white' : 'text-text-secondary hover:bg-[#252525] hover:text-text-primary'}`}>
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

const RecentItem = ({ label }: { label: string }) => (
  <div className="group flex items-center gap-2 px-3 py-2 text-sm text-text-secondary truncate hover:bg-[#252525] hover:text-text-primary rounded-md cursor-pointer transition-colors">
    <span className="truncate">{label}</span>
  </div>
);

export default Sidebar;
