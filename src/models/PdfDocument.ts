import mongoose from "mongoose";

// Define interfaces for type safety
export interface IDocumentChunk {
  text: string;
  pageNumber: number;
  embedding?: number[];
}

export interface IPdfDocument {
  userId: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  title: string;
  pdfData: string;
  pageCount: number;
  documentChunks: IDocumentChunk[];
  createdAt: Date;
}

const DocumentChunkSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  pageNumber: {
    type: Number,
    required: true,
  },
  embedding: [Number],
}, { _id: false });

const pdfDocumentSchema = new mongoose.Schema<IPdfDocument>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  pdfData: {
    type: String,
    required: true,
  },
  pageCount: {
    type: Number,
    default: 0,
  },
  documentChunks: [DocumentChunkSchema],
}, {
  timestamps: true,
});

const PdfDocument = mongoose.models.PdfDocument || mongoose.model<IPdfDocument>('PdfDocument', pdfDocumentSchema);

export default PdfDocument;
