import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudyPlanDisplayProps {
  plan: string;
}

export default function StudyPlanDisplay({ plan }: StudyPlanDisplayProps) {
  const sections = plan.split('\n\n');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Study Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full pr-4">
          {sections.map((section, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{section.split('\n')[0]}</h3>
              <ul className="list-disc pl-5">
                {section.split('\n').slice(1).map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}