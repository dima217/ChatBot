import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env.js';
import { errorHandler, ApiError } from './middleware/errorHandler.js';
import { getSupabaseAdmin } from './db/supabaseAdmin.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import documentRoutes from './routes/documentRoutes.js';

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  },
});

app.set('io', io);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '12mb' }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/health', async (_req, res, next) => {
  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from('chats').select('id').limit(1);
    if (error) throw error;
    res.json({ ok: true, db: 'connected' });
  } catch (e) {
    next(e);
  }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chats/:chatId/messages', apiLimiter, messageRoutes);
app.use('/api/chats/:chatId/documents', apiLimiter, documentRoutes);
app.use('/api/chats', apiLimiter, chatRoutes);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    const anonId = socket.handshake.auth?.anonSessionId as string | undefined;
    if (token) {
      const { data, error } = await getSupabaseAdmin().auth.getUser(token);
      if (error || !data.user) {
        return next(new Error('Unauthorized'));
      }
      socket.data.userId = data.user.id;
      socket.join(`user:${data.user.id}`);
      return next();
    }
    if (anonId) {
      socket.data.anonSessionId = anonId;
      socket.join(`anon:${anonId}`);
      return next();
    }
    return next(new Error('Missing auth'));
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.emit('ready', { ok: true });
});

app.use((_req, _res, next) => {
  next(new ApiError(404, 'Not found'));
});

app.use(errorHandler);

httpServer.listen(env.PORT, '0.0.0.0', () => {
  console.log(`API listening on 0.0.0.0:${env.PORT}`);
});
