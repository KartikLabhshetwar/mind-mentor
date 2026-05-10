'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import PdfViewer from './PdfViewer';
import ChatInterface from './ChatInterface';
import PacmanLoader from 'react-spinners/PacmanLoader';
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  page: number;
  content: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sourcePages: number[];
  sources?: Source[];
  timestamp: Date;
  _id: string;
}

// Interface for the raw message data from the server
interface ServerMessage {
  role: 'user' | 'assistant';
  content: string;
  sourcePages: number[];
  sources?: Source[];
  timestamp: string;
  _id: string;
}

interface PdfChatProps {
  documentId: string;
}

export default function PdfChat({ documentId }: PdfChatProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeView, setActiveView] = useState<'pdf' | 'chat'>('pdf');
  const { toast } = useToast();
  const { data: session } = useSession();

  // Memoize PdfViewer to prevent re-renders when chat state changes
  const memoizedPdfViewer = useMemo(() => (
    <PdfViewer
      documentId={documentId}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    />
  ), [documentId, currentPage]);

  // Load chat history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/pdf/${documentId}/history`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-user-id': session?.user?.id || '',
          },
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to load chat history');
        }
        
        const data = await response.json();
        
        // Check if data is an array (direct chat history)
        if (Array.isArray(data)) {
          const formattedHistory = data.map((msg: ServerMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            sourcePages: msg.sourcePages || [] // Ensure sourcePages is always an array
          }));
          setMessages(formattedHistory);
        } else if (data && data.chatHistory) {
          // Handle case where chat history is wrapped in an object
          const formattedHistory = data.chatHistory.map((msg: ServerMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            sourcePages: msg.sourcePages || []
          }));
          setMessages(formattedHistory);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('Error loading chat history:', err);
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load chat history",
          variant: "destructive",
        });
        setMessages([]);
      } finally {
        setInitialLoading(false);
      }
    };

    if (session?.user?.id) {
      loadHistory();
    } else {
      setInitialLoading(false);
    }
  }, [documentId, toast, session?.user?.id]);

  const handleSubmit = async (content: string) => {
    if (!content.trim() || !session?.user?.id) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/pdf/${documentId}/chat`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-user-id': session.user.id,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const data = await response.json();
      
      const chatHistory = Array.isArray(data) ? data : data.chatHistory;
      
      if (chatHistory) {
        const formattedHistory = chatHistory.map((msg: ServerMessage) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          sourcePages: msg.sourcePages || []
        }));
        setMessages(formattedHistory);
      } else {
        console.error('Invalid chat response format:', data);
        toast({
          title: "Error",
          description: "Received invalid response format from server",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <PacmanLoader color="#538B81" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-muted/10">
      {/* Mobile View Selector */}
      <div className="lg:hidden flex items-center justify-center gap-2 p-2 bg-background border-b">
        <Button
          variant={activeView === 'pdf' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveView('pdf')}
          className="flex-1 max-w-[160px]"
        >
          <FileText className="h-4 w-4 mr-2" />
          Document
        </Button>
        <Button
          variant={activeView === 'chat' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveView('chat')}
          className="flex-1 max-w-[160px]"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 lg:gap-4 lg:p-4 overflow-hidden">
        <div className={cn(
          "lg:w-[55%] w-full transition-all duration-300",
          activeView === 'pdf' ? 'block' : 'hidden lg:block'
        )}>
          {memoizedPdfViewer}
        </div>
        <div className={cn(
          "lg:w-[45%] w-full transition-all duration-300",
          activeView === 'chat' ? 'block' : 'hidden lg:block'
        )}>
          <ChatInterface
            messages={messages}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      
    </div>
  );
} 