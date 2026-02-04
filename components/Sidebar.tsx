import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onNewChat }) => {
  return (
    <div className={`${isOpen ? 'w-64' : 'w-0 md:w-16'} flex-shrink-0 bg-[#0A0A0A] border-r border-[#1a1a1a] transition-all duration-300 flex flex-col overflow-hidden relative z-50`}>
      <div className="p-4 flex items-center justify-between">
        <button onClick={onToggle} className="p-2 text-zinc-400 hover:text-[#f18a22] hover:bg-[#1a1a1a] rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        {isOpen && <span className="text-[10px] font-black tracking-widest text-[#f18a22] uppercase">EKA AI</span>}
      </div>
      <div className="px-3 mb-6">
        <button onClick={onNewChat} className={`flex items-center gap-3 w-full bg-[#1a1a1a] hover:bg-[#252525] text-zinc-300 hover:text-[#f18a22] border border-transparent hover:border-[#f18a22]/30 px-4 py-3 rounded-full transition-all group ${!isOpen && 'justify-center px-0'}`}>
            <span className="text-xl">+</span>
            {isOpen && <span className="text-sm font-medium">New Chat</span>}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        {isOpen && (
            <div className="space-y-4">
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2">Recent</div>
                {['MG Validation - Fleet 01', 'DTC Error P0300', 'Job Card #9921'].map((item, i) => (
                    <button key={i} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-[#1a1a1a] hover:text-white transition-colors truncate">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        <span className="truncate">{item}</span>
                    </button>
                ))}
            </div>
        )}
      </div>
      <div className="p-4 border-t border-[#1a1a1a]">
        <button className={`flex items-center gap-3 w-full text-zinc-400 hover:text-white transition-colors ${!isOpen && 'justify-center'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {isOpen && <span>Settings</span>}
        </button>
      </div>
    </div>
  );
};
export default Sidebar;
