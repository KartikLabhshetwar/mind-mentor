'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ChatThread } from './chat-thread';
import { ChatComposer } from './chat-composer';
import { useAppStore } from '@/store/app-store';

interface ChatPageProps {
  conversationId?: string;
  initialMessages?: any[];
}

export function ChatPage({ conversationId, initialMessages }: ChatPageProps) {
  const selectedModel = useAppStore((s) => s.selectedModel);
  const startTimer = useAppStore((s) => s.startTimer);

  const { messages, sendMessage, status } = useChat({
    id: conversationId,
    initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { conversationId, model: selectedModel },
    }),
  });

  // Handle timer tool results
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === 'assistant') {
    const timerPart = lastMessage.parts?.find(
      (p: any) => p.type === 'tool-startTimer' && p.state === 'output-available'
    );
    if (timerPart) {
      const output = (timerPart as any).output;
      if (output?.started) {
        startTimer(output.duration, output.type);
      }
    }
  }

  const handleSend = (text: string, _files?: File[]) => {
    // TODO: Handle file uploads — upload PDF first, then send message with documentId
    sendMessage({ text });
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F4ED]">
      <ChatThread messages={messages} status={status} />
      <ChatComposer onSend={handleSend} disabled={status !== 'ready'} />
    </div>
  );
}
