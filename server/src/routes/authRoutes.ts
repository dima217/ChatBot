import { Router } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin } from '../db/supabaseAdmin.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(120).optional(),
});

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: body.fullName ? { full_name: body.fullName } : undefined,
    });
    if (error) {
      throw new ApiError(400, error.message);
    }
    const { data: session, error: signErr } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (signErr || !session.session) {
      throw new ApiError(400, signErr?.message || 'Could not create session');
    }
    return res.status(201).json({
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      expires_at: session.session.expires_at,
      user: session.user,
    });
  } catch (e) {
    next(e);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error || !data.session) {
      throw new ApiError(401, error?.message || 'Invalid credentials');
    }
    return res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: data.user,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

export default router;
