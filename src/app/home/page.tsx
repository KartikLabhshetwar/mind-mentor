"use client"
import { motion } from 'framer-motion'
import StudyPlanForm from '../../components/StudyPlanForm';
import ResourceCurator from '../../components/ResourceCurator';
import { Github } from 'lucide-react'
import Link from 'next/link'
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export default function Home() {
  return (
    <CopilotPopup
      defaultOpen={false}
      instructions="You are an AI study assistant named Mind Mentor. Your role is to help students with their study-related questions, provide explanations, and offer learning strategies. Always be supportive, encouraging, and provide accurate information."
      labels={{
        title: "Mind Mentor Assistant",
        initial: "Hello! 👋 I'm your AI study assistant. How can I help you with your learning today?",
      }}
    >
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-blue-900 text-white relative overflow-hidden">
        {/* Futuristic background elements */}
        <div className="absolute inset-0 z-0">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl"
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl"
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
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
            className="space-y-8"
          >
            <h1 className="text-4xl font-bold text-center text-blue-300">Mind Mentor Dashboard</h1>
            <div className="grid gap-8 md:grid-cols-2">
              <StudyPlanForm />
              <ResourceCurator />
            </div>
          </motion.div>
        </main>

        <footer className="bg-black/50 backdrop-blur-lg text-white py-8 relative z-10 border-t border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex justify-center items-center">
              <div className="text-sm">
                © {new Date().getFullYear()} Mind Mentor. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </CopilotPopup>
  );
}