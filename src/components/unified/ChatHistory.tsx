"use client";

import { useState, useEffect, useCallback, type MutableRefObject } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Plus, MessageSquare, LogOut, PanelLeftClose, PanelLeft, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Conversation {
  _id: string;
  messages: { role: string; content: string; timestamp: string }[];
  createdAt: string;
}

interface ChatHistoryProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectConversation: (id: string | null) => void;
  activeConversationId: string | null;
  onRefreshRef?: MutableRefObject<(() => void) | null>;
}

export function ChatHistory({ isCollapsed, onToggleCollapse, onSelectConversation, activeConversationId, onRefreshRef }: ChatHistoryProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHistory = useCallback(async () => {
    if (!session?.token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/chat-history`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch { /* silent */ }
  }, [session?.token]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    if (onRefreshRef) onRefreshRef.current = fetchHistory;
  }, [onRefreshRef, fetchHistory]);

  const getTitle = (conv: Conversation) => {
    const firstMsg = conv.messages.find(m => m.role === "user");
    if (!firstMsg) return "New Chat";
    return firstMsg.content.slice(0, 40) + (firstMsg.content.length > 40 ? "..." : "");
  };

  const filtered = conversations.filter(c =>
    !searchQuery || getTitle(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupByDate = (convs: Conversation[]) => {
    const groups: Record<string, Conversation[]> = {};
    const now = new Date();
    convs.forEach(c => {
      const d = new Date(c.createdAt);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      const label = diff === 0 ? "Today" : diff === 1 ? "Yesterday" : diff < 7 ? "This Week" : "Older";
      (groups[label] ??= []).push(c);
    });
    return groups;
  };

  const groups = groupByDate(filtered);

  return (
    <div className={cn(
      "flex flex-col h-full bg-[var(--bg-sidebar)] text-[var(--text-primary)] transition-all duration-300",
      isCollapsed ? "w-16" : "w-60"
    )}>
      <div className="p-3 flex items-center gap-2">
        <button
          onClick={() => onSelectConversation(null)}
          className={cn(
            "flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors",
            isCollapsed ? "p-2" : "flex-1 px-3 py-2"
          )}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span className="text-sm">New Chat</span>}
        </button>
        <button onClick={onToggleCollapse} className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors">
          {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 bg-[var(--bg-surface)] rounded-lg px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none flex-1"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 space-y-4">
        {Object.entries(groups).map(([label, convs]) => (
          <div key={label}>
            {!isCollapsed && <p className="text-xs text-[var(--text-muted)] px-2 py-1">{label}</p>}
            {convs.map(conv => (
              <button
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg text-sm transition-colors",
                  isCollapsed ? "p-2 justify-center" : "px-3 py-2",
                  activeConversationId === conv._id
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                )}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="truncate text-left">{getTitle(conv)}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className={cn("p-3 border-t border-[var(--border-color)]", isCollapsed && "flex flex-col items-center gap-2")}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="bg-[var(--bg-surface)] text-xs">{session?.user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate flex-1">{session?.user?.name || "User"}</span>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="p-1.5 rounded hover:bg-[var(--bg-surface)]">
              <LogOut className="h-4 w-4 text-[var(--text-muted)]" />
            </button>
          </div>
        ) : (
          <>
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="bg-[var(--bg-surface)] text-xs">{session?.user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="p-1.5 rounded hover:bg-[var(--bg-surface)]">
              <LogOut className="h-4 w-4 text-[var(--text-muted)]" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
