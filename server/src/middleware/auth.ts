import type { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../db/supabaseAdmin.js';
import { ApiError } from './errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { ANON_COOKIE } from '../services/anonymousService.js';
import { getCachedAuthUser, setCachedAuthUser } from '../lib/authUserCache.js';

const supabase = () => getSupabaseAdmin();

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    req.user = null;
    let sid = req.cookies?.[ANON_COOKIE] as string | undefined;
    if (!sid) {
      sid = uuidv4();
    }
    req.anonSessionId = sid;
    return next();
  }
  const cached = getCachedAuthUser(token);
  if (cached) {
    req.user = cached;
    return next();
  }
  const { data, error } = await supabase().auth.getUser(token);
  if (error || !data.user) {
    throw new ApiError(401, 'Invalid or expired session');
  }
  setCachedAuthUser(token, data.user);
  req.user = data.user;
  next();
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }
  const cached = getCachedAuthUser(token);
  if (cached) {
    req.user = cached;
    return next();
  }
  const { data, error } = await supabase().auth.getUser(token);
  if (error || !data.user) {
    throw new ApiError(401, 'Invalid or expired session');
  }
  setCachedAuthUser(token, data.user);
  req.user = data.user;
  next();
}
