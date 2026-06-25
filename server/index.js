// ─── Load environment variables FIRST — before any other require ───────────
// Use __dirname so dotenv always finds server/.env regardless of the CWD
// (Railway runs `node server/index.js` from the project root).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
// ───────────────────────────────────────────────────────────────────────────

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');

// DB is required AFTER dotenv.config() so env vars are already populated
const { supabase } = require('./db/connect');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'https://ad-flow-pro-beta.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error('CORS not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));

// ─── DATABASE INITIALIZATION ───────────────────────────────────────────────
const initializeDatabase = async () => {
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
          is_verified: true,
        },
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
          { name: cat, slug: cat.toLowerCase().replace(/ /g, "-") },
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

    console.log("✅ Database initialized");
  } catch (err) {
    console.error("❌ Initialization Error:", err.message);
    // Non-fatal: server will still start so health checks pass
  }
};

// ─── ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ads', require('./routes/adRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/moderator', require('./routes/moderatorRoutes'));

app.get('/', (req, res) => {
  res.send('AdFlow Pro API is running...');
});

// Health-check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── START SERVER ─────────────────────────────────────────────────────────
// Run initializeDatabase then start the HTTP server.
// Railway requires a long-running process bound to process.env.PORT.
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
});