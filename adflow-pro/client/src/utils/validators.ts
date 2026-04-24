export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'At least 8 characters required';
  if (!/[A-Z]/.test(password)) return 'Must contain an uppercase letter';
  if (!/[0-9]/.test(password)) return 'Must contain a number';
  return null;
};

export const validateTitle = (title: string): string | null => {
  if (!title?.trim()) return 'Title is required';
  if (title.length < 5) return 'Title must be at least 5 characters';
  if (title.length > 120) return 'Title must be under 120 characters';
  return null;
};

export const validateImageUrl = (url: string): boolean => {
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
};

export const formatCurrency = (amount: number, currency = 'PKR'): string => {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency }).format(amount / 100);
};

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

export const timeAgo = (date: string): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const daysRemaining = (expiresAt: string): number => {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
};