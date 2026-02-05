import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, FolderOpen, PenTool, Code, Plus, 
  ChevronUp, Clock, Car, FileText, Truck, ClipboardCheck
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleNewChat = () => {
    navigate('/app');
  };

  return (
    <aside className="hidden md:flex w-64 bg-[#fafaf9] border-r border-gray-200 flex-col h-screen flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-[#f18a22] to-[#d67a1a] rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
            G4
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm tracking-tight">EKA-AI</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Governed Intelligence</p>
          </div>
        </div>
        
        <button onClick={handleNewChat} className="w-full bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow">
          <Plus size={14} />
          New chat
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {/* AI & Chat */}
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          AI Intelligence
        </div>
        <NavItem to="/app/chats" icon={<MessageSquare size={18} />} label="Chats" />
        <NavItem to="/app/projects" icon={<FolderOpen size={18} />} label="Projects" />
        <NavItem to="/app/artifacts" icon={<PenTool size={18} />} label="Artifacts" />
        
        {/* Workshop Management */}
        <div className="mt-4 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Workshop
        </div>
        <NavItem to="/app/job-cards" icon={<Car size={18} />} label="Job Cards" />
        <NavItem to="/app/invoices" icon={<FileText size={18} />} label="Invoices" />
        <NavItem to="/app/mg-fleet" icon={<Truck size={18} />} label="MG Fleet" />
        
        {/* Settings */}
        <div className="mt-4 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          System
        </div>
        <NavItem to="/app/settings" icon={<Code size={18} />} label="Settings" />
        
        {/* Recents */}
        <div className="mt-4 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          Recents
        </div>
        <div className="space-y-1">
           <RecentItem label="Fortuner brake diagnosis" />
           <RecentItem label="MG Contract Analysis" />
           <RecentItem label="PDI Checklist - Swift" />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white/50">
        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white text-sm font-bold">G</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">Go4Garage</div>
            <div className="text-xs text-gray-500">Pro Plan</div>
          </div>
          <ChevronUp size={14} className="text-gray-400" />
        </div>
      </div>
    </aside>
  );
};

const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-[#f18a22]/10 text-[#f18a22]' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    {icon}
    {label}
  </NavLink>
);

const RecentItem = ({ label }: { label: string }) => (
  <div className="group flex items-center gap-2 px-3 py-2 text-sm text-gray-600 truncate hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
    <Clock size={12} className="text-gray-400 group-hover:text-[#f18a22]" />
    <span className="truncate">{label}</span>
  </div>
);

export default Sidebar;
