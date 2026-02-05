import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare, MoreHorizontal } from 'lucide-react';

const ChatsPage = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Mock Data (Replace with API later)
  const chats = [
    { id: 1, title: "Fortuner brake diagnosis and repair estimate", date: "2 days ago" },
    { id: 2, title: "MG Contract Q1 2025 fleet analysis report", date: "1 week ago" },
    { id: 3, title: "PDI Checklist - New Swift delivery preparation", date: "2 weeks ago" },
    { id: 4, title: "Vehicle loan procedural compliance audit", date: "1 month ago" },
    { id: 5, title: "सिविल कोर्ट में अनावश्यक देरी से बचाव", date: "2 months ago" },
  ];

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="flex-1 overflow-y-auto bg-[#fafaf9] h-screen">
      <div className="max-w-4xl mx-auto px-8 py-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-4xl text-gray-900">Chats</h1>
          <button onClick={() => navigate('/app')} className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <MessageSquare size={16} />
            New chat
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search your chats..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all text-lg bg-white"
          />
        </div>

        {/* List */}
        <div className="space-y-1">
          {filteredChats.map((chat) => (
            <div key={chat.id} className="group flex items-center justify-between p-4 -mx-4 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => navigate('/app')}>
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-1 group-hover:text-brand-purple transition-colors">{chat.title}</h3>
                <p className="text-sm text-gray-500">Last message {chat.date}</p>
              </div>
              <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-600 transition-opacity">
                <MoreHorizontal size={18} />
              </button>
            </div>
          ))}
          {filteredChats.length === 0 && (
            <div className="text-center py-12 text-gray-500">No chats found matching "{search}"</div>
          )}
        </div>

      </div>
    </main>
  );
};

export default ChatsPage;
