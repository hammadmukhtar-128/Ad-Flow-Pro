import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

import Notification from '@/components/Notification';

export default function AdminDashboard() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState<any>(null);


  const fetchAds = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/ads');
      setAds(data || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load ads for review.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchAds();
    fetchStats();
  }, []);


  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      console.log(`[ADMIN DASHBOARD] ${action} clicked for Ad ID:`, id);
      setError('');
      setSuccess('');
      let body = {};
      let response;

      if (action === 'reject') {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        body = { rejection_reason: reason };
        console.log(`[ADMIN DASHBOARD] Rejecting with reason:`, reason);
        response = await api.put(`/admin/ads/${id}/reject`, body);
      } else {
        console.log(`[ADMIN DASHBOARD] Sending Approve request to: /admin/ads/${id}/approve`);
        response = await api.put(`/admin/ads/${id}/approve`);
      }
      
      console.log(`[ADMIN DASHBOARD] ${action} response:`, response.data);
      setSuccess(`Ad ${action === 'approve' ? 'published' : 'rejected'} successfully`);
      fetchAds();
    } catch (err: any) {
      console.error(`[ADMIN DASHBOARD] ${action} failed:`, err.response?.data || err.message);
      setError(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-2">Admin Approval Queue</h2>
        <p className="text-sm text-gray-500 mb-6">Ads in this queue are waiting for your review. Approve to publish them or Reject with a reason.</p>

        {error && <Notification message={error} type="error" />}
        {success && <Notification message={success} type="success" />}

        {loading ? (
          <p>Loading ads...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats && (
              <>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Ads</p>
                  <p className="text-3xl font-black text-gray-900">{stats.totalAds}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Active Ads</p>
                  <p className="text-3xl font-black text-green-600">{stats.activeAds}</p>
                </div>
                <div className="bg-green-600 p-6 rounded-xl text-white shadow-lg shadow-green-100 flex flex-col justify-between">
                  <div>
                    <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">Revenue</p>
                    <p className="text-3xl font-black">${stats.totalRevenue}</p>
                  </div>
                  <Link href="/dashboard/admin/payments" className="mt-4 text-xs font-bold uppercase bg-white/20 py-2 px-3 rounded hover:bg-white/30 transition text-center">
                    Verify Payments ➔
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {loading ? (
          <p>Loading ads...</p>
        ) : (
          <div className="space-y-4">
            {ads.map((ad: any) => (
              <div key={ad.id} className="border border-gray-200 rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{ad.title}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">
                      {ad.package_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 max-w-xl">{ad.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                    <span><strong>User:</strong> {ad.user?.full_name} ({ad.user?.email})</span>
                    <span><strong>Category:</strong> {ad.category?.name}</span>
                    <span><strong>City:</strong> {ad.city?.name}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleAction(ad.id, 'approve')} 
                    className="flex-1 md:flex-none bg-green-600 text-white px-5 py-2 rounded font-semibold hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleAction(ad.id, 'reject')} 
                    className="flex-1 md:flex-none border border-red-600 text-red-600 px-5 py-2 rounded font-semibold hover:bg-red-50 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {ads.length === 0 && (
              <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500">No ads are currently awaiting review.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
