import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  messages: [{
    role: { type: String, enum: ["user", "assistant"] },
    content: String,
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export default mongoose.models.ChatHistory || mongoose.model("ChatHistory", chatHistorySchema);
