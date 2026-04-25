'use client';

import { useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import Notification from '@/components/Notification';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Client');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const normalizedRole = res.data.role ? `${res.data.role.charAt(0).toUpperCase()}${res.data.role.slice(1).toLowerCase()}` : '';
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', normalizedRole);
      window.location.href = '/dashboard';
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join(', '));
      } else {
        setError(err.response?.data?.message || err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-20 min-h-[80vh] px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white">
      <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl shadow-blue-100 w-full max-w-md border border-white">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Join AdFlow Pro</h1>
          <p className="text-gray-500 mt-2">Start your marketplace journey today.</p>
        </div>
        
        {error && <Notification message={error} type="error" />}
        
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Full Name</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 border-none px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
              placeholder="John Doe"
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>
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
              minLength={6}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Account Type</label>
            <select className="w-full bg-gray-50 border-none px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none font-medium" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Client">Client</option>
            </select>
          </div>
          
          <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 mt-4 h-14">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : 'Access Marketplace'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500 font-medium">
          Already a member? <Link href="/login" className="text-blue-600 hover:text-blue-800 font-bold ml-1">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
