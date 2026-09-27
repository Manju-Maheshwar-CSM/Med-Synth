import { useRef, useState } from "react";
import {
  ClipboardPaste,
  Upload,
  Search,
  FileText,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import type { Paper, PubMedSearchItem } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { SAMPLES } from "@/data/samples";
import { cn } from "@/lib/utils";

export interface InputResult {
  abstract: string;
  meta?: Partial<Paper>;
}

export function InputWorkspace({
  abstract,
  onAbstractChange,
  onMeta,
}: {
  abstract: string;
  onAbstractChange: (v: string) => void;
  onMeta: (meta: Partial<Paper> | undefined) => void;
}) {
  const [tab, setTab] = useState("paste");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="mb-4 w-full">
        <TabsTrigger value="paste" className="flex-1 justify-center">
          <ClipboardPaste className="h-4 w-4" /> Paste
        </TabsTrigger>
        <TabsTrigger value="upload" className="flex-1 justify-center">
          <Upload className="h-4 w-4" /> Upload
        </TabsTrigger>
        <TabsTrigger value="pubmed" className="flex-1 justify-center">
          <Search className="h-4 w-4" /> PubMed
        </TabsTrigger>
      </TabsList>

      <TabsContent value="paste">
        <PasteTab
          abstract={abstract}
          onAbstractChange={onAbstractChange}
          onMeta={onMeta}
        />
      </TabsContent>
      <TabsContent value="upload">
        <UploadTab onAbstractChange={onAbstractChange} onMeta={onMeta} />
      </TabsContent>
      <TabsContent value="pubmed">
        <PubMedTab onAbstractChange={onAbstractChange} onMeta={onMeta} />
      </TabsContent>
    </Tabs>
  );
}

function UploadTab({
  onAbstractChange,
  onMeta,
}: {
  onAbstractChange: (v: string) => void;
  onMeta: (m: Partial<Paper> | undefined) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState<Paper | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".txt"));
    if (arr.length === 0) {
      toast.error("Only .txt files are supported.");
      return;
    }
    setBusy(true);
    try {
      const papers = await api.uploadFiles(arr);
      if (papers.length > 0) {
        const p = papers[0];
        onAbstractChange(p.abstract);
        onMeta({ title: p.title, source: p.source, pmid: p.pmid });
        setLoaded(p);
        toast.success(`Loaded ${p.title || arr[0].name}`);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          drag ? "border-primary bg-primary/[0.05]" : "border-border hover:bg-muted/50",
        )}
      >
        {busy ? (
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
        ) : (
          <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">
          Drop a <span className="text-primary">.txt</span> file here, or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Plain-text abstracts only · processed in-memory, never stored
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {loaded && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 truncate">{loaded.title || "Uploaded abstract"}</span>
          <Badge variant="success">Ready</Badge>
        </div>
      )}
    </div>
  );
}

function PubMedTab({
  onAbstractChange,
  onMeta,
}: {
  onAbstractChange: (v: string) => void;
  onMeta: (m: Partial<Paper> | undefined) => void;
}) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<PubMedSearchItem[] | null>(null);

  const isPmid = /^\d+$/.test(query.trim());

  const fetchPmid = async (pmid: string) => {
    setBusy(true);
    try {
      const p = await api.pubmedFetch(pmid);
      onAbstractChange(p.abstract);
      onMeta({
        title: p.title,
        authors: p.authors,
        journal: p.journal,
        publication_date: p.publication_date,
        pmid: p.pmid,
        source: "pubmed",
      });
      setResults(null);
      toast.success(`Loaded PMID ${pmid}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "PubMed fetch failed.");
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    const q = query.trim();
    if (!q) return;
    if (isPmid) return fetchPmid(q);
    setBusy(true);
    try {
      const { results } = await api.pubmedSearch(q);
      setResults(results);
      if (results.length === 0) toast.info("No PubMed results found.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "PubMed search failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="PMID (e.g. 32109013) or search terms…"
          className={cn(
            "h-10 flex-1 rounded-xl border border-border bg-background px-3.5 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        />
        <Button onClick={run} disabled={busy || !query.trim()}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {isPmid ? "Fetch" : "Search"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Live queries to NCBI PubMed E-utilities. Requires an internet connection; the
        offline demo works without it.
      </p>

      {results && results.length > 0 && (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {results.map((r) => (
            <li key={r.pmid}>
              <button
                onClick={() => fetchPmid(r.pmid)}
                className="w-full rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
              >
                <p className="line-clamp-2 text-sm font-medium">{r.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.authors} · {r.journal} · {r.pubdate} · PMID {r.pmid}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PasteTab({
  abstract,
  onAbstractChange,
  onMeta,
}: {
  abstract: string;
  onAbstractChange: (v: string) => void;
  onMeta: (m: Partial<Paper> | undefined) => void;
}) {
  const chars = abstract.trim().length;
  return (
    <div className="space-y-3">
      <textarea
        value={abstract}
        onChange={(e) => {
          onAbstractChange(e.target.value);
          onMeta(undefined);
        }}
        rows={14}
        placeholder="Paste a medical abstract or the body of a paper here…"
        className={cn(
          "w-full resize-y rounded-xl border border-border bg-background p-3.5 text-sm leading-relaxed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{chars.toLocaleString()} characters</span>
        {abstract && (
          <button
            onClick={() => {
              onAbstractChange("");
              onMeta(undefined);
            }}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Or load a synthetic demo abstract:
        </p>
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant="subtle"
              onClick={() => {
                onAbstractChange(s.text);
                onMeta({ title: s.title, source: "sample" });
                toast.info(`Loaded demo: ${s.topic}`);
              }}
            >
              <Sparkles className="h-3.5 w-3.5" /> {s.topic}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
