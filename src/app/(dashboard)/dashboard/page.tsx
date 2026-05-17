"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ChatHistory } from "@/components/unified/ChatHistory";
import { PanelRight } from "lucide-react";

export default function UnifiedDashboard() {
  const { data: session } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  return (
    <div className="unified-dark h-screen flex bg-[var(--bg-primary)] overflow-hidden">
      {/* Left Sidebar */}
      <div className="hidden md:block">
        <ChatHistory
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSelectConversation={setActiveConversationId}
          activeConversationId={activeConversationId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)]">
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">Mind Mentor</h1>
          <button
            onClick={() => setContextPanelOpen(!contextPanelOpen)}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          >
            <PanelRight className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Chat content placeholder */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-muted)] flex items-center justify-center mx-auto">
              <span className="text-2xl">🎓</span>
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">What would you like to learn?</h2>
            <p className="text-sm text-[var(--text-secondary)]">Ask anything, generate quizzes, find resources, or plan your studies.</p>
          </div>
        </div>

        {/* Input placeholder */}
        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto bg-[var(--input-bg)] rounded-xl px-4 py-3 text-[var(--text-muted)] text-sm">
            Type / for commands...
          </div>
        </div>
      </div>

      {/* Right Context Panel placeholder */}
      {contextPanelOpen && (
        <div className="hidden lg:block w-72 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Context panel loading...</p>
        </div>
      )}
    </div>
  );
}
