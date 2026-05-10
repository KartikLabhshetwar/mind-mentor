"use client"
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StudyPlanDisplay from './StudyPlanDisplay';
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { StudyPlan } from "@/components/study-plan/StoredPlan";
import { apiClient } from '@/lib/api-client';
import { useSession } from 'next-auth/react';
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface StudyPlanFormProps {
  onPlanGenerated: (plan: Partial<StudyPlan>) => void;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    }
  };
  message?: string;
}

export default function StudyPlanForm({ onPlanGenerated }: StudyPlanFormProps) {
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState<Date>();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPlan(null); // Reset plan when submitting new one
    
    if (!session?.user?.id) {
      toast({
        variant: "error",
        title: "Authentication Required", 
        description: "You must be logged in to generate a study plan",
      });
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }
    
    if (!date) {
      setError("Please select an exam date");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.createStudyPlan(
        session.user.id,
        subject.trim(),
        date.toISOString().split('T')[0]
      );

      if (response.error === 'PLAN_EXISTS') {
        setError(response.message || 'A study plan for this subject already exists');
        // Scroll to existing plans section
        const plansSection = document.getElementById('stored-plans');
        if (plansSection) {
          plansSection.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      if (response.success && response.plan) {
        setPlan(response.plan);
        setSubject('');
        setDate(undefined);
        toast({
          variant: "success",
          title: "Plan Generated",
          description: "Study plan generated successfully",
        });
        
        // Call onPlanGenerated after a short delay to ensure proper state updates
        setTimeout(() => {
          onPlanGenerated(response.plan);
        }, 100);
      } else {
        throw new Error(response.error || 'Failed to generate plan');
      }
    } catch (err: unknown) {
      console.error('Error creating plan:', err);
      const error = err as ApiError;
      if (error?.response?.data?.error === 'PLAN_EXISTS') {
        setError(error.response.data.message || 'A study plan for this subject already exists');
        // Scroll to existing plans section
        const plansSection = document.getElementById('stored-plans');
        if (plansSection) {
          plansSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        toast({
          variant: "error",
          title: "Error",
          description: error?.response?.data?.message || error.message || "Failed to create study plan",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#F2EDE0] p-4 sm:p-6 border-2 border-b-4 border-r-4 border-black rounded-xl">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 space-y-2">
              <Input
                type="text"
                placeholder="Enter your study topic..."
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setError(null);
                }}
                className={cn(
                  "bg-white border-2 border-black text-gray-900 placeholder-gray-500 text-base sm:text-lg p-6 rounded-xl h-auto",
                  error && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
              )}
            </div>
            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full h-full justify-start text-left font-normal bg-white border-2 border-black text-base sm:text-lg p-6 rounded-xl",
                      !date && "text-gray-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {date ? format(date, "PPP") : <span>dd-mm-yyyy</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-center w-full">
            <Button 
              type="submit" 
              className="w-full sm:w-auto flex justify-center items-center text-base sm:text-lg py-6 px-8 rounded-xl" 
              disabled={isLoading || !subject.trim() || !date}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 sm:h-5 w-4 sm:w-5 animate-spin" /> : null}
              {isLoading ? 'Generating Your Plan...' : 'Create Study Plan'}
            </Button>
          </div>
        </form>

        {plan && (
          <div className="mt-6 sm:mt-8 bg-white rounded-xl border-2 border-black p-6">
            <h3 className="text-xl font-semibold mb-4">Generated Study Plan</h3>
            <StudyPlanDisplay plan={plan} />
          </div>
        )}
      </div>
    </div>
  );
}