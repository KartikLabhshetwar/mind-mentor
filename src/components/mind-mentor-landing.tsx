'use client'

import { useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Github, Brain, BookOpen, MessageCircle, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from 'next/link'

export function MindMentorLanding() {
  const controls = useAnimation()

  useEffect(() => {
    controls.start({
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.2, 1],
      transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
    })
  }, [controls])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-blue-900 text-white relative overflow-hidden">
      {/* Futuristic background elements */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl"
          animate={controls}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl"
          animate={controls}
        />
        <div className="absolute inset-0 bg-[url('/images/circuit-pattern.jpg')] opacity-10 bg-repeat"></div>
      </div>

      {/* Updated Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-400 p-10">
            Mind Mentor
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="https://github.com/KartikLabhshetwar/mind-mentor" className="relative p-10">
              <Github className="h-5 w-5 hover:text-blue-400 transition-colors" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 flex-grow relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl whitespace-nowrap">Welcome to <span className="text-blue-300">Mind Mentor</span></h1>
          <p className="mt-4 text-xl text-blue-200 mb-8">
            Your AI-powered study assistant for accelerated learning
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/home" className="inline-block">
              <Button
                size="lg"
                className="text-lg px-8 py-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
              >
                <span className="mr-2">Get Started</span>
                <motion.span
                  initial={{ x: 0 }}
                  animate={{ x: 5 }}
                  transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }}
                >
                  <ChevronRight className="h-5 w-5 inline" />
                </motion.span>
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          <FeatureCard
            icon={<BookOpen className="h-10 w-10 text-blue-400" />}
            title="Personalized Study Plans"
            description="Get tailored study plans based on your goals and learning style."
          />
          <FeatureCard
            icon={<Brain className="h-10 w-10 text-blue-400" />}
            title="AI-Curated Resources"
            description="Access the best learning materials curated by our AI."
          />
          <FeatureCard
            icon={<MessageCircle className="h-10 w-10 text-blue-400" />}
            title="Intelligent Q&A"
            description="Get instant answers to your questions as you learn."
          />
        </motion.div>
      </main>

      <footer className="bg-black/50 backdrop-blur-lg text-white py-8 relative z-10 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              © {new Date().getFullYear()} Mind Mentor. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-xl font-semibold text-blue-400">{title}</h3>
      </div>
      <p className="text-blue-100">{description}</p>
    </div>
  )
}