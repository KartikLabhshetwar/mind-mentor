"use client"
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StudyPlanDisplay from './StudyPlanDisplay';
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

export default function StudyPlanForm() {
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [plan, setPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, examDate }),
      });
      const data = await response.json();
      if (response.ok) {
        setPlan(data.plan);
        toast({
          title: "Study Plan Generated",
          description: "Your study plan is ready!",
          action: <ToastAction altText="View plan">View plan</ToastAction>,
        });
      } else {
        throw new Error(data.error || 'Failed to generate study plan');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Study Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject"
          />
          <Input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
          <Button onClick={handleGeneratePlan} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Study Plan'
            )}
          </Button>
        </CardContent>
      </Card>
      {plan && <StudyPlanDisplay plan={plan} />}
    </div>
  );
}