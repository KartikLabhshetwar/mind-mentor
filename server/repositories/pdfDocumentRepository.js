import PdfDocument from '../models/pdfDocument.js';

class PdfDocumentRepository {
  async findUserPdfs(userId) {
    return PdfDocument.find({ userId })
      .select('title pageCount createdAt')
      .sort({ createdAt: -1 });
  }

  async findPdfByIdAndUser(documentId, userId) {
    return PdfDocument.findOne({ 
      _id: documentId,
      userId: userId 
    });
  }

  async deletePdf(documentId, userId) {
    return PdfDocument.findOneAndDelete({
      _id: documentId,
      userId: userId
    });
  }

  async savePdf(pdfData) {
    const pdfDoc = new PdfDocument(pdfData);
    return pdfDoc.save();
  }
}

export default new PdfDocumentRepository();
