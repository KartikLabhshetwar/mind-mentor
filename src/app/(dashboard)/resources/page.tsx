"use client"

import { useState, useEffect, useCallback } from "react";
import ResourceCurator from "@/components/resources/ResourceCurator";
import WebSearch from "@/components/resources/WebSearch";
import { StoredResources } from "@/components/resources/StoredResources";
import { Separator } from "@/components/ui/separator";
import type { CuratedResource } from "@/components/resources/StoredResources";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { PaginationNav } from "@/components/ui/pagination-nav";

const ITEMS_PER_PAGE = 5;

export default function ResourcesPage() {
  const { data: session } = useSession();
  const [storedResources, setStoredResources] = useState<CuratedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"curate" | "search">("curate");
  const { toast } = useToast();

  const fetchResources = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const data = await apiClient.getCuratedResources(session.user.id);
      console.log("Fetched resources data:", data);
      
      if (data.error) {
        console.error("API returned error:", data.error);
        toast({
          variant: "error",
          title: "Error",
          description: "Failed to fetch resources. Please try again."
        });
        setStoredResources([]);
        return;
      }
      
      if (data.resources && Array.isArray(data.resources)) {
        // Validate the structure of each resource
        const validResources = data.resources.filter((resource: CuratedResource) => {
          return resource && 
                 resource._id && 
                 resource.topic && 
                 Array.isArray(resource.resources);
        });
        
        console.log("Valid resources:", validResources);
        setStoredResources(validResources);
      } else {
        console.error("Invalid resources data structure:", data);
        setStoredResources([]);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to fetch resources. Please try again."
      });
      setStoredResources([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, toast]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleResourceDelete = (resourceId: string) => {
    setStoredResources(resources => resources.filter(resource => resource._id !== resourceId));
    toast({
      variant: "success",
      title: "Success",
      description: "Resource deleted successfully."
    });
  };

  const handleCreateResources = async (subject: string) => {
    if (!session?.user?.id) return;
    try {
      await apiClient.createCuratedResources(session.user.id, subject);
      toast({
        variant: "success",
        title: "Success",
        description: "Resources created successfully."
      });
      // Refresh resources after creation
      fetchResources();
    } catch (error: unknown) {
      console.error('Error creating resources:', error);
      
      // Type guard to check if error is an object with status property
      if (error && typeof error === 'object' && 'status' in error) {
        const errorObj = error as { status: number; retryAfter?: number };
        // Handle rate limit errors
        if (errorObj.status === 429 || errorObj.status === 413) {
          const retryAfter = errorObj.retryAfter || 60;
          const minutes = Math.ceil(retryAfter / 60);
          toast({
            variant: "error",
            title: "Rate Limit Exceeded",
            description: `Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}. Our AI service has reached its limit.`
          });
          return;
        }
      }

      // Type guard for response error
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as { 
          response?: { 
            data?: { 
              error?: string; 
              message?: string; 
            } 
          };
          message?: string;
        };

        if (responseError.response?.data?.error === 'RESOURCE_EXISTS') {
          toast({
            variant: "default",
            title: "Resources Already Exist",
            description: responseError.response.data.message || "You already have resources for this subject."
          });
          
          // Scroll to existing resources section
          const resourcesSection = document.getElementById('stored-resources');
          if (resourcesSection) {
            resourcesSection.scrollIntoView({ behavior: 'smooth' });
          }
          return;
        }
      }

      // Default error handling
      toast({
        variant: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create resources. Please try again."
      });
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(storedResources.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentResources = storedResources.slice(startIndex, endIndex);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Resources</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("curate")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "curate"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Curate Resources
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "search"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Web Search
          </button>
        </div>
      </div>
      <div className="w-full max-w-10xl mx-auto">
        {activeTab === "curate" ? (
          <ResourceCurator onCreateResources={handleCreateResources} />
        ) : (
          <WebSearch />
        )}
      </div>

      {/* Stored Resources Section */}
      {loading ? (
        <div className="mt-8 sm:mt-12">
          <Separator className="my-6 sm:my-8" />
          <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 mb-4 sm:mb-6" />
          <div className="space-y-4 sm:space-y-6">
            <Skeleton className="h-[150px] sm:h-[200px] w-full" />
            <Skeleton className="h-[150px] sm:h-[200px] w-full" />
          </div>
        </div>
      ) : (
        <div id="stored-resources" className="mt-8 sm:mt-12">
          <Separator className="my-6 sm:my-8" />
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Your Curated Resources</h2>
          {storedResources.length > 0 ? (
            <>
              <div className="space-y-4 sm:space-y-6">
                {currentResources.map((resource) => (
                  <StoredResources
                    key={resource._id}
                    resource={resource}
                    onDelete={handleResourceDelete}
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
              <p>You haven&apos;t curated any resources yet.</p>
              <p className="mt-2">Use the form above to get personalized learning resources!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}