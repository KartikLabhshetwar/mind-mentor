import mongoose from "mongoose";

// Define interfaces for type safety
export interface IToolCall {
  toolName: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface IAttachment {
  type: 'pdf';
  documentId: mongoose.Types.ObjectId;
}

export interface IMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: IToolCall[];
  attachments?: IAttachment[];
  createdAt: Date;
}

export interface IConversation {
  userId: mongoose.Types.ObjectId;
  title: string;
  model: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ToolCallSchema = new mongoose.Schema({
  toolName: {
    type: String,
    required: true,
  },
  args: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { _id: false });

const AttachmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['pdf'],
    required: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PdfDocument',
  },
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
  toolCalls: [ToolCallSchema],
  attachments: [AttachmentSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const conversationSchema = new mongoose.Schema<IConversation>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'New Conversation',
  },
  model: {
    type: String,
    default: 'groq',
  },
  messages: [MessageSchema],
}, {
  timestamps: true,
});

const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;
