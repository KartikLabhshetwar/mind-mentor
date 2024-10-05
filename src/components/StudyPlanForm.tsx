import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
    >
      <h2 className="text-2xl font-semibold text-blue-400 mb-4">Create Study Plan</h2>
      <form onSubmit={handleGeneratePlan} className="space-y-4">
        <Input
          type="text"
          placeholder="Enter study topic"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="bg-white/20 border-white/10 text-white placeholder-white/50"
        />
        <Input
          type="date"
          placeholder="Enter exam date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className="bg-white/20 border-white/10 text-white placeholder-white/50"
        />
        <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Generating...' : 'Generate Plan'}
        </Button>
      </form>
      {plan && <StudyPlanDisplay plan={plan} />}
    </motion.div>
  );
}