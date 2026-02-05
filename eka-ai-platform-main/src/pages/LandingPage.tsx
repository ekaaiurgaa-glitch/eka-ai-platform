import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Play, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#fafaf9]">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-green rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">G4</div>
              <span className="font-serif font-bold text-gray-900 text-lg">EKA-AI</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/app')} className="text-sm font-medium text-gray-900 hover:text-brand-purple">Sign In</button>
              <button onClick={() => navigate('/app')} className="bg-gradient-to-r from-brand-purple to-brand-green text-white text-sm font-medium px-6 py-2.5 rounded-full hover:shadow-lg transition-transform hover:-translate-y-0.5">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
          <div className="max-w-md mx-auto w-full space-y-8">
            <div>
              <h1 className="font-serif text-4xl xl:text-5xl text-gray-900 leading-tight mb-4">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-green">EKA-AI</span>
              </h1>
              <p className="text-gray-600 text-lg">Governed Automobile Intelligence for modern workshops.</p>
            </div>
            <div className="flex gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600"><Shield size={12}/> SOC 2 Compliant</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600"><Lock size={12}/> Encrypted</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xl">
              <div className="text-center mb-6"><h3 className="text-lg font-semibold text-gray-900">Access Your Workshop</h3></div>
              <button onClick={() => navigate('/app')} className="w-full px-4 py-3 bg-brand-purple text-white font-semibold rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2">
                Enter Dashboard <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex w-1/2 bg-[#1a1a2e] items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 bg-brand-purple rounded-full blur-3xl opacity-20"></div>
          <div className="relative w-full max-w-lg aspect-video bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 flex items-center justify-center group cursor-pointer">
            <Play size={24} className="text-white fill-current ml-1" />
          </div>
        </div>
      </main>
    </div>
  );
};
export default LandingPage;
