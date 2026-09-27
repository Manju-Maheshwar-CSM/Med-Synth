import { useState } from "react";
import { Wand2, Loader2, Columns2, FileText } from "lucide-react";
import type { Paper, SummaryLength, SummaryMode, SummaryResult } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { InputWorkspace } from "@/components/summary/InputWorkspace";
import { ModeSelector } from "@/components/summary/ModeSelector";
import { LengthSelector } from "@/components/summary/LengthSelector";
import { LoadingSteps } from "@/components/summary/LoadingSteps";
import { SummaryView } from "@/components/summary/SummaryView";
import { SideBySide } from "@/components/summary/SideBySide";
import { FeedbackInline } from "@/components/summary/FeedbackInline";
import { api, ApiError } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { DISCLAIMER } from "@/lib/constants";

export function Summarize() {
  const [abstract, setAbstract] = useState("");
  const [meta, setMeta] = useState<Partial<Paper> | undefined>(undefined);
  const [mode, setMode] = useState<SummaryMode>("structured");
  const [length, setLength] = useState<SummaryLength>("medium");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [view, setView] = useState("summary");

  const addPaper = useStore((s) => s.addPaper);
  const upsertSummary = useStore((s) => s.upsertSummary);

  const canGenerate = abstract.trim().length >= 40 && !loading;

  const generate = async () => {
    if (abstract.trim().length < 40) {
      toast.error("Please provide at least 40 characters of abstract text.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.summarize(abstract, mode, length, meta);
      setResult(res);
      // Persist into the shared library so it appears on Dashboard/Literature.
      const paper: Paper = {
        id: res.paper_id,
        title: meta?.title || res.content.title || "Untitled abstract",
        authors: meta?.authors ?? [],
        journal: meta?.journal ?? "",
        publication_date: meta?.publication_date ?? "",
        pmid: meta?.pmid ?? "",
        abstract,
        source: meta?.source ?? "manual",
      };
      addPaper(paper);
      upsertSummary(res);
      if (res.warnings.length === 0) toast.success("Summary generated");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Summarization failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Summarize"
        subtitle="Turn a single abstract into a faithful, structured summary with a source-alignment check."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* LEFT: input + controls */}
        <div className="space-y-5">
          <Card className="p-5">
            <InputWorkspace
              abstract={abstract}
              onAbstractChange={setAbstract}
              onMeta={setMeta}
            />
          </Card>

          <Card className="space-y-5 p-5">
            <ModeSelector value={mode} onChange={setMode} />
            <LengthSelector value={length} onChange={setLength} />
            <Button
              size="lg"
              className="w-full"
              onClick={generate}
              disabled={!canGenerate}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" /> Generate summary
                </>
              )}
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              {DISCLAIMER}
            </p>
          </Card>
        </div>

        {/* RIGHT: output */}
        <div>
          {loading ? (
            <LoadingSteps />
          ) : result ? (
            <div className="space-y-4">
              <Tabs value={view} onValueChange={setView}>
                <TabsList>
                  <TabsTrigger value="summary">
                    <FileText className="h-4 w-4" /> Summary
                  </TabsTrigger>
                  <TabsTrigger value="compare">
                    <Columns2 className="h-4 w-4" /> Side-by-side
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="mt-4">
                  <SummaryView result={result} title={meta?.title} />
                </TabsContent>
                <TabsContent value="compare" className="mt-4">
                  <SideBySide abstract={abstract} result={result} />
                </TabsContent>
              </Tabs>
              <FeedbackInline result={result} />
            </div>
          ) : (
            <EmptyState
              icon={Wand2}
              title="Your summary will appear here"
              description="Paste an abstract, pick a mode and length, then generate a faithful summary with figures preserved and a source-alignment score."
            />
          )}
        </div>
      </div>
    </div>
  );
}
