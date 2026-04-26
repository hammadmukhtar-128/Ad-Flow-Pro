require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { supabase } = require('./db/connect');
const morgan = require('morgan');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://ad-flow-pro-beta.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (!allowedOrigins.includes(origin)) {
      return callback(new Error('CORS not allowed'), false);
    }

    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

// 🔐 DATABASE INITIALIZATION
let initialized = false;

const initializeDatabase = async () => {
  if (initialized) return; // run only once

  try {
    const adminEmail = "hammadmukhtar128@gmail.com";
    const adminPassword = "Hammad@146";

    const { data: existingAdmin } = await supabase
      .from("users")
      .select("*")
      .eq("email", adminEmail)
      .maybeSingle();

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

      console.log("✅ Admin Created");
    }

    const categories = ["Vehicles", "Electronics", "Real Estate", "Jobs", "Services"];

    for (const cat of categories) {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("name", cat)
        .maybeSingle();

      if (!data) {
        await supabase.from("categories").insert([
          { name: cat, slug: cat.toLowerCase().replace(/ /g, "-") }
        ]);
      }
    }

    const cities = ["Lahore", "Karachi", "Islamabad", "Faisalabad", "Multan"];

    for (const city of cities) {
      const { data } = await supabase
        .from("cities")
        .select("*")
        .eq("name", city)
        .maybeSingle();

      if (!data) {
        await supabase.from("cities").insert([{ name: city }]);
      }
    }

    initialized = true;
    console.log("✅ Database initialized");

  } catch (err) {
    console.error("❌ Initialization Error:", err.message);
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

// ❌ REMOVE app.listen()
// ❌ REMOVE cron (Vercel support nahi karta)

// ✅ EXPORT for Vercel
module.exports = async (req, res) => {
  await initializeDatabase();
  return app(req, res);
};