const { supabase } = require('../db/connect');
const { createNotification } = require('../services/notificationService');

// Helper to log status history (Same as in adController - in production this would be in a common service)
const logStatusChange = async (adId, userId, fromStatus, toStatus, reason = null) => {
  await supabase.from('ad_status_history').insert([{
    ad_id: adId,
    changed_by: userId,
    from_status: fromStatus,
    to_status: toStatus,
    reason: reason
  }]);

  await supabase.from('audit_logs').insert([{
    user_id: userId,
    action: `STATUS_CHANGE_${toStatus.toUpperCase()}`,
    resource_id: adId,
    details: { from: fromStatus, to: toStatus, reason }
  }]);
};


// @desc    Get all ads with payment submitted
// @route   GET /api/admin/ads
// @access  Private (Admin)
const getAdsForApproval = async (req, res) => {
  try {
    const { data: ads, error } = await supabase
      .from('ads')
      .select(`
        *,
        category:categories(id, name, slug),
        city:cities(id, name),
        user:users(id, full_name, email)
      `)
      .in('status', ['under_review', 'payment_submitted', 'payment_pending', 'payment_verified'])
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ message: 'Failed to load ads' });
    }

    res.json(ads);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Approve/Publish Ad
// @route   PUT /api/admin/ads/:id/approve
// @access  Private (Admin)
// @desc    Admin reviews ad content
// @route   PUT /api/admin/ads/:id/review
// @access  Private (Admin/Moderator)
const reviewAd = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const { data: ad } = await supabase.from('ads').select('status, user_id').eq('id', req.params.id).single();
    if (!ad) return res.status(404).json({ message: 'Ad not found' });

    if (action === 'approve') {
      const { error } = await supabase.from('ads').update({ status: 'payment_pending' }).eq('id', req.params.id);
      if (error) throw error;
      await logStatusChange(req.params.id, req.user.id, ad.status, 'payment_pending');
      await createNotification(ad.user_id, 'ad_review_approved', 'Your ad content was approved. Please proceed with payment.');
      return res.json({ message: 'Ad approved for payment' });
    } else {
      const { rejection_reason } = req.body;
      const { error } = await supabase.from('ads').update({ status: 'rejected', rejection_reason }).eq('id', req.params.id);
      if (error) throw error;
      await logStatusChange(req.params.id, req.user.id, ad.status, 'rejected', rejection_reason);
      await createNotification(ad.user_id, 'ad_review_rejected', `Your ad was rejected: ${rejection_reason}`);
      return res.json({ message: 'Ad rejected' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin verifies payment
// @route   PUT /api/admin/ads/:id/verify-payment
// @access  Private (Admin)
const verifyPayment = async (req, res) => {
  try {
    const { data: ad } = await supabase.from('ads').select('status, user_id, title').eq('id', req.params.id).single();
    if (!ad) return res.status(404).json({ message: 'Ad not found' });

    // Update payment record
    const { error: pError } = await supabase
      .from('payments')
      .update({ status: 'verified' })
      .eq('ad_id', ad.id)
      .eq('status', 'submitted'); 

    if (pError) throw pError;

    // Update ad record
    const { error } = await supabase.from('ads').update({ status: 'payment_verified' }).eq('id', req.params.id);
    if (error) throw error;

    await logStatusChange(req.params.id, req.user.id, ad.status, 'payment_verified');
    await createNotification(ad.user_id, 'payment_verified', `Your payment for "${ad.title}" has been verified. You can now publish your ad.`);

    res.json({ message: 'Payment verified' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin rejects payment
// @route   PUT /api/admin/ads/:id/reject-payment
// @access  Private (Admin)
const rejectPayment = async (req, res) => {
  try {
    const { rejection_reason } = req.body;
    if (!rejection_reason) return res.status(400).json({ message: 'Rejection reason is required' });

    const { data: ad } = await supabase.from('ads').select('status, user_id, title').eq('id', req.params.id).single();
    if (!ad) return res.status(404).json({ message: 'Ad not found' });

    // Update payment record
    const { error: pError } = await supabase
      .from('payments')
      .update({ status: 'rejected', rejection_reason })
      .eq('ad_id', ad.id)
      .eq('status', 'submitted');

    if (pError) throw pError;

    // Update ad record
    const { error } = await supabase.from('ads').update({ status: 'payment_rejected' }).eq('id', req.params.id);
    if (error) throw error;

    await logStatusChange(req.params.id, req.user.id, ad.status, 'payment_rejected', rejection_reason);
    await createNotification(ad.user_id, 'payment_rejected', `Your payment for "${ad.title}" was rejected: ${rejection_reason}. Please resubmit with correct details.`);

    res.json({ message: 'Payment rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all submitted payments for verification
// @route   GET /api/admin/payments
// @access  Private (Admin)
const getPaymentsQueue = async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        ad:ads(id, title, package_type),
        user:users(id, full_name, email)
      `)
      .eq('status', 'submitted')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const approveAd = async (req, res) => {
  try {
    const { data: ad } = await supabase.from('ads').select('*').eq('id', req.params.id).single();
    if (!ad) return res.status(404).json({ message: 'Ad not found' });

    if (!['under_review', 'payment_verified'].includes(ad.status)) {
      return res.status(400).json({ message: 'Ad must be under review or payment verified before publishing' });
    }

    // Requirement 6: Apply duration
    const durations = { basic: 7, standard: 15, premium: 30 };
    const days = durations[ad.package_type] || 7;
    const publishAt = ad.published_at || new Date().toISOString();
    const expiresAt = new Date(new Date(publishAt).getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    const { data: updatedAd, error: updateError } = await supabase
      .from('ads')
      .update({ 
        status: 'published',
        published_at: publishAt,
        expires_at: expiresAt
      })

      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    await logStatusChange(ad.id, req.user.id, ad.status, 'published');
    await createNotification(ad.user_id, 'ad_published', `Your ad "${ad.title}" is now published!`);

    res.json(updatedAd);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Reject Ad
// @route   PUT /api/admin/ads/:id/reject
// @access  Private (Admin)
const rejectAd = async (req, res) => {
  try {
    const { rejection_reason } = req.body;
    if (!rejection_reason) return res.status(400).json({ message: 'Reject reason is required' });

    const { data: ad } = await supabase.from('ads').select('status, user_id').eq('id', req.params.id).single();
    if (!ad) return res.status(404).json({ message: 'Ad not found' });

    const { data: updatedAd, error: updateError } = await supabase
      .from('ads')
      .update({ status: 'rejected', rejection_reason })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    await logStatusChange(ad.id, req.user.id, ad.status, 'rejected', rejection_reason);
    await createNotification(ad.user_id, 'ad_rejected', `Your ad was rejected: ${rejection_reason}`);

    res.json(updatedAd);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
  try {
    const { data: ads, error } = await supabase.from('ads').select('status, package_type');
    if (error) throw error;

    // Fetch confirmed payments for revenue
    const { data: payments, error: pError } = await supabase
      .from('payments')
      .select('amount, package_type:ads(package_type)')
      .eq('status', 'verified');
    
    if (pError) throw pError;

    const stats = {
      totalAds: ads.length,
      activeAds: ads.filter(a => a.status === 'published').length,
      expiredAds: ads.filter(a => a.status === 'expired').length,
      revenueByPackage: payments.reduce((acc, p) => {
        const pkg = p.package_type?.package_type || 'basic';
        acc[pkg] = (acc[pkg] || 0) + (p.amount || 0);
        return acc;
      }, {}),
      totalRevenue: payments.reduce((acc, p) => acc + (p.amount || 0), 0)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



module.exports = {
  getAdsForApproval,
  reviewAd,
  verifyPayment,
  rejectPayment,
  approveAd,
  rejectAd,
  getDashboardStats,
  getPaymentsQueue
};


