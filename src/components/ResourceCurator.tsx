"use client"
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const handleCurateResources = async () => {
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
      } else {
        throw new Error(data.error || 'Failed to fetch resources');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Find Free Learning Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter subject for resources"
        />
        <Button onClick={handleCurateResources} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finding Resources...
            </>
          ) : (
            'Find Resources'
          )}
        </Button>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {resources.length > 0 && (
          <ScrollArea className="h-[400px] w-full pr-4">
            {resources.map((resource, index) => (
              <Card key={index} className="mb-4">
                <CardContent className="pt-4">
                  <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                  <p className="text-sm mb-2">{resource.description}</p>
                  <p className="text-xs text-muted-foreground mb-2">Type: {resource.type}</p>
                  <a href={resource.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                    Access Resource
                  </a>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}