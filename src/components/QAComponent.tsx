"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export default function QAComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
    >
      <h2 className="text-2xl font-semibold text-blue-400 mb-4">Intelligent Q&A</h2>
      <CopilotChat
        instructions="You are an AI study assistant named Mind Mentor. Your role is to help students with their study-related questions, provide explanations, and offer learning strategies. Always be supportive, encouraging, and provide accurate information."
        labels={{
          title: "Mind Mentor Assistant",
          initial: "Hello! 👋 I'm your AI study assistant. How can I help you with your learning today?",
        }}
        className="bg-transparent"
        textareaClassName="bg-white/20 border-white/10 text-white placeholder-white/50 rounded-lg"
        submitButtonClassName="bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        chatMessageClassName="bg-white/5 border-white/10 rounded-lg"
        userMessageClassName="bg-blue-500/20 text-white"
        assistantMessageClassName="bg-purple-500/20 text-white"
      />
    </motion.div>
  );
}