require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { supabase } = require('./db/connect'); // ✅ Supabase import
const runAdLifecycleCron = require('./cron/adLifecycle');

const morgan = require('morgan');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true })); // ✅ Permissive CORS
app.use(express.json());
app.use(morgan('dev')); // ✅ Request logging

// 🔐 DATABASE INITIALIZATION (Admin, Categories, Cities)
const initializeDatabase = async () => {
  try {
    // 1️⃣ CREATE DEFAULT ADMIN
    const adminEmail = "hammadmukhtar128@gmail.com";
    const adminPassword = "Hammad@146";

    const { data: existingAdmin } = await supabase
      .from("users")
      .select("*")
      .eq("email", adminEmail)
      .single();

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await supabase.from("users").insert([
        {
          email: adminEmail,
          password_hash: hashedPassword,
          full_name: "Super Admin",
          role: "admin",
          is_verified: true
        }
      ]);
      console.log("✅ Admin Created Successfully");
    } else {
      console.log("ℹ️ Admin already exists");
    }

    // 2️⃣ PRE-POPULATE CATEGORIES
    const categories = ["Vehicles", "Electronics", "Real Estate", "Jobs", "Services"];
    for (const cat of categories) {
      const { data: existingCat } = await supabase
        .from("categories")
        .select("*")
        .eq("name", cat)
        .maybeSingle();

      if (!existingCat) {
        const slug = cat.toLowerCase().replace(/ /g, "-");
        await supabase.from("categories").insert([{ name: cat, slug }]);
        console.log(`✅ Category Added: ${cat}`);
      }
    }

    // 3️⃣ PRE-POPULATE CITIES
    const cities = ["Lahore", "Karachi", "Islamabad", "Faisalabad", "Multan"];
    for (const city of cities) {
      const { data: existingCity } = await supabase
        .from("cities")
        .select("*")
        .eq("name", city)
        .maybeSingle();

      if (!existingCity) {
        await supabase.from("cities").insert([{ name: city }]);
        console.log(`✅ City Added: ${city}`);
      }
    }

  } catch (err) {
    console.log("❌ Initialization Error:", err.message);
  }
};

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ads', require('./routes/adRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/moderator', require('./routes/moderatorRoutes'));

app.get('/', (req, res) => {
  res.send('AdFlow Pro API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  await initializeDatabase(); // ✅ Full Initialization
  runAdLifecycleCron();      // ✅ cron start
});