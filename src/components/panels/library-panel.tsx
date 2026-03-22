'use client';

import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BookOpen, GraduationCap } from 'lucide-react';

interface LibraryPanelProps {
  open: boolean;
  onClose: () => void;
}

export function LibraryPanel({ open, onClose }: LibraryPanelProps) {
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch('/api/library')
        .then(r => r.json())
        .then(data => {
          setStudyPlans(data.studyPlans || []);
          setPdfs(data.pdfs || []);
          setResources(data.resources || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-[#FBFAF8] border-l border-[#D5EBE7] w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="font-lexend text-[#27445D]">My Library</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="plans" className="mt-4">
          <TabsList className="bg-[#EFE9D5]">
            <TabsTrigger value="plans"><BookOpen className="h-4 w-4 mr-1" />Plans</TabsTrigger>
            <TabsTrigger value="pdfs"><FileText className="h-4 w-4 mr-1" />PDFs</TabsTrigger>
            <TabsTrigger value="resources"><GraduationCap className="h-4 w-4 mr-1" />Resources</TabsTrigger>
          </TabsList>
          <TabsContent value="plans" className="mt-4 space-y-2">
            {loading && <p className="text-sm text-[#8AC7C0]">Loading...</p>}
            {!loading && studyPlans.length === 0 && <p className="text-sm text-[#8AC7C0]">No saved study plans yet.</p>}
            {studyPlans.map((plan: any) => (
              <div key={plan._id} className="p-3 bg-white border border-[#D5EBE7] rounded-lg">
                <p className="font-medium text-sm text-[#27445D]">{plan.overview?.subject || 'Study Plan'}</p>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="pdfs" className="mt-4 space-y-2">
            {loading && <p className="text-sm text-[#8AC7C0]">Loading...</p>}
            {!loading && pdfs.length === 0 && <p className="text-sm text-[#8AC7C0]">No uploaded PDFs yet.</p>}
            {pdfs.map((pdf: any) => (
              <div key={pdf._id} className="p-3 bg-white border border-[#D5EBE7] rounded-lg">
                <p className="font-medium text-sm text-[#27445D]">{pdf.title}</p>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="resources" className="mt-4 space-y-2">
            {loading && <p className="text-sm text-[#8AC7C0]">Loading...</p>}
            {!loading && resources.length === 0 && <p className="text-sm text-[#8AC7C0]">No saved resources yet.</p>}
            {resources.map((res: any) => (
              <div key={res._id} className="p-3 bg-white border border-[#D5EBE7] rounded-lg">
                <p className="font-medium text-sm text-[#27445D]">{res.topic}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
