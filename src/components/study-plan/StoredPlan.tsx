import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

export interface TaskItem {
  text: string;
  completed?: boolean;
}

export interface DailyTask {
  day: string;
  tasks: Array<string | TaskItem>;
  duration: string;
}

export interface WeeklyPlan {
  week: string;
  goals: string[];
  dailyTasks: DailyTask[];
}

export interface Overview {
  subject: string;
  duration: string;
  examDate: string;
}

export interface StudyPlan {
  _id: string;
  overview: Overview;
  weeklyPlans: WeeklyPlan[];
  recommendations: string[];
  isActive: boolean;
  progress: number;
}

interface StoredPlanProps {
  plan: StudyPlan;
  onDelete: (planId: string) => void;
}

export function StoredPlan({ plan, onDelete }: StoredPlanProps) {
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<StudyPlan>(plan);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(false);

  const normalizeTask = (task: string | TaskItem) => {
    if (typeof task === "string") {
      return { text: task || "Untitled task", completed: false };
    }

    const textCandidates = [
      task.text,
      (task as any).task,
      (task as any).label,
      (task as any).name,
      (task as any).title,
    ];

    const text =
      textCandidates.find(
        (candidate) => typeof candidate === "string" && candidate.trim(),
      ) ||
      Object.values(task).find(
        (value) => typeof value === "string" && value.trim(),
      ) ||
      "Untitled task";

    return { text, completed: task.completed ?? false };
  };

  const handleTaskToggle = async (
    weekIndex: number,
    dayIndex: number,
    taskIndex: number,
    isChecked: boolean,
  ) => {
    try {
      setUpdatingTask(true);
      const response = await apiClient.updateStudyPlanTask(
        currentPlan._id,
        weekIndex,
        dayIndex,
        taskIndex,
        isChecked,
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to update task");
      }

      if (response.plan) {
        setCurrentPlan(response.plan);
      } else {
        setCurrentPlan((prevPlan) => {
          const updated = { ...prevPlan };
          const task =
            updated.weeklyPlans[weekIndex].dailyTasks[dayIndex].tasks[
              taskIndex
            ];
          if (typeof task === "string") {
            updated.weeklyPlans[weekIndex].dailyTasks[dayIndex].tasks[
              taskIndex
            ] = {
              text: task,
              completed: isChecked,
            };
          } else {
            updated.weeklyPlans[weekIndex].dailyTasks[dayIndex].tasks[
              taskIndex
            ] = {
              ...task,
              completed: isChecked,
            };
          }
          return updated;
        });
      }

      toast({
        variant: "success",
        title: "Task updated",
        description: isChecked
          ? "Task marked as done."
          : "Task marked as incomplete.",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        variant: "error",
        title: "Update failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not update the task status.",
      });
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await apiClient.deleteStudyPlan(plan._id);
      onDelete(plan._id);
      toast({
        variant: "success",
        title: "Success",
        description: "Study plan deleted successfully",
      });
    } catch {
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to delete study plan",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full mt-4 sm:mt-8">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="w-full sm:w-auto">
          <CardTitle className="text-xl sm:text-2xl font-bold break-words">
            Study Plan for {currentPlan.overview.subject}
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="text-xs sm:text-sm">
              {currentPlan.overview.duration}
            </Badge>
            <Badge variant="outline" className="text-xs sm:text-sm">
              Exam: {currentPlan.overview.examDate}
            </Badge>
            <Badge
              variant={currentPlan.isActive ? "default" : "secondary"}
              className="text-xs sm:text-sm"
            >
              {currentPlan.isActive ? "Active" : "Completed"}
            </Badge>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isDeleting}
              className="w-full sm:w-auto hover:bg-red-500"
            >
              Delete Plan
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[95vw] max-w-md sm:w-full">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                study plan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="w-full sm:w-auto hover:bg-red-500"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>

      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {currentPlan.weeklyPlans.map((weekPlan, index) => (
            <AccordionItem key={index} value={`week-${index}`}>
              <AccordionTrigger className="text-base sm:text-lg font-semibold">
                {weekPlan.week}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-sm sm:text-base">
                  <div>
                    <h4 className="font-semibold mb-2">Goals:</h4>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                      {weekPlan.goals.map((goal, idx) => (
                        <li key={idx} className="break-words">
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Daily Tasks:</h4>
                    {weekPlan.dailyTasks.map((day, dayIdx) => (
                      <div key={dayIdx} className="mb-4">
                        <h5 className="font-medium">
                          {day.day} ({day.duration})
                        </h5>
                        <ul className="list-none pl-0 space-y-2">
                          {day.tasks.map((task, taskIdx) => {
                            const normalized = normalizeTask(task);
                            return (
                              <li key={taskIdx} className="break-words">
                                <label className="flex items-start gap-2">
                                  <input
                                    type="checkbox"
                                    checked={normalized.completed}
                                    disabled={updatingTask}
                                    onChange={(event) =>
                                      handleTaskToggle(
                                        index,
                                        dayIdx,
                                        taskIdx,
                                        event.target.checked,
                                      )
                                    }
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span
                                    className={
                                      normalized.completed
                                        ? "line-through text-gray-500"
                                        : "text-gray-700"
                                    }
                                  >
                                    {normalized.text}
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}

          <AccordionItem value="recommendations">
            <AccordionTrigger className="text-base sm:text-lg font-semibold">
              Recommendations
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-sm sm:text-base">
                {currentPlan.recommendations.map((rec, index) => (
                  <li key={index} className="break-words">
                    {rec}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
