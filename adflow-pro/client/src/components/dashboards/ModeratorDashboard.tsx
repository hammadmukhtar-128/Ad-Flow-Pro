'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Notification from '@/components/Notification';

export default function ModeratorDashboard() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/moderator/queue');
      setQueue(data || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    try {
      let body: any = { action };
      if (action === 'reject') {
        const reason = prompt('Reason for rejection:');
        if (!reason) return;
        body.rejection_reason = reason;
      }

      await api.put(`/moderator/${id}/review`, body);
      alert(`Ad ${action}d successfully`);
      fetchQueue();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-2">Moderator Review Queue</h2>
        <p className="text-sm text-gray-500 mb-6">Review new ad submissions for content guidelines compliance.</p>

        {error && <Notification message={error} type="error" />}

        {loading ? (
          <p>Loading queue...</p>
        ) : (
          <div className="space-y-4">
            {queue.map((ad: any) => (
              <div key={ad.id} className="border border-gray-200 rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-bold text-lg">{ad.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 max-w-xl">{ad.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                    <span><strong>Client:</strong> {ad.user?.full_name}</span>
                    <span><strong>Category:</strong> {ad.category?.name}</span>
                    <span><strong>City:</strong> {ad.city?.name}</span>
                    <span><strong>Package:</strong> {ad.package_type}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleReview(ad.id, 'approve')} 
                    className="flex-1 md:flex-none bg-green-600 text-white px-5 py-2 rounded font-semibold hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReview(ad.id, 'reject')} 
                    className="flex-1 md:flex-none border border-red-600 text-red-600 px-5 py-2 rounded font-semibold hover:bg-red-50 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {queue.length === 0 && (
              <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500">No ads are currently under review.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
