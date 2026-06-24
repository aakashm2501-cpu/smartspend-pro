import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../utils/supabase';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        console.log('--- SIGNUP ATTEMPT ---');
        const response = await supabase.auth.signUp({
          email,
          password,
        });
        console.log('--- SIGNUP RESPONSE ---');
        console.log('Full Response:', response);
        
        const { error } = response;
        if (error) {
          console.error('Signup Error Object:', error);
          console.error('Error Message:', error.message);
          console.error('Error Status:', error.status);
          console.error('Error Code:', error.code);
          throw error;
        }
        toast.success('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-brand-dark rounded-2xl border border-gray-800 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-orange mb-2">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="text-gray-400">{isSignUp ? 'Create your SmartSpend account to get started.' : 'Sign in to your SmartSpend account.'}</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleAuth}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors mt-2"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-400 hover:text-brand-orange transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
