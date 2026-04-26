// const fs = require('fs'); // Removed for Vercel support
const { supabase } = require('../db/connect');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'supersecret123', {
    expiresIn: '30d',
  });
};

function logAuthError(message, data) {
  console.error(`[AUTH ERROR] ${message}`, data);
}

const register = async (req, res) => {
  try {
    console.log('[AUTH] register body:', req.body);
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Supabase lookup error:', existingError);
      return res.status(500).json({ message: 'Server Error' });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 🔐 Restrict roles: only client or moderator, default to client
    const normalizedRole = ['client', 'moderator'].includes((role || '').toLowerCase())
      ? role.toLowerCase()
      : 'client';

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        full_name: name,
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        role: normalizedRole,
        is_verified: false,
      })
      .select('id, full_name, email, role')
      .single();

    if (insertError) {
      console.error('❌ Supabase insert error:', insertError);
      logAuthError('Supabase insert error:', insertError);
      return res.status(500).json({ message: insertError.message || 'Server Error' });
    }

    // ✅ Create Default Seller Profile
    const { error: profileError } = await supabase
      .from('seller_profiles')
      .insert({ user_id: newUser.id });
      
    if (profileError) {
      console.error('❌ Profile Creation Error:', profileError);
      // Not throwing a hard error so we don't break registration completely,
      // but typically we'd guarantee it. Wait, the DB guarantees ON DELETE CASCADE.
    }

    const token = generateToken(newUser.id, newUser.role);

    return res.status(201).json({
      _id: newUser.id,
      name: newUser.full_name,
      email: newUser.email,
      role: newUser.role,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    logAuthError('Register error:', {
      error: error?.message || error,
      stack: error?.stack || null,
      body: req.body,
    });
    return res.status(500).json({ message: 'Server Error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, role, password_hash')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (userError) {
      console.error('Supabase login lookup error:', userError);
      return res.status(500).json({ message: 'Server Error' });
    }

    if (!user || user.role === 'admin') {
      console.log('❌ Login failed: User not found or is admin trying to use user login', { email, role: user?.role });
      return res.status(401).json({ message: 'Invalid credentials or unauthorized' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role);

    return res.json({
      _id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, role, password_hash')
      .eq('email', email.toLowerCase())
      .eq('role', 'admin')
      .maybeSingle();

    if (userError) {
      console.error('Supabase admin login lookup error:', userError);
      return res.status(500).json({ message: 'Server Error' });
    }

    if (!user) {
      console.log('❌ Admin Login failed: Admin not found', { email });
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = generateToken(user.id, user.role);

    return res.json({
      _id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Admin Login error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

const getMe = async (req, res) => {
  try {
    const { id } = req.user;
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, is_verified')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('GetMe error:', error);
      return res.status(500).json({ message: 'Server Error' });
    }

    return res.json(user);
  } catch (error) {
    console.error('GetMe exception:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { full_name } = req.body;

    if (!full_name || full_name.trim().length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update({ full_name: full_name.trim() })
      .eq('id', id)
      .select('id, full_name, email, role')
      .single();

    if (error) {
      console.error('updateProfile error:', error);
      return res.status(500).json({ message: 'Failed to update profile.' });
    }

    return res.json(updated);
  } catch (error) {
    console.error('updateProfile exception:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', id);

    if (updateError) {
      console.error('changePassword update error:', updateError);
      return res.status(500).json({ message: 'Failed to update password.' });
    }

    return res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('changePassword exception:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { register, login, adminLogin, getMe, updateProfile, changePassword };
