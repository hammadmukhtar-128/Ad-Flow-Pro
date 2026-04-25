import React from 'react';

export default function Notification({ message, type = 'info' }: { message: string, type?: 'info' | 'success' | 'error' }) {
  const bgColors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 shadow-sm shadow-blue-100',
    success: 'bg-green-50 border-green-200 text-green-800 shadow-sm shadow-green-100',
    error: 'bg-red-50 border-red-200 text-red-800 shadow-sm shadow-red-100'
  };

  return (
    <div className={`border rounded-xl p-4 mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 ${bgColors[type]}`} role="alert">
      <div className={`w-2 h-2 rounded-full ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
