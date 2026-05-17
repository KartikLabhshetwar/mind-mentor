"use client"

import { DashboardNav } from "@/components/dashboard/DashboardNav"

import { useState } from "react"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen">
      <div className="flex flex-col md:flex-row">
        {/* Mobile nav - shown only on small screens */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background z-50">
          <DashboardNav className="h-full" />
        </div>

        {/* Desktop nav - hidden on small screens */}
        <div className={cn(
          "hidden md:block fixed left-0 h-screen transition-all duration-300",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}>
          <DashboardNav 
            className="h-full" 
            onCollapse={setIsSidebarCollapsed}
          />
        </div>

        {/* Main content */}
        <div className={cn(
          "w-full transition-all duration-300",
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64",
          "pb-16 md:pb-0"
        )}>
          <main className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}