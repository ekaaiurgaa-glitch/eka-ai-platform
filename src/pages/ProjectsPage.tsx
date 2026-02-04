import React, { useState } from 'react';
import { Plus, Search, ChevronDown, FolderOpen } from 'lucide-react';

const ProjectsPage = () => {
  // Search term state - filtering logic to be implemented when project data is available
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <main className="flex-1 overflow-y-auto bg-[#fafaf9] h-screen">
      <div className="max-w-5xl mx-auto px-8 py-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-4xl text-gray-900">Projects</h1>
          <button className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={16} />
            New project
          </button>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all text-lg bg-white"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-end mb-12">
          <span className="text-sm text-gray-500 mr-3">Sort by</span>
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:border-brand-purple cursor-pointer hover:border-gray-400 transition-colors">
              <option>Activity</option>
              <option>Name</option>
              <option>Date created</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <FolderOpen size={64} className="text-brand-purple opacity-50" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-3">Looking to start a project?</h2>
          <p className="text-gray-500 max-w-md mb-8 text-base leading-relaxed">
            Upload materials, set custom instructions, and organize conversations in one space.
          </p>

          <button className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all hover:shadow-sm">
            <Plus size={16} />
            New project
          </button>
        </div>

      </div>
    </main>
  );
};

export default ProjectsPage;
