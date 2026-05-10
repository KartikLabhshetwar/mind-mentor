"use client"

import { useState, useEffect, useCallback } from "react";
import StudyPlanForm from "@/components/study-plan/StudyPlanForm";
import { StoredPlan } from "@/components/study-plan/StoredPlan";
import { Separator } from "@/components/ui/separator";
import type { StudyPlan } from "@/components/study-plan/StoredPlan";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { PaginationNav } from "@/components/ui/pagination-nav";

const ITEMS_PER_PAGE = 5;

export default function StudyPlanPage() {
  const { data: session } = useSession();
  const [storedPlans, setStoredPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const fetchPlans = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const data = await apiClient.getStudyPlan(session.user.id);
      if (data.error) {
        console.error("API returned error:", data.error);
        toast({
          variant: "error",
          title: "Error",
          description: "Failed to fetch study plans. Please try again."
        });
        setStoredPlans([]);
        return;
      }
      
      if (data.plans && Array.isArray(data.plans)) {
        // Sort plans by _id as a fallback for creation time
        const sortedPlans = data.plans.sort((a: StudyPlan, b: StudyPlan) => 
          b._id.localeCompare(a._id)
        );
        setStoredPlans(sortedPlans);
      } else {
        console.error("Invalid plans data structure:", data);
        setStoredPlans([]);
      }
    } catch (error) {
      console.error("Error fetching stored plans:", error);
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to fetch study plans. Please try again."
      });
      setStoredPlans([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handlePlanGenerated = () => {
    // Refresh the plans list after a short delay
    setTimeout(() => {
      fetchPlans();
    }, 500);
  };

  const handlePlanDelete = async (planId: string) => {
    try {
      const response = await apiClient.deleteStudyPlan(planId);
      if (response.success) {
        // Update the local state to remove the deactivated plan
        setStoredPlans(plans => plans.filter(plan => plan._id !== planId));
        toast({
          variant: "success",
          title: "Success",
          description: response.message || "Study plan deactivated successfully."
        });
      } else {
        throw new Error(response.message || 'Failed to deactivate plan');
      }
    } catch (error: unknown) {
      console.error("Error deactivating plan:", error);
      toast({
        variant: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to deactivate study plan. Please try again."
      });
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(storedPlans.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPlans = storedPlans.slice(startIndex, endIndex);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-0">Study Plan Generator</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm text-gray-600">Create and manage your study plans</span>
        </div>
      </div>
      
      <div className="w-full max-w-full sm:max-w-10xl">
        <StudyPlanForm onPlanGenerated={handlePlanGenerated} />
      </div>

      {/* Stored Plans Section */}
      <div id="stored-plans" className="mt-8 sm:mt-12">
        <Separator className="my-6 sm:my-8" />
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Your Study Plans</h2>
        
        {loading ? (
          <div className="space-y-4 sm:space-y-6">
            <Skeleton className="h-[150px] sm:h-[200px] w-full" />
            <Skeleton className="h-[150px] sm:h-[200px] w-full" />
          </div>
        ) : storedPlans.length > 0 ? (
          <>
            <div className="space-y-4 sm:space-y-6">
              {currentPlans.map((plan) => (
                <StoredPlan
                  key={plan._id}
                  plan={plan}
                  onDelete={handlePlanDelete}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <PaginationNav
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>You haven&apos;t created any study plans yet.</p>
            <p className="mt-2">Use the form above to create your first study plan!</p>
          </div>
        )}
      </div>
    </div>
  );
}