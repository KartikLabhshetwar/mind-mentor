"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Home, Timer, Users, LogOut, PanelLeftClose, PanelLeft, BarChart3, Settings, Sparkles } from "lucide-react"
import { signOut, useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface NavItem {
  label: string;
  icon:  React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  badge?: string;
  onClick?: () => void;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface DashboardNavProps extends React.HTMLAttributes<HTMLDivElement> {
  onCollapse?: (collapsed: boolean) => void;
}

export function DashboardNav({ className, onCollapse, ...props }: DashboardNavProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onCollapse?.(!isCollapsed);
  }

  const navSections: NavSection[] = [
    {
      title: "General",
      items: [
        {
          label: 'Home',
          icon: Home,
          href: '/home',
        },
        {
          label: 'Profile',
          icon: Users,
          href: '/profile',
        },
      ]
    },
    {
      title: "Study Tools",
      items: [
        {
          label: 'AI Tutor',
          icon: Sparkles,
          href: '/dashboard',
        },
{
          label: 'Timer',
          icon: Timer,
          href: '/timer',
        },
        {
          label: 'Notes',
          icon: FileText,
          href: '/notes',
        },
        {
          label: 'Analytics',
          icon: BarChart3,
          href: '/insights',
        },
      ]
    },
    {
      title: "Account",
      items: [
        {
          label: 'Settings',
          icon: Settings,
          href: '/settings/reminders',
        },
        {
          label: 'Log out',
          icon: LogOut,
          href: '#',
          onClick: () => signOut({ callbackUrl: '/' })
        }
      ]
    }
  ]

  return (
    <nav 
      className={cn(
        "relative h-full bg-background text-foreground overflow-y-auto transition-all duration-300",
        isCollapsed ? "md:w-20" : "md:w-64",
        className
      )} 
      {...props}
    >
      <div className="px-3 py-2">
        {/* Desktop View */}
        <div className="hidden md:block">
          <div className={cn("mb-6", isCollapsed ? "px-2" : "px-4")}>
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-10 w-10 bg-[#F2EDE0]">
                <AvatarImage 
                  src={session?.user?.image || "/images/default-avatar.png"} 
                  alt={session?.user?.name || '@user'} 
                />
                <AvatarFallback>{session?.user?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              {!isCollapsed && session?.user?.name && (
                <p className="mt-2 text-sm font-medium text-center">Welcome, {session.user.name}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full flex items-center justify-center gap-2",
                isCollapsed && "px-0"
              )}
              onClick={toggleCollapse}
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          {navSections.map((section, idx) => (
            <div key={section.title} className={cn(
              "py-2",
              idx !== 0 && "mt-4",
              isCollapsed && "px-0"
            )}>
              {!isCollapsed && (
                <h3 className="px-4 text-xs font-medium text-muted-foreground mb-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={item.onClick}
                    className={cn(
                      "flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-200 ease-in-out hover:bg-muted hover:text-foreground hover:shadow-md border-r-2 border-transparent",
                      pathname === item.href 
                        ? "text-foreground bg-muted border-r-2 border-primary" 
                        : "text-muted-foreground hover:border-primary",
                      isCollapsed 
                        ? "justify-center px-2 py-2.5" 
                        : "px-4 py-2.5"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4",
                      pathname === item.href ? "text-primary" : "text-foreground"
                    )} />
                    {!isCollapsed && <span>{item.label}</span>}
                    {!isCollapsed && item.badge && (
                      <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden fixed bottom-0 left-0 right-0" style={{ backgroundColor: '#EFE9D5' }}>
          <div className="flex justify-around items-center overflow-x-auto py-3 px-2">
            {navSections.flatMap(section => section.items).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={item.onClick}
                className={cn(
                  "flex flex-col items-center justify-center p-2 min-w-[70px] rounded-md transition-all duration-200 ease-in-out hover:bg-muted hover:text-foreground hover:shadow-sm border-b-2 border-transparent hover:border-primary",
                  pathname === item.href 
                    ? "text-foreground bg-muted border-b-2 border-primary" 
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5 text-foreground" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
                {item.badge && (
                  <span className="absolute top-0 right-0 text-xs bg-primary text-primary-foreground px-1 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}