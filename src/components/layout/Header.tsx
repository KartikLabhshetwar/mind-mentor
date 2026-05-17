"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { signIn, useSession } from "next-auth/react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { MindMentorLogo } from "@/components/ui/MindMentorLogo"

export function Header() {
  const { data: session } = useSession()
  const [stars, setStars] = useState<number | null>(null)
  const [animatedStars, setAnimatedStars] = useState<number>(0)

  useEffect(() => {
    async function fetchStars() {
      try {
        const res = await fetch("https://api.github.com/repos/KartikLabhshetwar/mind-mentor")
        const data = await res.json()
        setStars(data.stargazers_count)
      } catch (error) {
        console.error("Failed to fetch GitHub stars:", error)
      }
    }

    fetchStars()
  }, [])

  useEffect(() => {
    if (stars === null) return
    setAnimatedStars(0)
    if (stars === 0) return
    let current = 0
    const increment = Math.max(1, Math.floor(stars / 40))
    const interval = setInterval(() => {
      current += increment
      if (current >= stars) {
        setAnimatedStars(stars)
        clearInterval(interval)
      } else {
        setAnimatedStars(current)
      }
    }, 40)
    return () => clearInterval(interval)
  }, [stars])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#EFE9D5]/80 backdrop-blur-sm border-b-2 border-border h-14">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Home Link */}
          <div className="flex items-center gap-2">
            <Link
              href={session ? "/home" : "/"}
              className="flex items-center gap-2"
            >
              <MindMentorLogo size={32} />
              <span className="font-semibold text-sm sm:text-base">Mind Mentor</span>
            </Link>
          </div>

          {/* Navigation & Auth Buttons */}
          <nav className="flex items-center space-x-2 sm:space-x-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="https://github.com/KartikLabhshetwar/mind-mentor"
                    target="_blank"
                    className="hidden sm:inline-block px-4 py-1.5 bg-[#c1ff72] border-2 border-b-4 border-r-4 border-black rounded-lg hover:bg-[#c1ff72] hover:border-b-2 hover:border-r-2 transition-all duration-100 text-sm font-medium shadow-sm hover:shadow active:border-b-2 active:border-r-2"
                  >
                    GitHub {stars !== null ? `⭐ ${animatedStars}` : ""}
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Star on GitHub</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {!session && (
              <div className="flex gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => signIn()}
                  className="border-2 border-black text-xs sm:text-sm px-2 sm:px-4"
                >
                  Sign In
                </Button>
                <Link href="/register" passHref>
                  <button className="px-2 sm:px-4 py-1.5 bg-[#c1ff72] border-2 border-b-4 border-r-4 border-black rounded-lg hover:bg-[#c1ff72] hover:border-b-2 hover:border-r-2 transition-all duration-100 text-xs sm:text-sm font-medium shadow-sm hover:shadow active:border-b-2 active:border-r-2">
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
