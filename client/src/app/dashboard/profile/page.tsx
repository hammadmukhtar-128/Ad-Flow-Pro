'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Notification from '@/components/Notification';

export default function ClientProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
        if (data) {
          setFullName(data.full_name || data.name || '');
        } else {
          setError('Profile data is empty. Please try logging in again.');
        }
      } catch (err: any) {
        console.error('[PROFILE PAGE] Fetch Profile error:', err);
        setError(err.response?.data?.message || 'Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.put('/auth/profile', { full_name: fullName });
      setUser((prev: any) => ({ ...prev, full_name: data.full_name }));
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar role={user?.role || 'client'} />
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            {error && <Notification message={error} type="error" />}
            {success && <Notification message={success} type="success" />}

            {loading ? (
              <p>Loading profile...</p>
            ) : user ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                
                {!editing ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-500">Full Name</label>
                      <p className="text-lg font-medium text-gray-900 mt-1">{user.full_name || user.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500">Email Address</label>
                      <p className="text-lg text-gray-900 mt-1">{user.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500">Role</label>
                      <p className="text-lg text-gray-900 mt-1 capitalize">{user.role}</p>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => setEditing(true)}
                        className="bg-blue-600 text-white rounded px-6 py-2.5 font-semibold hover:bg-blue-700 transition"
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                      <input 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        minLength={2}
                        className="w-full rounded border px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-2">Email Address (Cannot be changed)</label>
                      <input 
                        value={user.email}
                        disabled
                        className="w-full rounded border px-3 py-2.5 bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div className="pt-4 flex gap-4 border-t border-gray-100">
                      <button 
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white rounded px-6 py-2.5 font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setFullName(user.full_name || user.name);
                        }}
                        disabled={saving}
                        className="px-6 border border-gray-300 rounded hover:bg-gray-50 text-gray-600 font-semibold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                
              </div>
            ) : (
              <p>Profile not found.</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
