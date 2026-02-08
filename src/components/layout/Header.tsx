import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-16 bg-[#18181b]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search vehicles, customers, job cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-black/30 border border-white/5 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 text-sm"
          />
        </div>
      </form>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm font-semibold text-black">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white">{user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-xs text-gray-500">Workshop Admin</p>
            </div>
          </button>

          {/* Dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-48 glass-panel rounded-xl py-2 shadow-xl border border-white/10">
              <button
                onClick={() => { navigate('/app/profile'); setShowProfile(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5"
              >
                Profile
              </button>
              <button
                onClick={() => { navigate('/app/settings'); setShowProfile(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5"
              >
                Settings
              </button>
              <hr className="my-2 border-white/5" />
              <button
                onClick={() => { signOut(); setShowProfile(false); }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
