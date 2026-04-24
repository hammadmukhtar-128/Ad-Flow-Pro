'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Notification from '@/components/Notification';

type Ad = {
  id: string;
  title: string;
  description: string;
  category: { id: string; name: string; slug: string } | string;
  city: { id: string; name: string; province: string } | string;
  package_type?: string;
  status: string;
  rejection_reason?: string;
  created_at?: string;
};

export default function ClientDashboard() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const fetchAds = async () => {
    try {
      const { data } = await api.get('/ads/me');
      setAds(data || []);
    } catch (err: any) {
      console.error('[CLIENT DASHBOARD] Fetch Ads error:', err);
      setError(err.response?.data?.message || 'Failed to load your ads. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const submitToReview = async (id: string) => {
    try {
      setError('');
      setSuccess('');
      await api.put(`/ads/${id}/submit`);
      setSuccess('Ad submitted for review successfully!');
      fetchAds();
    } catch (err) {
      console.error(err);
      setError('Failed to submit ad for review.');
    }
  };

  // Keep for internal dev use but hide from main workflow
  const simulatePayment = async (id: string) => {
    try {
      await api.put(`/ads/${id}/pay`);
      setSuccess('Payment status updated.');
      fetchAds();
    } catch (err) {
      console.error(err);
      setError('Payment action failed.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
      case 'approved': return 'text-green-600 bg-green-50';
      case 'under_review': return 'text-yellow-600 bg-yellow-50';
      case 'rejected':
      case 'payment_rejected': return 'text-red-600 bg-red-50';
      case 'draft': return 'text-gray-600 bg-gray-50';
      case 'payment_pending': return 'text-blue-600 bg-blue-50';
      case 'payment_submitted': return 'text-orange-600 bg-orange-50';
      case 'payment_verified': return 'text-emerald-600 bg-emerald-50';
      default: return 'text-blue-600 bg-blue-50';

    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold">My Ads</h2>
          <p className="text-sm text-gray-500">Create, review and manage your ad drafts.</p>
        </div>
        <Link href="/dashboard/client/create-ad" className="inline-flex items-center justify-center rounded bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition">
          Create Ad
        </Link>
      </div>

      {error && <Notification message={error} type="error" />}
      {success && <Notification message={success} type="success" />}

      <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
        {loading ? (
          <p>Loading your ads...</p>
        ) : ads.length === 0 ? (
          <p className="text-gray-500">You haven't created any ads yet. Use the Create Ad button to get started.</p>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <div key={ad.id} className="rounded-lg border border-gray-200 p-5 shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{ad.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(ad.status)}`}>
                        {ad.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ad.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                      <span><strong>Category:</strong> {typeof ad.category === 'object' ? ad.category.name : ad.category}</span>
                      <span><strong>City:</strong> {typeof ad.city === 'object' ? ad.city.name : ad.city}</span>
                      <span><strong>Package:</strong> {ad.package_type ? ad.package_type.charAt(0).toUpperCase() + ad.package_type.slice(1) : 'Basic'}</span>
                    </div>
                  </div>
                </div>
                {ad.rejection_reason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                    <strong>Rejection Reason:</strong> {ad.rejection_reason}
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  {['draft', 'rejected'].includes(ad.status.toLowerCase()) && (
                    <button 
                      onClick={() => submitToReview(ad.id)} 
                      className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                    >
                      Submit for Review
                    </button>
                  )}
                  {['payment_pending', 'payment_rejected'].includes(ad.status.toLowerCase()) && (
                    <Link 
                      href={`/dashboard/client/pay/${ad.id}`}
                      className="rounded bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                    >
                      Process Payment {ad.status === 'payment_rejected' ? '(Resubmit)' : ''}
                    </Link>
                  )}
                  {ad.status === 'payment_submitted' && (
                    <span className="text-sm font-medium text-gray-400 italic">Waiting for admin verification...</span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
