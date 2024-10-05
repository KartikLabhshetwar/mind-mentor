"use client"
import React from 'react';
import { CopilotSidebar } from "@copilotkit/react-ui";

export default function QAComponent() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Ask a Question</h2>
      <CopilotSidebar
        defaultOpen={true}
        labels={{
          title: "Study Assistant",
          initial: "Ask me any study-related questions!",
        }}
        instructions={"You are an AI study assistant. Help the user with their study-related questions."}
      />
    </div>
  );
}