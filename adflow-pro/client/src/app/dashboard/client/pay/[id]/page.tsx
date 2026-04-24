'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Notification from '@/components/Notification';

export default function PaymentPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');

  const pricing: any = { basic: 10, standard: 20, premium: 30 };

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const { data } = await api.get('/ads/me');
        const found = data.find((a: any) => a.id === id);
        if (found) {
          setAd(found);
          const pkgType = (found.package_type || 'basic').toLowerCase();
          setAmount(pricing[pkgType]?.toString() || '10');
        } else {
          setError('Ad not found.');
        }
      } catch (err) {
        setError('Failed to load ad details.');
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.put(`/ads/${id}/pay`, {
        transactionId,
        amount: parseFloat(amount),
        paymentMethod,
        senderName,
        screenshotUrl
      });

      setSuccess('Payment details submitted successfully! An admin will verify your transaction shortly.');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit payment details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar role="client" />
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Submit Payment</h1>
            <p className="text-gray-500 mb-8 font-medium italic">Requirement: Admin will manually verify this transaction.</p>

            {error && <Notification message={error} type="error" />}
            {success && <Notification message={success} type="success" />}

            {loading ? (
              <p>Loading ad details...</p>
            ) : ad ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-1">Payment for: {ad.title}</h3>
                  <p className="text-sm text-blue-700">Package: <span className="font-bold uppercase">{ad.package_type}</span> — Required Amount: <span className="font-bold font-mono">${pricing[ad.package_type]}</span></p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                      <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full rounded border px-3 py-2.5 focus:border-blue-500 focus:outline-none bg-gray-50"
                      >
                        <option value="Card">Credit/Debit Card</option>
                        <option value="Binance">Binance Pay</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="Easypaisa">Easypaisa</option>
                        <option value="SadaPay">SadaPay</option>
                        <option value="NayaPay">NayaPay</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (USD)</label>
                      <input 
                        type="number"
                        value={amount}
                        readOnly
                        className="w-full rounded border px-3 py-2.5 bg-gray-100 cursor-not-allowed text-gray-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction ID / Reference</label>
                    <input 
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      required
                      minLength={5}
                      maxLength={50}
                      placeholder="Enter the unique transaction ID"
                      className="w-full rounded border px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-400">Must be unique (No duplicates allowed)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sender Name</label>
                    <input 
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      required
                      placeholder="Account holder name"
                      className="w-full rounded border px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Screenshot URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input 
                      value={screenshotUrl}
                      onChange={(e) => setScreenshotUrl(e.target.value)}
                      type="url"
                      placeholder="https://image-host.com/my-receipt.png"
                      className="w-full rounded border px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-green-600 text-white rounded py-3 font-bold hover:bg-green-700 transition disabled:opacity-50 shadow-md"
                    >
                      {submitting ? 'Submitting...' : 'Submit Payment Details'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 border border-gray-300 rounded hover:bg-gray-50 text-gray-600 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <p>Ad not found or unauthorized.</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
