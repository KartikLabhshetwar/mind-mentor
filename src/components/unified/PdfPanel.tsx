"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Trash2, Upload, Loader2 } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import React from "react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

export interface PdfDocument {
  _id: string;
  title: string;
  pageCount: number;
  createdAt: string;
}

interface PdfPanelProps {
  userId: string;
  onChatWithPdf: (documentId: string, question: string) => void;
  onSelectPdf?: (documentId: string, title: string) => void;
  onClose: () => void;
}

const MemoizedPage = React.memo(Page);
const MemoizedDocument = React.memo(Document);

function base64ToBuffer(base64String: string): Uint8Array {
  const base64Data = base64String.replace(/^data:application\/pdf;base64,/, "");
  const binaryString = atob(base64Data);
  const buffer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    buffer[i] = binaryString.charCodeAt(i);
  }
  return buffer;
}

export function PdfPanel({ userId, onSelectPdf, onClose }: PdfPanelProps) {
  const [documents, setDocuments] = useState<PdfDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | Uint8Array | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(0.8);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setListLoading(true);
      const res = await fetch("/api/pdf", {
        headers: { "x-user-id": userId },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : data.pdfs || []);
      }
    } catch { /* silent */ } finally {
      setListLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const loadPdf = useCallback(async (docId: string) => {
    setLoading(true);
    setSelectedDocId(docId);
    setPdfData(null);
    setNumPages(0);
    try {
      const res = await fetch(`/api/pdf/${docId}`, {
        headers: { "x-user-id": userId },
      });
      if (!res.ok) return;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.data) {
          setPdfData(data.data);
          setPdfTitle(data.title || "Document");
          setCurrentPage(1);
        }
      } else {
        const buffer = await res.arrayBuffer();
        setPdfData(new Uint8Array(buffer));
        setPdfTitle("Document");
        setCurrentPage(1);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleUpload = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") return;
    if (file.size > 10 * 1024 * 1024) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("pdf", file);
    try {
      const res = await fetch("/api/pdf/upload", { method: "POST", body: formData });
      if (res.ok) {
        const doc = await res.json();
        setDocuments(prev => [doc, ...prev]);
        loadPdf(doc._id);
      }
    } catch { /* silent */ } finally {
      setUploading(false);
    }
  }, [loadPdf]);

  const handleDelete = useCallback(async (docId: string) => {
    try {
      const res = await fetch(`/api/pdf?id=${docId}`, { method: "DELETE", headers: { "x-user-id": userId } });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d._id !== docId));
        if (selectedDocId === docId) {
          setSelectedDocId(null);
          setPdfData(null);
        }
      }
    } catch { /* silent */ }
  }, [userId, selectedDocId]);

  const documentOptions = useMemo(() => {
    if (!pdfData) return { file: null, loading: null };
    if (pdfData instanceof Uint8Array) return { file: { data: pdfData }, loading: null };
    return { file: { data: base64ToBuffer(pdfData) }, loading: null };
  }, [pdfData]);

  const pageOptions = useMemo(() => ({
    pageNumber: currentPage,
    scale,
    renderTextLayer: true,
    renderAnnotationLayer: true,
    className: "select-none",
    loading: null,
  }), [currentPage, scale]);

  if (!selectedDocId) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] flex-shrink-0">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Documents</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-muted)]"
              title="Upload PDF"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors">
              <X className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); e.target.value = ""; }} />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {listLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-8 w-8 text-[var(--text-muted)] mb-2" />
              <p className="text-xs text-[var(--text-muted)]">No documents yet</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
              >
                Upload PDF
              </button>
            </div>
          ) : (
            documents.map(doc => (
              <div
                key={doc._id}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] cursor-pointer transition-colors"
                onClick={() => { loadPdf(doc._id); onSelectPdf?.(doc._id, doc.title); }}
              >
                <FileText className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{doc.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{doc.pageCount} pages</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(doc._id); }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="h-3 w-3 text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)] flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => { setSelectedDocId(null); setPdfData(null); }} className="p-1 rounded-lg hover:bg-[var(--bg-surface)] transition-colors">
            <ChevronLeft className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          </button>
          <p className="text-xs text-[var(--text-primary)] truncate font-medium">{pdfTitle}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors">
          <X className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-color)] bg-[var(--bg-surface)]/50 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1 rounded hover:bg-[var(--bg-surface)] disabled:opacity-30 transition-colors">
            <ChevronLeft className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          </button>
          <span className="text-xs text-[var(--text-secondary)] min-w-[60px] text-center">{currentPage} / {numPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages} className="p-1 rounded hover:bg-[var(--bg-surface)] disabled:opacity-30 transition-colors">
            <ChevronRight className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale(s => Math.max(0.4, s - 0.1))} className="p-1 rounded hover:bg-[var(--bg-surface)] transition-colors">
            <ZoomOut className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          </button>
          <span className="text-xs text-[var(--text-secondary)] min-w-[36px] text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-1 rounded hover:bg-[var(--bg-surface)] transition-colors">
            <ZoomIn className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* PDF viewer */}
      <div className="flex-1 overflow-auto flex justify-center p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : pdfData ? (
          <MemoizedDocument
            {...documentOptions}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={() => setPdfData(null)}
          >
            <MemoizedPage {...pageOptions} />
          </MemoizedDocument>
        ) : (
          <p className="text-xs text-[var(--text-muted)] mt-8">Failed to load PDF</p>
        )}
      </div>
    </div>
  );
}
