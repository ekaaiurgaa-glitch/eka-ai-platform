import React, { useState } from 'react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <main className="flex-1 flex h-screen bg-[#fafaf9] overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-[#fafaf9] flex flex-col pt-8 pb-4 overflow-y-auto">
        <h1 className="font-serif text-2xl text-gray-900 px-6 mb-8">Settings</h1>
        <div className="space-y-1 px-3">
          {['General', 'Account', 'Privacy', 'Billing', 'Capabilities'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.toLowerCase() ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-12">
        <div className="max-w-2xl">
          {activeTab === 'general' && (
            <div className="space-y-12">
              {/* Profile */}
              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-green rounded-full flex items-center justify-center text-white font-bold">G</div>
                      <input type="text" defaultValue="Go4Garage" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-purple outline-none">
                      <option>Workshop Owner</option>
                      <option>Service Manager</option>
                      <option>Technician</option>
                    </select>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Appearance */}
              <section className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['Light', 'Dark', 'System'].map((theme) => (
                      <div key={theme} className={`cursor-pointer border-2 rounded-xl p-4 ${theme === 'Light' ? 'border-brand-purple bg-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{theme}</span>
                          {theme === 'Light' && <div className="w-2 h-2 bg-brand-purple rounded-full"></div>}
                        </div>
                        <div className="h-10 bg-gray-100 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}
          
          {activeTab !== 'general' && (
            <div className="text-center py-20 text-gray-500">
              <p>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default SettingsPage;
