'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [isLogged, setIsLogged] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLogged(true);
      setRole(localStorage.getItem('role'));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-black tracking-tight text-blue-600 flex items-center gap-2">
          <span className="bg-blue-600 text-white p-1 rounded-lg">AF</span>
          AdFlow Pro
        </Link>
        <nav className="space-x-8 flex items-center text-sm font-semibold text-gray-600">
          <Link href="/explore" className="hover:text-blue-600 transition-colors">Explore</Link>
          
          {isLogged ? (
            <>
              <Link href="/dashboard" className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-all font-bold">
                Dashboard ({role})
              </Link>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-600 transition-colors text-gray-700">Login</Link>
              <Link href="/admin/login" className="text-gray-400 hover:text-gray-900 transition-colors">Admin</Link>
              <Link href="/register" className="bg-blue-600 px-6 py-2 rounded-full text-white hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
