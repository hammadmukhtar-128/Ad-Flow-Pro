import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function NotificationProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #2a2a2a',
          borderRadius: '10px',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#d946ef', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#f97316', secondary: '#fff' },
        },
      }}
    />
  );
}

// Inline notification banner
interface BannerProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  className?: string;
}

const BANNER_STYLES = {
  success: 'bg-green-900/30 border-green-800/50 text-green-300',
  error: 'bg-red-900/30 border-red-800/50 text-red-300',
  warning: 'bg-orange-900/30 border-orange-800/50 text-orange-300',
  info: 'bg-blue-900/30 border-blue-800/50 text-blue-300',
};

export function NotificationBanner({ type, message, className = '' }: BannerProps) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${BANNER_STYLES[type]} ${className}`}>
      {message}
    </div>
  );
}