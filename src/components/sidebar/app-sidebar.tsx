'use client';

import { useRouter } from 'next/navigation';
import { Plus, BookOpen, BarChart3, Timer } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { ConversationList } from './conversation-list';
import { ModelSelector, ModelId } from './model-selector';
import { SidebarUserFooter } from './sidebar-footer';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  conversations: Array<{ _id: string; title: string; createdAt: string }>;
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  onOpenLibrary: () => void;
  onOpenStats: () => void;
  onOpenTimer: () => void;
}

export function AppSidebar({
  conversations,
  selectedModel,
  onModelChange,
  onOpenLibrary,
  onOpenStats,
  onOpenTimer,
}: AppSidebarProps) {
  const router = useRouter();

  return (
    <Sidebar className="bg-[#27445D] border-r border-[#335775]">
      <SidebarHeader className="p-3 space-y-3">
        <Button
          onClick={() => router.push('/chat')}
          className="w-full bg-[#497D74] hover:bg-[#538B81] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        <ModelSelector value={selectedModel} onChange={onModelChange} />
      </SidebarHeader>

      <SidebarContent>
        <ConversationList conversations={conversations} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenLibrary} className="text-[#A3D3CD] hover:bg-[#2D4D69] hover:text-white">
                  <BookOpen className="h-4 w-4" />
                  <span>My Library</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenStats} className="text-[#A3D3CD] hover:bg-[#2D4D69] hover:text-white">
                  <BarChart3 className="h-4 w-4" />
                  <span>Stats</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenTimer} className="text-[#A3D3CD] hover:bg-[#2D4D69] hover:text-white">
                  <Timer className="h-4 w-4" />
                  <span>Timer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarUserFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
