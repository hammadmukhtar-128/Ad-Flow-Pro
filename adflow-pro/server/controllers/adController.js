const { supabase } = require('../db/connect');

// 🔥 Helper function to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-') // spaces → dash
    .replace(/-+/g, '-'); // remove duplicate dashes
};

// @desc    Create a draft ad
const createAd = async (req, res) => {
  try {
    const { title, description, category, city, package: packageType = 'Basic' } = req.body;

    if (!title || !description || !category || !city) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // ✅ Generate slug
    const slug = generateSlug(title);

    const normalizedPackage = (['Basic', 'Standard', 'Premium'].includes(packageType)
      ? packageType
      : 'Basic').toLowerCase();

    // ✅ Category lookup or creation
    let categoryId;
    const { data: categoryData, error: catError } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', category)
      .maybeSingle();

    if (catError && catError.code !== 'PGRST116') {
      console.log('Category lookup error:', catError);
      return res.status(500).json({ message: 'Database error while verifying category' });
    }

    if (!categoryData) {
      // Auto-create category
      const catSlug = generateSlug(category);
      const { data: newCat, error: insertCatErr } = await supabase
        .from('categories')
        .insert([{ name: category, slug: catSlug }])
        .select('id')
        .single();
      
      if (insertCatErr) return res.status(500).json({ message: 'Failed to auto-create category' });
      categoryId = newCat.id;
    } else {
      categoryId = categoryData.id;
    }

    // ✅ City lookup or creation
    let cityId;
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .ilike('name', city)
      .maybeSingle();

    if (cityError && cityError.code !== 'PGRST116') {
      console.log('City lookup error:', cityError);
      return res.status(500).json({ message: 'Database error while verifying city' });
    }

    if (!cityData) {
      // Auto-create city
      const { data: newCity, error: insertCityErr } = await supabase
        .from('cities')
        .insert([{ name: city }])
        .select('id')
        .single();

      if (insertCityErr) return res.status(500).json({ message: 'Failed to auto-create city' });
      cityId = newCity.id;
    } else {
      cityId = cityData.id;
    }

    // ✅ Insert with slug
    const { data: ad, error } = await supabase
      .from('ads')
      .insert({
        user_id: req.user.id,
        title,
        slug, // 🔥 IMPORTANT FIX
        description,
        category_id: categoryId,
        city_id: cityId,
        package_type: normalizedPackage,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.log("SUPABASE ERROR:", error);
      return res.status(500).json({ message: error.message });
    }

    res.status(201).json(ad);

  } catch (error) {
    console.log("SERVER ERROR:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get published ads
const getPublishedAds = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select('*, category:categories(id, name, slug), city:cities(id, name), user:users(id, full_name, email)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.log("SERVER ERROR in getPublishedAds:", error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get user's ads
const getMyAds = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select('*, category:categories(id, name, slug), city:cities(id, name)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.log("SERVER ERROR in getMyAds:", error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Submit ad for review
const submitAd = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ad belongs to user
    const { data: ad, error: fetchError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
      
    if (fetchError || !ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    
    if (!['draft', 'rejected'].includes(ad.status)) {
      return res.status(400).json({ message: 'Only draft or rejected ads can be submitted for review' });
    }
    
    // Update status based on package
    // Since Basic package might not require payment initially or requires payment before publish,
    // let's transition it to 'under_review' as typical standard.
    const { data, error } = await supabase
      .from('ads')
      .update({ status: 'under_review', rejection_reason: null })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.log("SERVER ERROR in submitAd:", error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Pay for ad / Submit payment info
const payForAd = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[PAYMENT] Request body:', req.body);
    const { transactionId, amount, paymentMethod, senderName, screenshotUrl } = req.body;
    
    // Check if ad belongs to user
    const { data: ad, error: fetchError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
      
    if (fetchError || !ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    
    // Insert into 'payments' table for admin verification
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        ad_id: id,
        user_id: req.user.id,
        transaction_reference: transactionId,
        amount: amount,
        payment_method: paymentMethod,
        package_type: ad.package_type, // satisfy constraint
        screenshot_url: screenshotUrl || null,
        status: 'submitted'
      });
      
    if (paymentError) {
      console.log('[PAYMENT] Insert error:', paymentError);
      return res.status(500).json({ message: 'Failed to record payment: ' + (paymentError.message || '') });
    }
    
    // Update ad status
    const { data, error } = await supabase
      .from('ads')
      .update({ 
        status: 'payment_submitted',
        transaction_id: transactionId,
        payment_method: paymentMethod
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    res.json({ message: 'Payment submitted successfully', ad: data });
  } catch (error) {
    console.log("SERVER ERROR in payForAd:", error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = {
  createAd,
  getPublishedAds,
  getMyAds,
  submitAd,
  payForAd
};