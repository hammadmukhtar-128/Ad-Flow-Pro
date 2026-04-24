import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/db/connect';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';

function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ✅ REGISTER (FIXED)
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, full_name, role } = req.body;

    // ❌ BLOCK ADMIN
    if (role === 'ADMIN') {
      throw new AppError('Admin registration not allowed', 403);
    }

    // ✅ Allow only CLIENT or MODERATOR
    const allowedRoles = ['CLIENT', 'MODERATOR'];
    const userRole = allowedRoles.includes(role) ? role : 'CLIENT';

    // Check existing
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const password_hash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        id,
        email: email.toLowerCase(),
        password_hash,
        full_name,
        role: userRole,
        is_verified: false,
      })
      .select('id, email, role, full_name, is_verified, created_at')
      .single();

    if (error) throw new AppError(error.message, 500);

    // Create seller profile only for CLIENT
    if (userRole === 'CLIENT') {
      await supabase.from('seller_profiles').insert({
        id: uuidv4(),
        user_id: id,
        total_ads: 0,
        is_verified: false,
      });
    }

    const token = signToken(id);

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

// ✅ NORMAL USER LOGIN
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, role, full_name, is_verified')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      throw new AppError('Invalid email or password', 401);
    }

    // ❌ BLOCK ADMIN FROM NORMAL LOGIN
    if (user.role === 'ADMIN') {
      throw new AppError('Use admin login page', 403);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = signToken(user.id);
    const { password_hash, ...safeUser } = user;

    res.json({ user: safeUser, token });
  } catch (err) {
    next(err);
  }
}

// ✅ ADMIN LOGIN (SEPARATE)
export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('role', 'ADMIN')
      .single();

    if (error || !user) {
      throw new AppError('Admin not found', 404);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = signToken(user.id);
    const { password_hash, ...safeUser } = user;

    res.json({ user: safeUser, token });
  } catch (err) {
    next(err);
  }
}

// OTHER FUNCTIONS SAME
export async function logout(req: AuthRequest, res: Response) {
  res.json({ message: 'Logged out successfully' });
}

export async function me(req: AuthRequest, res: Response) {
  res.json({ user: req.user });
}