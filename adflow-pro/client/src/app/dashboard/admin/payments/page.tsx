'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import Notification from '@/components/Notification';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPayments = async () => {
    try {
      const { data } = await api.get('/admin/payments');
      setPayments(data || []);
    } catch (err) {
      setError('Failed to load payment queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (adId: string) => {
    try {
      await api.put(`/admin/ads/${adId}/verify-payment`);
      setSuccess('Payment verified successfully!');
      fetchPayments();
    } catch (err) {
      setError('Failed to verify payment.');
    }
  };

  const handleReject = async (adId: string) => {
    const reason = prompt('Please enter the reason for rejection:');
    if (!reason) return;

    try {
      await api.put(`/admin/ads/${adId}/reject-payment`, { rejection_reason: reason });
      setSuccess('Payment rejected.');
      fetchPayments();
    } catch (err) {
      setError('Failed to reject payment.');
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar role="admin" />
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-extrabold mb-8 text-gray-900 border-b pb-4">Payment Verification Queue</h1>
          
          {error && <Notification message={error} type="error" />}
          {success && <Notification message={success} type="success" />}

          {loading ? (
            <p>Loading payments...</p>
          ) : payments.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm">
              <p className="text-gray-500 font-medium">No pending payments found in the queue.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {payments.map((p) => (
                <div key={p.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">{p.ad?.title}</h3>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">{p.ad?.package_type}</span>
                      </div>
                      <p className="text-sm text-gray-600"><strong>User:</strong> {p.user?.full_name} ({p.user?.email})</p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
                        <p className="text-sm text-gray-500"><strong>Method:</strong> {p.payment_method}</p>
                        <p className="text-sm text-gray-500"><strong>Ref:</strong> <span className="font-mono bg-gray-50 px-1 rounded">{p.transaction_reference}</span></p>
                        <p className="text-sm text-gray-500"><strong>Amount:</strong> <span className="text-green-600 font-bold">${p.amount}</span></p>
                      </div>
                      {p.screenshot_url && (
                        <a href={p.screenshot_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-medium">View Screenshot ↗</a>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleVerify(p.ad_id)}
                        className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition"
                      >
                        Receive Payment
                      </button>
                      <button 
                        onClick={() => handleReject(p.ad_id)}
                        className="px-6 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
