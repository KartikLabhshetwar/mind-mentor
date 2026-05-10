"use client"
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Resource {
  title: string;
  description: string;
  type: string;
  link: string;
}

interface ResourceCuratorProps {
  onCreateResources: (subject: string) => Promise<void>;
}

export default function ResourceCurator({ onCreateResources }: ResourceCuratorProps) {
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [resources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    setLoading(true);
    try {
      await onCreateResources(subject.trim());
      setSubject("");
      toast({
        variant: "success",
        title: "Success",
        description: "Resources generated successfully",
      });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err && 
          typeof err.response === 'object' && err.response !== null && 'data' in err.response &&
          typeof err.response.data === 'object' && err.response.data !== null && 'error' in err.response.data &&
          err.response.data.error === 'RESOURCE_EXISTS' && 'message' in err.response.data) {
        setError(err.response.data.message as string);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#F2EDE0] p-4 sm:p-6 border-2 border-b-4 border-r-4 border-black rounded-xl">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Enter a topic to find learning resources..."
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
          <Button
            type="submit"
            disabled={loading || !subject.trim()}
            className="w-full sm:w-auto flex justify-center items-center text-base sm:text-lg py-8 mt-1 px-8 rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Resources"
            )}
          </Button>
        </form>

        {!error && resources.length > 0 && (
          <ScrollArea className="h-[calc(100vh-400px)] sm:h-[calc(100vh-300px)] w-full">
            <div className="grid grid-cols-1 gap-6 sm:gap-10">
              {resources.map((resource, index) => (
                <Card key={index} className="bg-white border-2 border-black border-b-4 border-r-4">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl text-gray-800">{resource.title}</CardTitle>
                    <div className="text-xs sm:text-sm text-gray-500">{resource.type}</div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <p className="text-sm sm:text-base text-gray-600 mb-4">{resource.description}</p>
                    <a 
                      href={resource.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center text-[#7fb236] hover:text-[#6f9826] hover:underline text-sm sm:text-base"
                    >
                      Learn More →
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}