import React, { useState } from 'react';
import { Plus, FileText, CheckSquare, BarChart3, Calculator, Car } from 'lucide-react';

const ArtifactsPage = () => {
  // Tab state - content filtering to be implemented when user artifacts data is available
  const [activeTab, setActiveTab] = useState('inspiration');

  return (
    <main className="flex-1 overflow-y-auto bg-[#fafaf9] h-screen">
      <div className="max-w-6xl mx-auto px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-4xl text-gray-900">Artifacts</h1>
          <button className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={16} />
            New artifact
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
          <button 
            onClick={() => setActiveTab('inspiration')}
            className={`pb-3 text-sm transition-colors ${activeTab === 'inspiration' ? 'text-gray-900 border-b-2 border-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Inspiration
          </button>
          <button 
            onClick={() => setActiveTab('yours')}
            className={`pb-3 text-sm transition-colors ${activeTab === 'yours' ? 'text-gray-900 border-b-2 border-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Your artifacts
          </button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['All', 'Diagnostics', 'Reports', 'Compliance', 'Estimates', 'Fleet Tools'].map((cat, idx) => (
            <button key={cat} className={`px-4 py-2 rounded-full text-sm transition-colors border ${idx === 0 ? 'bg-gray-100 border-transparent text-gray-900 font-medium' : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ArtifactCard 
            title="Job Card Writer" 
            desc="Generate professional job cards with estimates"
            icon={<FileText className="text-orange-500" />}
            color="bg-orange-50"
          />
          <ArtifactCard 
            title="PDI Checklist Generator" 
            desc="Create comprehensive PDI lists with photo evidence"
            icon={<CheckSquare className="text-blue-500" />}
            color="bg-blue-50"
          />
          <ArtifactCard 
            title="Fleet Report Builder" 
            desc="Generate MG contract reports and analytics"
            icon={<BarChart3 className="text-purple-500" />}
            color="bg-purple-50"
          />
          <ArtifactCard 
            title="Estimate Generator" 
            desc="Create GST-compliant estimates"
            icon={<Calculator className="text-teal-500" />}
            color="bg-teal-50"
          />
          <ArtifactCard 
            title="Vehicle Comparison" 
            desc="Compare vehicles for fleet procurement"
            icon={<Car className="text-indigo-500" />}
            color="bg-indigo-50"
          />
        </div>
      </div>
    </main>
  );
};

const ArtifactCard = ({ title, desc, icon, color }: { title: string, desc: string, icon: React.ReactNode, color: string }) => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1">
    <div className={`aspect-[4/3] ${color} p-6 flex items-center justify-center`}>
      <div className="bg-white p-4 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
        {icon}
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  </div>
);

export default ArtifactsPage;
