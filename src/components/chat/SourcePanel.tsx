import { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import type { RAGSourceType } from "@/types/chat";

interface SourcePanelProps {
  sources: RAGSourceType[];
}

export function SourcePanel({ sources }: SourcePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
      >
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <FileText className="h-3 w-3" />
        <span>Fuentes ({sources.length})</span>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {sources.map((source, index) => (
            <div
              key={source.id}
              className="rounded-md bg-card p-3 shadow-depth text-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground">
                  Fuente {index + 1}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {(source.similarity * 100).toFixed(1)}% similitud
                </span>
              </div>
              <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                {source.contenido}
              </p>
              {source.metadata && Object.keys(source.metadata).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {Object.entries(source.metadata).map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-block rounded bg-muted px-1.5 py-0.5 text-muted-foreground"
                    >
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
