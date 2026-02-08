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
        // Navigation is handled by the AuthProvider listener in App.tsx
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0], // Default name
              role: 'OWNER', // Default role for new signups
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Brand Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-brand-orange rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-900/20">
          <span className="text-3xl font-bold text-white">E</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Welcome to <span className="text-brand-orange">EKA-AI</span>
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          Governed Automobile Intelligence
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl">
        <div className="flex gap-4 mb-6 border-b border-border pb-1">
          <button
            onClick={() => setMode('LOGIN')}
            className={`pb-2 text-sm font-medium transition-colors ${
              mode === 'LOGIN'
                ? 'text-brand-orange border-b-2 border-brand-orange'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('SIGNUP')}
            className={`pb-2 text-sm font-medium transition-colors ${
              mode === 'SIGNUP'
                ? 'text-brand-orange border-b-2 border-brand-orange'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Create Workshop Account
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary uppercase">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
              placeholder="workshop@go4garage.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-brand-orange transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-orange hover:bg-brand-hover text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-6"
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
          <p className="text-xs text-text-muted">
            By continuing, you agree to the{' '}
            <a href="#" className="hover:text-brand-orange underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="hover:text-brand-orange underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
