import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

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
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 bg-gradient-radial">
      {/* Brand Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-900/20">
          <span className="text-3xl font-bold text-black">E</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Welcome to <span className="text-orange-500">EKA-AI</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Governed Automobile Intelligence
        </p>
      </div>

      {/* Login Card - Glass Panel */}
      <div className="w-full max-w-md glass-panel rounded-2xl p-8">
        <div className="flex gap-4 mb-6 border-b border-white/5 pb-1">
          <button
            onClick={() => setMode('LOGIN')}
            className={`pb-2 text-sm font-medium transition-colors ${
              mode === 'LOGIN'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('SIGNUP')}
            className={`pb-2 text-sm font-medium transition-colors ${
              mode === 'SIGNUP'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Create Workshop Account
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              placeholder="workshop@go4garage.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="form-input"
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
          <p className="text-xs text-gray-600">
            By continuing, you agree to the{' '}
            <a href="#" className="hover:text-orange-500 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="hover:text-orange-500 underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
