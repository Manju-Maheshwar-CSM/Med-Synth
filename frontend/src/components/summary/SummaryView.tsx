import { motion } from "framer-motion";
import {
  Copy,
  Download,
  Sparkles,
  FlaskConical,
  Users,
  Target,
  ListChecks,
  Quote,
  Brain,
  AlertTriangle,
  Tag,
  Stethoscope,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import type { SummaryResult } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { AlignmentBadge } from "./AlignmentBadge";
import {
  copyToClipboard,
  downloadFile,
  summaryToMarkdown,
  summaryToText,
} from "@/lib/export";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "Not stated in the provided abstract.";

function isStated(v?: string): boolean {
  return !!v && v.trim().length > 0 && v.trim() !== PLACEHOLDER;
}

function Section({
  icon: Icon,
  title,
  children,
  accent = "text-primary",
}: {
  icon: typeof Sparkles;
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className={cn("h-4 w-4", accent)} />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Prose({ text }: { text: string }) {
  if (!isStated(text)) {
    return <p className="text-sm italic text-muted-foreground">{PLACEHOLDER}</p>;
  }
  return <p className="text-sm leading-relaxed text-foreground/90">{text}</p>;
}

function BulletList({ items }: { items: string[] }) {
  const clean = items.filter((x) => isStated(x));
  if (!clean.length) {
    return <p className="text-sm italic text-muted-foreground">{PLACEHOLDER}</p>;
  }
  return (
    <ul className="space-y-1.5">
      {clean.map((it, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function SummaryView({
  result,
  title,
}: {
  result: SummaryResult;
  title?: string;
}) {
  const c = result.content;

  const onCopy = async () => {
    const ok = await copyToClipboard(summaryToText(result, title));
    ok ? toast.success("Summary copied to clipboard") : toast.error("Copy failed");
  };
  const onMd = () => {
    downloadFile(
      `medsynth-summary-${result.id.slice(0, 8)}.md`,
      summaryToMarkdown(result, title),
      "text/markdown",
    );
    toast.success("Markdown downloaded");
  };
  const onJson = () => {
    downloadFile(
      `medsynth-summary-${result.id.slice(0, 8)}.json`,
      JSON.stringify(result, null, 2),
      "application/json",
    );
    toast.success("JSON downloaded");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header row: engine + mode + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary" className="capitalize">
            {result.mode}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {result.length}
          </Badge>
          <Badge variant={result.engine === "mock" ? "success" : "accent"}>
            {result.engine === "mock" ? "Offline engine" : `AI · ${result.engine}`}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onCopy}>
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
          <Button size="sm" variant="outline" onClick={onMd}>
            <Download className="h-3.5 w-3.5" /> Markdown
          </Button>
          <Button size="sm" variant="outline" onClick={onJson}>
            <Download className="h-3.5 w-3.5" /> JSON
          </Button>
        </div>
      </div>

      {/* Warnings (e.g. fallback to offline) */}
      {result.warnings.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/[0.08] p-3">
          {result.warnings.map((w, i) => (
            <p key={i} className="flex items-start gap-2 text-xs text-warning">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="text-foreground/80">{w}</span>
            </p>
          ))}
        </div>
      )}

      <AlignmentBadge alignment={result.alignment} />

      <Card className="space-y-6 p-6">
        {isStated(c.title) && (
          <h2 className="text-lg font-semibold leading-snug tracking-tight">
            {c.title}
          </h2>
        )}

        {/* TL;DR — always shown, visually emphasised */}
        <div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-4">
          <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" /> TL;DR
          </h3>
          <Prose text={c.tldr} />
        </div>

        {isStated(c.study_type) && (
          <Section icon={FlaskConical} title="Study Type">
            <Badge variant="accent">{c.study_type}</Badge>
          </Section>
        )}

        {isStated(c.background) && (
          <Section icon={BookOpen} title="Background">
            <Prose text={c.background} />
          </Section>
        )}

        {isStated(c.research_question) && (
          <Section icon={HelpCircle} title="Research Question">
            <Prose text={c.research_question} />
          </Section>
        )}

        {isStated(c.population) && (
          <Section icon={Users} title="Population">
            <Prose text={c.population} />
          </Section>
        )}

        {c.methods.some(isStated) && (
          <Section icon={Target} title="Methods">
            <BulletList items={c.methods} />
          </Section>
        )}

        <Section icon={ListChecks} title="Key Findings" accent="text-success">
          <BulletList items={c.key_findings} />
        </Section>

        {isStated(c.conclusion) && (
          <Section icon={Sparkles} title="Conclusion">
            <Prose text={c.conclusion} />
          </Section>
        )}

        {isStated(c.clinical_relevance) && (
          <Section icon={Stethoscope} title="Clinical Relevance">
            <Prose text={c.clinical_relevance} />
          </Section>
        )}

        {c.limitations.some(isStated) && (
          <Section icon={AlertTriangle} title="Limitations" accent="text-warning">
            <BulletList items={c.limitations} />
          </Section>
        )}
      </Card>

      {/* Provenance: source facts vs AI interpretation */}
      {(c.source_facts.some(isStated) || c.interpretations.some(isStated)) && (
        <div className="grid gap-4 md:grid-cols-2">
          {c.source_facts.some(isStated) && (
            <Card className="p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-success">
                <Quote className="h-4 w-4" /> From the source
              </h3>
              <BulletList items={c.source_facts} />
            </Card>
          )}
          {c.interpretations.some(isStated) && (
            <Card className="p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent">
                <Brain className="h-4 w-4" /> AI interpretation
              </h3>
              <BulletList items={c.interpretations} />
            </Card>
          )}
        </div>
      )}

      {c.important_terms.filter(isStated).length > 0 && (
        <Card className="p-5">
          <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Tag className="h-4 w-4" /> Important terms
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {c.important_terms.filter(isStated).map((t, i) => (
              <Badge key={i} variant="default">
                {t}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {c.quality_notes.filter(isStated).length > 0 && (
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quality notes
          </h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {c.quality_notes.filter(isStated).map((n, i) => (
              <li key={i}>• {n}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
