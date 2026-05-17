import pdfDocumentRepository from '../repositories/pdfDocumentRepository.js';
import { processPdf, chatWithPdf } from './pdfService.js';
import { bufferToBase64, base64ToBuffer } from './storageService.js';

class PdfDocumentService {
  async getUserPdfs(userId) {
    if (!userId) throw Object.assign(new Error('User ID is required'), { status: 401 });
    return pdfDocumentRepository.findUserPdfs(userId);
  }

  async getPdfById(documentId, userId) {
    if (!userId) throw Object.assign(new Error('User ID is required'), { status: 401 });
    
    const pdf = await pdfDocumentRepository.findPdfByIdAndUser(documentId, userId);
    if (!pdf) throw Object.assign(new Error('Document not found'), { status: 404 });
    if (!pdf.pdfData) throw Object.assign(new Error('PDF data is missing'), { status: 500 });
    if (!pdf.pdfData.startsWith('data:application/pdf;base64,')) {
      throw Object.assign(new Error('Invalid PDF data format'), { status: 500 });
    }

    return { 
      data: pdf.pdfData,
      title: pdf.title,
      pageCount: pdf.pageCount
    };
  }

  async uploadAndProcessPdf(file, userId) {
    if (!file) throw Object.assign(new Error('No file uploaded'), { status: 400 });
    if (!userId) throw Object.assign(new Error('User ID is required'), { status: 401 });

    const pdfData = bufferToBase64(file.buffer);
    const { documentChunks, pageCount } = await processPdf(file.buffer);

    const pdfDocData = {
      userId,
      title: file.originalname,
      pdfData,
      pageCount,
      documentChunks,
      chatHistory: []
    };

    const savedPdf = await pdfDocumentRepository.savePdf(pdfDocData);

    return {
      _id: savedPdf._id,
      title: savedPdf.title,
      pageCount: savedPdf.pageCount,
      createdAt: savedPdf.createdAt
    };
  }

  async deletePdf(documentId, userId) {
    if (!userId) throw Object.assign(new Error('User ID is required'), { status: 401 });
    
    const doc = await pdfDocumentRepository.deletePdf(documentId, userId);
    if (!doc) throw Object.assign(new Error('Document not found'), { status: 404 });
    
    return doc;
  }

  async chatWithUserPdf(documentId, userId, messageContent) {
    if (!userId) throw Object.assign(new Error('User ID is required'), { status: 401 });

    const pdf = await pdfDocumentRepository.findPdfByIdAndUser(documentId, userId);
    if (!pdf) throw Object.assign(new Error('PDF not found'), { status: 404 });

    const pdfBuffer = base64ToBuffer(pdf.pdfData);
    const { answer, sourcePages, sources } = await chatWithPdf(
      pdfBuffer,
      messageContent,
      pdf.chatHistory
    );

    pdf.chatHistory.push({
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    });

    pdf.chatHistory.push({
      role: 'assistant',
      content: answer,
      sourcePages: sourcePages,
      sources: sources,
      timestamp: new Date()
    });

    await pdfDocumentRepository.savePdf(pdf);

    return { 
      message: answer,
      sourcePages: sourcePages,
      sources: sources,
      chatHistory: pdf.chatHistory
    };
  }

  async getChatHistory(documentId, userId) {
    if (!userId) throw Object.assign(new Error('User ID is required'), { status: 401 });

    const doc = await pdfDocumentRepository.findPdfByIdAndUser(documentId, userId);
    if (!doc) throw Object.assign(new Error('Document not found'), { status: 404 });
    
    return doc.chatHistory || [];
  }
}

export default new PdfDocumentService();
