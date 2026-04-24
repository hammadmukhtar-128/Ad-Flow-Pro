const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { supabase } = require("../db/connection");

const ADMIN_EMAIL = "hammadmukhtar128@gmail.com";
const ADMIN_PASSWORD = "Hammad@146";

async function createAdminIfNotExists() {
  try {
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("email", ADMIN_EMAIL)
      .single();

    if (existing) {
      console.log("✅ Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const { error } = await supabase.from("users").insert([
      {
        id: uuidv4(),
        email: ADMIN_EMAIL,
        password_hash: hashedPassword,
        role: "ADMIN",
        full_name: "Super Admin",
        is_verified: true,
      },
    ]);

    if (error) {
      console.log("❌ Error creating admin:", error.message);
    } else {
      console.log("🔥 Admin created successfully!");
    }

  } catch (err) {
    console.log("❌ Admin creation error:", err.message);
  }
}

module.exports = createAdminIfNotExists;