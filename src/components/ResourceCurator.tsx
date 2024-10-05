"use client"
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

interface Resource {
  title: string;
  description: string;
  type: string;
  link: string;
}

export default function ResourceCurator() {
  const [subject, setSubject] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCurateResources = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/curate-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject }),
      });
      const data = await response.json();
      if (response.ok) {
        setResources(data.resources);
        toast({
          title: "Resources Found",
          description: `Found ${data.resources.length} resources for ${subject}`,
          action: <ToastAction altText="View resources">View resources</ToastAction>,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch resources');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
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
      <h2 className="text-2xl font-semibold text-blue-400 mb-4">AI-Curated Resources</h2>
      <form onSubmit={handleCurateResources} className="space-y-4">
        <Input
          type="text"
          placeholder="Enter a topic"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="bg-white/20 border-white/10 text-white placeholder-white/50"
        />
        <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Curating...' : 'Curate Resources'}
        </Button>
      </form>
      {resources.length > 0 && (
        <ScrollArea className="h-[300px] mt-4">
          {resources.map((resource, index) => (
            <Card key={index} className="mb-4 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-blue-300">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-100">{resource.description}</p>
                <a href={resource.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline mt-2 inline-block">
                  Learn More
                </a>
              </CardContent>
            </Card>
          ))}
        </ScrollArea>
      )}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </motion.div>
  );
}