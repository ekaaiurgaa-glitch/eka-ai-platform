import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Zap, ChevronRight, Play } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login flow
    navigate('/app');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#fafaf9]">
      
      {/* Navbar */}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row">
        
        {/* Left: Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
          <div className="max-w-md mx-auto w-full space-y-8">
            <div>
              <h1 className="font-serif text-4xl xl:text-5xl text-gray-900 leading-tight mb-4">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-green">EKA-AI</span>
              </h1>
              <p className="text-gray-600 text-lg">Governed Automobile Intelligence for modern workshops.</p>
            </div>

            <div className="flex gap-3">
              <Badge icon={<Shield size={12} />} text="SOC 2 Compliant" />
              <Badge icon={<Lock size={12} />} text="End-to-End Encrypted" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xl">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Access Your Workshop</h3>
              </div>
              
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 mb-4 transition-colors">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="relative my-6 text-center text-sm text-gray-500">
                <span className="bg-white px-2 relative z-10">or continue with email</span>
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input type="email" placeholder="workshop@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-transparent outline-none" required />
                </div>
                <button type="submit" className="w-full px-4 py-3 bg-brand-purple text-white font-semibold rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2">
                  Send Magic Link <ChevronRight size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: Demo Visual */}
        <div className="hidden lg:flex w-1/2 bg-[#1a1a2e] items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 bg-brand-purple rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-brand-green rounded-full blur-3xl opacity-20"></div>
          
          <div className="relative w-full max-w-lg aspect-video bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 flex items-center justify-center group cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
              <div>
                <h3 className="text-white font-semibold text-xl mb-2">See EKA-AI in Action</h3>
                <p className="text-gray-300 text-sm">Automated Job Cards & AI Diagnostics</p>
              </div>
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play size={24} className="text-white fill-current ml-1" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Badge = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600">
    {icon} {text}
  </span>
);

export default LandingPage;
