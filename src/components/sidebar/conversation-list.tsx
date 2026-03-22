'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
}

interface ConversationListProps {
  conversations: Conversation[];
}

function groupByDate(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Previous 7 Days', items: [] },
    { label: 'Older', items: [] },
  ];

  conversations.forEach((c) => {
    const date = new Date(c.createdAt);
    if (date >= today) groups[0].items.push(c);
    else if (date >= yesterday) groups[1].items.push(c);
    else if (date >= weekAgo) groups[2].items.push(c);
    else groups[3].items.push(c);
  });

  return groups.filter((g) => g.items.length > 0);
}

export function ConversationList({ conversations }: ConversationListProps) {
  const params = useParams();
  const activeId = params?.conversationId;

  const groups = groupByDate(conversations);

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-sm text-[#8AC7C0] text-center">No conversations yet. Start a new chat!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {groups.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="px-3 mb-1 text-xs font-medium text-[#8AC7C0] uppercase tracking-wider">
            {group.label}
          </p>
          {group.items.map((conv) => (
            <Link
              key={conv._id}
              href={`/chat/${conv._id}`}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                'hover:bg-[#2D4D69]',
                activeId === conv._id
                  ? 'bg-[#335775] text-white'
                  : 'text-[#A3D3CD]'
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="truncate">{conv.title}</span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
