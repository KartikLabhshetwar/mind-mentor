import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudyPlanDisplayProps {
  plan: string;
}

export default function StudyPlanDisplay({ plan }: StudyPlanDisplayProps) {
  const sections = plan.split('\n\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
    >
      <Card className="w-full bg-transparent border-none">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-blue-400">Your Study Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full pr-4">
            {sections.map((section, index) => (
              <div key={index} className="mb-4">
                <h3 className="text-lg font-semibold mb-2 text-blue-300">{section.split('\n')[0]}</h3>
                <ul className="list-disc pl-5 text-blue-100">
                  {section.split('\n').slice(1).map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}