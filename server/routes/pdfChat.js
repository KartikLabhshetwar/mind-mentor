import express from 'express';
import multer from 'multer';
import * as pdfChatController from '../controllers/pdfChatController.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Health check endpoint for Transformers.js embeddings
router.get('/health', pdfChatController.healthCheck);

// Get all PDFs for a user
router.get('/', pdfChatController.getPdfs);

// Get a specific PDF
router.get('/:id', pdfChatController.getPdfById);

// Upload and process PDF
router.post('/upload', upload.single('pdf'), pdfChatController.uploadPdf);

// Delete PDF
router.delete('/:documentId', pdfChatController.deletePdf);

// Chat with PDF
router.post('/:id/chat', pdfChatController.chatWithPdfRoute);

// Get chat history
router.get('/:documentId/history', pdfChatController.getChatHistory);

export default router; 