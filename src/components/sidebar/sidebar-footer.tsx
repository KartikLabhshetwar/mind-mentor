'use client';

import { useSession, signOut } from 'next-auth/react';
import { Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SidebarUserFooter() {
  const { data: session } = useSession();

  return (
    <div className="p-3 border-t border-[#335775]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-[#2D4D69] transition-colors text-left">
            <div className="w-8 h-8 rounded-full bg-[#497D74] flex items-center justify-center text-white text-sm font-medium shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-sm text-[#D5EBE7] truncate">
              {session?.user?.name || 'User'}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-[#27445D] border-[#497D74]">
          <DropdownMenuItem className="text-[#D5EBE7] focus:bg-[#335775] focus:text-white cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-[#D5EBE7] focus:bg-[#335775] focus:text-white cursor-pointer"
            onClick={() => signOut({ callbackUrl: '/signin' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
