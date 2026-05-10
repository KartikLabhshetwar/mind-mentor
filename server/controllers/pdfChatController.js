import pdfDocumentService from '../services/pdfDocumentService.js';
import transformersEmbeddings from '../services/transformersEmbeddings.js';

export const healthCheck = async (req, res) => {
  try {
    const health = await transformersEmbeddings.healthCheck();
    const serviceInfo = await transformersEmbeddings.getServiceInfo();
    
    res.json({
      status: health.status === 'healthy' ? 'healthy' : 'unhealthy',
      embeddings: { health, info: serviceInfo },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', error: error.message, timestamp: new Date().toISOString() });
  }
};

export const getPdfs = async (req, res) => {
  try {
    const pdfs = await pdfDocumentService.getUserPdfs(req.headers['x-user-id']);
    res.json({ pdfs });
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to fetch PDFs' });
  }
};

export const getPdfById = async (req, res) => {
  try {
    const pdfData = await pdfDocumentService.getPdfById(req.params.id, req.headers['x-user-id']);
    res.json(pdfData);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to fetch PDF' });
  }
};

export const uploadPdf = async (req, res) => {
  try {
    const result = await pdfDocumentService.uploadAndProcessPdf(req.file, req.headers['x-user-id']);
    res.json(result);
  } catch (error) {
    console.error('Error in upload route:', error);
    res.status(error.status || 500).json({ 
      error: 'Error processing PDF file', 
      details: error.message 
    });
  }
};

export const deletePdf = async (req, res) => {
  try {
    await pdfDocumentService.deletePdf(req.params.documentId, req.headers['x-user-id']);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(error.status || 500).json({ error: error.message || 'Error deleting PDF' });
  }
};

export const chatWithPdfRoute = async (req, res) => {
  try {
    const result = await pdfDocumentService.chatWithUserPdf(req.params.id, req.headers['x-user-id'], req.body.content);
    res.json(result);
  } catch (error) {
    console.error('Error in PDF chat:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to process chat request' });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const history = await pdfDocumentService.getChatHistory(req.params.documentId, req.headers['x-user-id']);
    res.json(history);
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    res.status(error.status || 500).json({ error: error.message || 'Error retrieving chat history' });
  }
};
