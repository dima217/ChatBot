import { Router } from 'express';
import multer from 'multer';
import { optionalAuth } from '../middleware/auth.js';
import { getChat, touchChat } from '../services/chatService.js';
import {
  insertDocument,
  extractPlainText,
  listDocumentsForChat,
  updateDocumentStoragePath,
} from '../services/documentService.js';
import { uploadBuffer } from '../services/storageService.js';
import { ensureAnonCookieRow, ANON_COOKIE } from '../services/anonymousService.js';
import { ApiError } from '../middleware/errorHandler.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = Router({ mergeParams: true });

router.use(optionalAuth);

router.get('/', async (req, res, next) => {
  try {
    const chatId = String((req.params as { chatId: string }).chatId);
    if (req.user) {
      await getChat(chatId, { userId: req.user.id });
    } else {
      if (!req.anonSessionId) throw new ApiError(401, 'Authentication required');
      await getChat(chatId, { anonymousSessionId: req.anonSessionId });
    }
    const docs = await listDocumentsForChat(chatId);
    return res.json({
      documents: docs.map((d) => ({
        id: d.id,
        filename: d.filename,
        mime_type: d.mime_type,
        created_at: d.created_at,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const chatId = String((req.params as { chatId: string }).chatId);
    if (!req.file) {
      throw new ApiError(400, 'file is required');
    }

    if (!req.user) {
      if (!req.anonSessionId) throw new ApiError(400, 'No session');
      await ensureAnonCookieRow(req.anonSessionId);
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

    const text = await extractPlainText(req.file.buffer, req.file.mimetype);

    const doc = await insertDocument({
      chatId,
      userId: req.user?.id ?? null,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      storagePath: 'pending',
      extractedText: text,
    });

    const prefix = req.user ? `user/${req.user.id}` : `anon/${req.anonSessionId}`;
    try {
      const stored = await uploadBuffer(
        `${prefix}/${chatId}`,
        req.file.buffer,
        req.file.mimetype
      );
      await updateDocumentStoragePath(doc.id, stored.path);
    } catch (err) {
      console.error('Storage upload failed (document text is still in DB):', err);
    }
    await touchChat(chatId);
    return res.status(201).json({
      document: {
        id: doc.id,
        filename: doc.filename,
        mime_type: doc.mime_type,
        created_at: doc.created_at,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
