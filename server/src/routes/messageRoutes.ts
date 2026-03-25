import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../middleware/auth.js';
import { getChat, touchChat, updateChatTitleIfPlaceholder } from '../services/chatService.js';
import {
  buildContextFromHistory,
  insertMessage,
} from '../services/messageService.js';
import {
  assertAnonCanSend,
  incrementAnonUsage,
  ensureAnonCookieRow,
  ANON_COOKIE,
} from '../services/anonymousService.js';
import { compileDocumentContext } from '../services/documentService.js';
import { attachDocsToLastUserMessage } from '../services/chatContextService.js';
import { streamCompletion, resolveProvider } from '../services/llm/index.js';
import type { ChatTurn } from '../services/llm/types.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router({ mergeParams: true });

const bodySchema = z.object({
  content: z.string().max(50_000).optional().default(''),
  imageUrls: z.array(z.string().min(8)).max(8).optional(),
  provider: z.enum(['openai', 'gemini']).optional(),
  stream: z.boolean().optional(),
});

router.use(optionalAuth);

router.post('/', async (req, res, next) => {
  try {
    const chatId = String((req.params as { chatId: string }).chatId);
    const body = bodySchema.parse(req.body);
    const wantStream = body.stream !== false;

    if (!req.user) {
      if (!req.anonSessionId) throw new ApiError(400, 'No session');
      await ensureAnonCookieRow(req.anonSessionId);
      await assertAnonCanSend(req.anonSessionId);
      res.cookie(ANON_COOKIE, req.anonSessionId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }

    if (req.user) {
      await getChat(chatId, { userId: req.user.id });
    } else {
      await getChat(chatId, { anonymousSessionId: req.anonSessionId! });
    }

    const provider = resolveProvider(body.provider);

    const docContext = await compileDocumentContext(chatId);
    const trimmed = body.content.trim();
    const hasImages = (body.imageUrls?.length ?? 0) > 0;
    if (!trimmed && !hasImages) {
      throw new ApiError(400, 'Enter a message or attach an image.');
    }
    const contentToStore = trimmed ? trimmed : '(image)';

    const userMsg = await insertMessage({
      chatId,
      role: 'user',
      content: contentToStore,
      imageUrls: body.imageUrls,
      provider: provider,
    });

    const titleBasis = trimmed || (hasImages ? 'Image' : contentToStore);
    await updateChatTitleIfPlaceholder(chatId, titleBasis);
    if (req.user) {
      req.app.get('io')?.to(`user:${req.user.id}`).emit('chats:invalidate');
    } else if (req.anonSessionId) {
      req.app.get('io')?.to(`anon:${req.anonSessionId}`).emit('chats:invalidate');
    }

    const systemPrompt = docContext.trim()
      ? 'You are a helpful assistant. The user message includes excerpts from files they uploaded for this chat; use that material when it is relevant.'
      : 'You are a helpful assistant.';

    const historyRows = await buildContextFromHistory(chatId);
    let history: ChatTurn[] = historyRows.map((h) => ({
      role: h.role,
      content: h.content,
      imageUrls: h.imageUrls,
    }));
    if (docContext.trim()) {
      history = attachDocsToLastUserMessage(history, docContext);
    }

    let assistantText = '';

    if (wantStream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const send = (event: string, data: unknown) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      send('user_message', { message: userMsg });

      try {
        for await (const chunk of streamCompletion(provider, systemPrompt, history)) {
          assistantText += chunk.text;
          send('token', { text: chunk.text });
        }
      } catch (err) {
        send('error', {
          message: err instanceof Error ? err.message : 'Stream failed',
        });
        res.end();
        return;
      }

      const assistantMsg = await insertMessage({
        chatId,
        role: 'assistant',
        content: assistantText,
        provider,
      });
      await touchChat(chatId);
      if (!req.user && req.anonSessionId) {
        await incrementAnonUsage(req.anonSessionId);
      }
      if (req.user) {
        req.app.get('io')?.to(`user:${req.user.id}`).emit('chats:invalidate');
      } else if (req.anonSessionId) {
        req.app.get('io')?.to(`anon:${req.anonSessionId}`).emit('chats:invalidate');
      }
      send('done', { message: assistantMsg });
      res.end();
      return;
    }

    for await (const chunk of streamCompletion(provider, systemPrompt, history)) {
      assistantText += chunk.text;
    }
    const assistantMsg = await insertMessage({
      chatId,
      role: 'assistant',
      content: assistantText,
      provider,
    });
    await touchChat(chatId);
    if (!req.user && req.anonSessionId) {
      await incrementAnonUsage(req.anonSessionId);
    }
    return res.status(201).json({ userMessage: userMsg, assistantMessage: assistantMsg });
  } catch (e) {
    next(e);
  }
});

export default router;
