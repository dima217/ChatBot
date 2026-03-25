import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import {
  listChats,
  listChatsAnonymous,
  createChat,
  getChat,
  updateChatTitle,
  deleteChat,
  deleteChatAnonymous,
} from '../services/chatService.js';
import { listMessages } from '../services/messageService.js';
import { ensureAnonCookieRow, getAnonUsage, ANON_COOKIE } from '../services/anonymousService.js';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.use(optionalAuth);

router.get('/', async (req, res, next) => {
  try {
    if (req.user) {
      const chats = await listChats(req.user.id);
      return res.json({
        chats,
        anonymousSessionId: null as string | null,
        anonymousUsage: null as { used: number; limit: number; remaining: number } | null,
      });
    }
    if (!req.anonSessionId) throw new ApiError(400, 'No session');
    await ensureAnonCookieRow(req.anonSessionId);
    const chats = await listChatsAnonymous(req.anonSessionId);
    const used = await getAnonUsage(req.anonSessionId);
    const limit = env.ANON_FREE_USER_MESSAGES;
    res.cookie(ANON_COOKIE, req.anonSessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return res.json({
      chats,
      anonymousSessionId: req.anonSessionId,
      anonymousUsage: { used, limit, remaining: Math.max(0, limit - used) },
    });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    if (req.user) {
      const chat = await createChat({ userId: req.user.id, title: body.title });
      req.app.get('io')?.to(`user:${req.user.id}`).emit('chats:invalidate');
      return res.status(201).json({ chat });
    }
    if (!req.anonSessionId) throw new ApiError(400, 'No session');
    await ensureAnonCookieRow(req.anonSessionId);
    const chat = await createChat({
      anonymousSessionId: req.anonSessionId,
      title: body.title,
    });
    res.cookie(ANON_COOKIE, req.anonSessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    req.app.get('io')?.to(`anon:${req.anonSessionId}`).emit('chats:invalidate');
    return res.status(201).json({ chat, anonymousSessionId: req.anonSessionId });
  } catch (e) {
    next(e);
  }
});

router.get('/:chatId', async (req, res, next) => {
  try {
    const chatId = String(req.params.chatId);
    const chat = req.user
      ? await getChat(chatId, { userId: req.user.id })
      : await getChat(chatId, { anonymousSessionId: req.anonSessionId! });
    const messages = await listMessages(chatId);
    if (!req.user && req.anonSessionId) {
      res.cookie(ANON_COOKIE, req.anonSessionId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }
    return res.json({ chat, messages });
  } catch (e) {
    next(e);
  }
});

const patchSchema = z.object({
  title: z.string().min(1).max(200),
});

router.patch('/:chatId', requireAuth, async (req, res, next) => {
  try {
    const body = patchSchema.parse(req.body);
    const chat = await updateChatTitle(String(req.params.chatId), req.user!.id, body.title);
    req.app.get('io')?.to(`user:${req.user!.id}`).emit('chats:invalidate');
    return res.json({ chat });
  } catch (e) {
    next(e);
  }
});

router.delete('/:chatId', async (req, res, next) => {
  try {
    if (req.user) {
      await deleteChat(String(req.params.chatId), req.user.id);
      req.app.get('io')?.to(`user:${req.user.id}`).emit('chats:invalidate');
      return res.status(204).send();
    }
    if (!req.anonSessionId) throw new ApiError(401, 'Authentication required');
    await deleteChatAnonymous(String(req.params.chatId), req.anonSessionId);
    req.app.get('io')?.to(`anon:${req.anonSessionId}`).emit('chats:invalidate');
    return res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
