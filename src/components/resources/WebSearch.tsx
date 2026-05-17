"use client"
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2, Search, Globe } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface WebSearchResponse {
  answer: string | null;
  results: SearchResult[];
}

export default function WebSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState<WebSearchResponse | null>(null);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await apiClient.webSearch(query.trim());
      setSearchData(data);
    } catch {
      toast({
        variant: "error",
        title: "Search Failed",
        description: "Could not complete web search. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <div className="w-full">
      <div className="w-full bg-[#E8F0FE] p-4 sm:p-6 border-2 border-b-4 border-r-4 border-black rounded-xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Web Search</h3>
          </div>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search the web for any topic..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-white border-2 border-black text-gray-900 placeholder-gray-500 text-base sm:text-lg p-6 rounded-xl h-auto"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full sm:w-auto flex justify-center items-center text-base sm:text-lg py-8 mt-1 px-8 rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Web
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {searchData && (
        <div className="mt-6 space-y-4">
          {searchData.answer && (
            <Card className="bg-blue-50 border-2 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-blue-800">AI Answer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{searchData.answer}</p>
              </CardContent>
            </Card>
          )}

          {searchData.results.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {searchData.results.map((result, index) => (
                <Card key={index} className={cn(
                  "bg-white border-2 border-black transition-shadow hover:shadow-md",
                  "border-b-4 border-r-4"
                )}>
                  <CardHeader className="p-4 sm:p-5 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold text-gray-800 line-clamp-2">
                        {result.title}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {Math.round(result.score * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{getDomainFromUrl(result.url)}</p>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-3">{result.content}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(result.url, '_blank')}
                    >
                      Visit <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">No results found. Try a different query.</p>
          )}
        </div>
      )}
    </div>
  );
}
