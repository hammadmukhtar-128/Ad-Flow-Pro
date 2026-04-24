const express = require('express');
const router = express.Router();
const { 
  getAdsForApproval, 
  reviewAd, 
  verifyPayment, 
  rejectPayment,
  approveAd, 
  rejectAd, 
  getDashboardStats,
  getPaymentsQueue
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect, authorize('admin'));

router.get('/ads', getAdsForApproval);
router.put('/ads/:id/review', reviewAd);
router.get('/payments', getPaymentsQueue);
router.put('/ads/:id/verify-payment', verifyPayment);
router.put('/ads/:id/reject-payment', rejectPayment);
router.put('/ads/:id/approve', approveAd);
router.put('/ads/:id/reject', rejectAd);
router.get('/stats', getDashboardStats);


module.exports = router;

