"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChatArea, type Message, type MessageContent } from "@/components/unified/ChatArea";
import { ChatInput } from "@/components/unified/ChatInput";
import { streamChat, type ChatHistoryMessage } from "@/lib/agent-client";
import { ContextPanel } from "@/components/unified/ContextPanel";
import { PdfPanel } from "@/components/unified/PdfPanel";
import { PanelRight, X, History, Plus, FileText } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Conversation {
  _id: string;
  messages: { role: string; content: string }[];
  createdAt: string;
}

export default function UnifiedDashboard() {
  const { data: session } = useSession();
  const [contextPanelOpen, setContextPanelOpen] = useState(false);
  const [pdfPanelOpen, setPdfPanelOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const conversationIdRef = useRef<string | null>(null);
  const [activePdfId, setActivePdfId] = useState<string | null>(null);
  const [activePdfTitle, setActivePdfTitle] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!historyOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [historyOpen]);

  const loadPdfChatHistory = useCallback(async (pdfId: string) => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`/api/pdf/${pdfId}/history`, {
        headers: { "x-user-id": session.user.id },
      });
      if (res.ok) {
        const history = await res.json();
        if (Array.isArray(history) && history.length > 0) {
          const loaded: Message[] = history.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: [{ type: "text" as const, data: m.content }],
          }));
          setMessages(loaded);
        }
      }
    } catch { /* silent */ }
  }, [session?.user?.id]);

  const fetchHistory = useCallback(async () => {
    if (!session?.token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/chat-history`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (res.ok) setConversations(await res.json());
    } catch { /* silent */ }
  }, [session?.token]);

  const saveMessages = useCallback(async (userContent: string, assistantContent: string, structuredParts?: MessageContent[]) => {
    if (!session?.token) return;
    try {
      let serializedAssistant = assistantContent;
      if (structuredParts && structuredParts.length > 0) {
        const allContent: MessageContent[] = assistantContent
          ? [{ type: "text", data: assistantContent }, ...structuredParts]
          : structuredParts;
        serializedAssistant = JSON.stringify({ __structured: true, parts: allContent });
      }
      const res = await fetch(`${API_URL}/api/user/chat-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({
          conversationId: conversationIdRef.current,
          messages: [
            { role: "user", content: userContent },
            { role: "assistant", content: serializedAssistant },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!conversationIdRef.current) {
          conversationIdRef.current = data._id;
          setActiveConversationId(data._id);
        }
        fetchHistory();
      }
    } catch { /* silent */ }
  }, [session?.token, fetchHistory]);

  const loadConversation = useCallback(async (id: string | null) => {
    setActiveConversationId(id);
    conversationIdRef.current = id;
    setHistoryOpen(false);
    if (!id) {
      setMessages([]);
      setActivePdfId(null);
      setActivePdfTitle(null);
      return;
    }
    if (!session?.token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/chat-history/${id}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (res.ok) {
        const conv = await res.json();
        let restoredPdfId: string | null = null;
        let restoredPdfTitle: string | null = null;

        const loaded: Message[] = conv.messages.map((m: { role: string; content: string }) => {
          if (m.role === "assistant") {
            try {
              const parsed = JSON.parse(m.content);
              if (parsed.__structured && Array.isArray(parsed.parts)) {
                const pdfPart = parsed.parts.find((p: { type: string }) => p.type === "pdf");
                if (pdfPart) {
                  try {
                    const pdfMeta = JSON.parse(pdfPart.data);
                    if (pdfMeta.id) {
                      restoredPdfId = pdfMeta.id;
                      restoredPdfTitle = pdfMeta.title || "PDF";
                    }
                  } catch { /* ignore */ }
                }
                return { role: "assistant" as const, content: parsed.parts as MessageContent[] };
              }
            } catch { /* not structured JSON, treat as plain text */ }
          }
          return {
            role: m.role as "user" | "assistant",
            content: [{ type: "text" as const, data: m.content }],
          };
        });
        setMessages(loaded);
        setActivePdfId(restoredPdfId);
        setActivePdfTitle(restoredPdfTitle);
      }
    } catch { /* silent */ }
  }, [session?.token]);

  const startNewChat = () => {
    conversationIdRef.current = null;
    setActiveConversationId(null);
    setActivePdfId(null);
    setActivePdfTitle(null);
    setMessages([]);
    setHistoryOpen(false);
  };

  const handlePdfChat = useCallback(async (documentId: string, question: string) => {
    if (!session?.user?.id) return;
    const userMsg: Message = { role: "user", content: [{ type: "text", data: question }] };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      const res = await fetch(`/api/pdf/${documentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": session.user.id },
        body: JSON.stringify({ content: question }),
      });
      if (res.ok) {
        const data = await res.json();
        const answer = data.message || data.answer || "";
        const sourcePages = data.sourcePages || [];
        const sourceText = sourcePages.length > 0 ? `\n\n*Sources: pages ${sourcePages.join(", ")}*` : "";
        const pdfMeta: MessageContent = { type: "pdf" as const, data: JSON.stringify({ title: activePdfTitle || "PDF", id: documentId }) };
        const assistantMsg: Message = {
          role: "assistant",
          content: [{ type: "text", data: answer + sourceText }],
        };
        setMessages(prev => [...prev, assistantMsg]);
        saveMessages(question, answer + sourceText, [pdfMeta]);
      } else {
        const errData = await res.json().catch(() => null);
        const errMsg = errData?.error || `PDF chat failed (${res.status})`;
        setMessages(prev => [...prev, { role: "assistant", content: [{ type: "text", data: `Error: ${errMsg}` }] }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: [{ type: "text", data: "Error: Failed to connect to PDF service" }] }]);
    } finally {
      setIsStreaming(false);
    }
  }, [session?.user?.id, saveMessages, activePdfTitle]);

  const buildHistory = useCallback((msgs: Message[]): ChatHistoryMessage[] => {
    return msgs
      .map((m) => {
        const text = m.content
          .filter((c) => c.type === "text")
          .map((c) => c.data)
          .join("\n")
          .trim();
        if (!text) return null;
        return { role: m.role, content: text };
      })
      .filter((m): m is ChatHistoryMessage => m !== null)
      .slice(-20);
  }, []);

  const handleSend = useCallback(async (message: string) => {
    if (!session?.token) return;

    if (activePdfId) {
      handlePdfChat(activePdfId, message);
      return;
    }

    const command = message.startsWith("/") ? message.split(" ")[0].slice(1) : undefined;
    const userMsg: Message = { role: "user", content: [{ type: "text", data: message }] };
    const history = buildHistory(messages);
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const structuredContent: MessageContent[] = [];
    let currentText = "";
    setMessages(prev => [...prev, { role: "assistant", content: [] }]);

    await streamChat(
      message,
      session.token,
      { page: "/dashboard", command },
      (event) => {
        if (event.type === "text") {
          currentText += event.data;
          const textContent: MessageContent = { type: "text", data: currentText };
          const nonTextContent = structuredContent.filter(c => c.type !== "text");
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: [textContent, ...nonTextContent] };
            return updated;
          });
        } else {
          structuredContent.push(event);
          const textContent = currentText ? [{ type: "text" as const, data: currentText }] : [];
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: [...textContent, ...structuredContent] };
            return updated;
          });
        }
      },
      () => {
        setIsStreaming(false);
        const nonTextParts = structuredContent.filter(c => c.type !== "text");
        saveMessages(message, currentText, nonTextParts.length > 0 ? nonTextParts : undefined);
      },
      (error) => {
        setIsStreaming(false);
        if (currentText) {
          saveMessages(message, currentText);
        } else {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: [{ type: "text", data: `Error: ${error}` }] };
            return updated;
          });
        }
      },
      history
    );
  }, [session, saveMessages, activePdfId, handlePdfChat, messages, buildHistory]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) return;

    if (file.type === "application/pdf") {
      setUploading(true);
      setUploadingFileName(file.name);
      const formData = new FormData();
      formData.append("pdf", file);
      try {
        const res = await fetch("/api/pdf/upload", { method: "POST", body: formData });
        if (res.ok) {
          const doc = await res.json();
          setActivePdfId(doc._id);
          setActivePdfTitle(doc.title);
          setPdfPanelOpen(true);
          conversationIdRef.current = null;
          setActiveConversationId(null);
          const pdfContent: MessageContent = { type: "pdf" as const, data: JSON.stringify({ title: doc.title, pageCount: doc.pageCount, id: doc._id }) };
          const textContent = `I've loaded **"${doc.title}"** (${doc.pageCount} pages). Ask me anything — I can summarize, explain concepts, or answer specific questions.`;
          setMessages([{
            role: "assistant",
            content: [pdfContent, { type: "text", data: textContent }],
          }]);
          saveMessages(`[Uploaded PDF: ${doc.title}]`, textContent, [pdfContent]);
        }
      } catch { /* silent */ } finally {
        setUploading(false);
        setUploadingFileName(null);
      }
      return;
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageText = `[Uploaded image: ${file.name}]`;
        const responseText = `Image "${file.name}" received. You can ask me questions about its content alongside your studies.`;
        setMessages(prev => [...prev, {
          role: "user",
          content: [{ type: "text", data: imageText }],
        }]);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: [{ type: "text", data: responseText }],
        }]);
        saveMessages(imageText, responseText);
      };
      reader.readAsDataURL(file);
    }
  }, [saveMessages]);

  const handleQuizSubmit = async (quizId: string, answers: { questionIndex: number; answer: number }[], questions: { question: string; options: string[]; correctAnswer: number }[]) => {
    try {
      await fetch(`${API_URL}/api/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.token}` },
        body: JSON.stringify({ quizId, answers, questions }),
      });
    } catch { /* silent */ }
  };

  const getTitle = (conv: Conversation) => {
    const first = conv.messages.find(m => m.role === "user");
    if (!first) return "New Chat";
    let text = first.content;
    try {
      const parsed = JSON.parse(text);
      if (parsed.__structured && Array.isArray(parsed.parts)) {
        const textPart = parsed.parts.find((p: { type: string }) => p.type === "text");
        text = textPart?.data || "Chat";
      }
    } catch { /* plain text */ }
    return text.slice(0, 50) + (text.length > 50 ? "..." : "");
  };

  return (
    <div className="unified-dark relative h-[calc(100vh-2rem)] flex flex-col bg-[var(--bg-primary)] rounded-xl overflow-hidden border border-[var(--border-color)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setHistoryOpen(!historyOpen); if (!historyOpen) fetchHistory(); }}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
            title="Chat history"
          >
            <History className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={startNewChat}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
            title="New chat"
          >
            <Plus className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">
            {activePdfId ? "PDF Chat" : "AI Tutor"}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setPdfPanelOpen(!pdfPanelOpen); if (pdfPanelOpen) setContextPanelOpen(false); else setContextPanelOpen(false); }}
            className={`p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors ${pdfPanelOpen ? "bg-[var(--bg-surface)]" : ""}`}
            title="Documents"
          >
            <FileText className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={() => { setContextPanelOpen(!contextPanelOpen); if (contextPanelOpen) setPdfPanelOpen(false); else setPdfPanelOpen(false); }}
            className={`p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors ${contextPanelOpen ? "bg-[var(--bg-surface)]" : ""}`}
            title="Study dashboard"
          >
            <PanelRight className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* History dropdown */}
      {historyOpen && (
        <div ref={historyRef} className="absolute z-40 top-14 left-2 w-72 max-h-80 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-y-auto">
          <div className="p-2 space-y-0.5">
            {conversations.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] p-3 text-center">No conversations yet</p>
            )}
            {conversations.map(conv => (
              <button
                key={conv._id}
                onClick={() => loadConversation(conv._id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                  activeConversationId === conv._id
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                }`}
              >
                {getTitle(conv)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat column */}
        <div className="flex flex-col flex-1 min-w-0">
          <ChatArea messages={messages} isStreaming={isStreaming} onQuizSubmit={handleQuizSubmit} onSend={handleSend} />
          <ChatInput
            onSend={handleSend}
            onFileUpload={handleFileUpload}
            disabled={isStreaming}
            uploading={uploading}
            uploadingFileName={uploadingFileName ?? undefined}
            activePdfTitle={activePdfTitle ?? undefined}
            onExitPdf={activePdfId ? () => { setActivePdfId(null); setActivePdfTitle(null); setMessages([]); } : undefined}
          />
        </div>

        {/* PDF panel */}
        {pdfPanelOpen && session?.user?.id && (
          <div className="w-80 lg:w-96 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] flex-shrink-0 overflow-hidden">
            <PdfPanel
              userId={session.user.id}
              onChatWithPdf={(docId, question) => {
                setActivePdfId(docId);
                handlePdfChat(docId, question);
              }}
              onSelectPdf={(docId, title) => {
                setActivePdfId(docId);
                setActivePdfTitle(title);
                conversationIdRef.current = null;
                setActiveConversationId(null);
                setMessages([]);
                loadPdfChatHistory(docId);
              }}
              onClose={() => setPdfPanelOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Context panel overlay */}
      {contextPanelOpen && (
        <div className="absolute right-0 top-0 z-40 h-full w-80 bg-[var(--bg-secondary)] border-l border-[var(--border-color)] shadow-lg overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] flex-shrink-0">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Study Dashboard</h3>
            <button onClick={() => setContextPanelOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors">
              <X className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ContextPanel onTriggerCommand={(cmd) => handleSend(cmd)} token={session?.token} />
          </div>
        </div>
      )}
    </div>
  );
}
