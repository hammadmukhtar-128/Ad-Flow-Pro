'use client';

import { useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import Notification from '@/components/Notification';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      const role = res.data.role ? `${res.data.role.charAt(0).toUpperCase()}${res.data.role.slice(1).toLowerCase()}` : '';
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', role);
      window.location.href = '/dashboard';
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join(', '));
      } else if (err.message === 'Network Error') {
        setError('Network Error: Cannot connect to the server. Please ensure your API URL is correct.');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-20 min-h-[80vh] px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white">
      <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl shadow-blue-100 w-full max-w-md border border-white">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Log in to manage your marketplace.</p>
        </div>
        
        {error && <Notification message={error} type="error" />}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Email Address</label>
            <input 
              type="email" 
              className="w-full bg-gray-50 border-none px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
              placeholder="john@example.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-gray-50 border-none px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 mt-4 h-14">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : 'Sign In'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500 font-medium">
          New to AdFlow Pro? <Link href="/register" className="text-blue-600 hover:text-blue-800 font-bold ml-1">Create account</Link>
        </p>
      </div>
    </div>
  );
}
