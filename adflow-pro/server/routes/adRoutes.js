const express = require('express');
const router = express.Router();
const { createAd, getPublishedAds, getMyAds, submitAd, payForAd } = require('../controllers/adController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { createAdSchema, paymentSchema } = require('../validators/adValidator');

router.route('/')
  .get(getPublishedAds)
  .post(protect, authorize('Client'), validate(createAdSchema), createAd);

router.get('/me', protect, authorize('Client'), getMyAds);
router.put('/:id/submit', protect, authorize('Client'), submitAd);
router.put('/:id/pay', protect, authorize('Client'), validate(paymentSchema), payForAd);


// Add routes for categories and cities
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await require('../db/connect').supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.json([
      { id: 1, name: 'Real Estate' },
      { id: 2, name: 'Vehicles' },
      { id: 3, name: 'Electronics' },
      { id: 4, name: 'Services' },
      { id: 5, name: 'Jobs' }
    ]);
  }
});

router.get('/cities', async (req, res) => {
  try {
    const { data, error } = await require('../db/connect').supabase
      .from('cities')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.json([
      { id: 1, name: 'New York' },
      { id: 2, name: 'Los Angeles' },
      { id: 3, name: 'Chicago' },
      { id: 4, name: 'Houston' },
      { id: 5, name: 'Phoenix' }
    ]);
  }
});

module.exports = router;
