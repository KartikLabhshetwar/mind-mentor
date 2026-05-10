'use client';

import PdfChat from "@/components/pdf/PdfChat";
import { useParams } from 'next/navigation';

export default function PdfChatPage() {
  const params = useParams();
  const documentId = params.documentId as string;

  return (
    <main className="relative">
      <div className="absolute top-4 left-4 z-10">
      </div>
      <PdfChat documentId={documentId} />
    </main>
  );
} 