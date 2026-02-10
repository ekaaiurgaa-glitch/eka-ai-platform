import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import VideoScroller from '../components/VideoScroller';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'LOGIN') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Show greeting toast
        const greeting = getGreeting();
        alert(`${greeting} from the Go4Garage Family!`);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
              role: 'OWNER',
            },
          },
        });
        if (error) throw error;
        setError('Check your email for the confirmation link!');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* LEFT PANE - Auth Form */}
      <div className="w-1/2 flex flex-col items-center justify-center p-12 border-r border-black">
        <div className="w-full max-w-md">
          {/* Brand Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-orange rounded border border-black flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-white">E</span>
            </div>
            <h1 className="text-2xl font-bold text-black tracking-tight">
              Welcome to <span className="text-brand-orange">EKA-AI</span>
            </h1>
            <p className="text-black mt-2 text-sm">
              Governed Automobile Intelligence
            </p>
          </div>

          {/* Auth Card */}
          <div className="w-full border border-black rounded p-8 bg-white">
            <div className="flex gap-4 mb-6 border-b border-black pb-1">
              <button
                onClick={() => setMode('LOGIN')}
                className={`pb-2 text-sm font-medium transition-colors ${
                  mode === 'LOGIN'
                    ? 'text-brand-orange border-b-2 border-brand-orange'
                    : 'text-black hover:text-brand-orange'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('SIGNUP')}
                className={`pb-2 text-sm font-medium transition-colors ${
                  mode === 'SIGNUP'
                    ? 'text-brand-orange border-b-2 border-brand-orange'
                    : 'text-black hover:text-brand-orange'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                <div className="bg-white border border-black rounded p-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-black">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-black uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-black rounded bg-white text-black focus:outline-none focus:border-brand-orange"
                  placeholder="workshop@go4garage.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-black uppercase">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-black rounded bg-white text-black focus:outline-none focus:border-brand-orange"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === 'LOGIN' ? (
                  'Enter Garage'
                ) : (
                  'Start Free Trial'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-black">
                By continuing, you agree to the{' '}
                <a href="/legal#terms" className="hover:text-brand-orange underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/legal#privacy" className="hover:text-brand-orange underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-black mt-4">
            © {new Date().getFullYear()} Go4Garage Private Limited. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT PANE - Video Scroller */}
      <div className="w-1/2">
        <VideoScroller />
      </div>
    </div>
  );
};

export default LoginPage;
