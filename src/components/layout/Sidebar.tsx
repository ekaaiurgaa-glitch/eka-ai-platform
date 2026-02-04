import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, FolderOpen, PenTool, Code, Plus, ChevronUp, Clock } from 'lucide-react';

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
          <div className="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-green rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
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
        {/* Note: Home is the active chat interface, Chats is the history list */}
        <NavItem to="/app/chats" icon={<MessageSquare size={18} />} label="Chats" />
        <NavItem to="/app/projects" icon={<FolderOpen size={18} />} label="Projects" />
        <NavItem to="/app/artifacts" icon={<PenTool size={18} />} label="Artifacts" />
        <NavItem to="/app/settings" icon={<Code size={18} />} label="Settings" />
        
        <div className="mt-6 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
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
  <NavLink to={to} className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
    {icon}
    {label}
  </NavLink>
);

const RecentItem = ({ label }: { label: string }) => (
  <div className="group flex items-center gap-2 px-3 py-2 text-sm text-gray-600 truncate hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
    <Clock size={12} className="text-gray-400 group-hover:text-brand-purple" />
    <span className="truncate">{label}</span>
  </div>
);

export default Sidebar;
