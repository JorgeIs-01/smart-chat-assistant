import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Trash2, ArrowLeft, FileText, Database, AlertCircle } from "lucide-react";
import { config } from "@/lib/config";
import { getAllChunks, deleteChunk, insertChunk, getChunkCount } from "@/lib/supabase-client";
import { generateEmbedding, checkOllamaHealth } from "@/lib/ollama";
import { Button } from "@/components/ui/button";

interface StoredChunk {
  id: string;
  contenido: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [chunks, setChunks] = useState<StoredChunk[]>([]);
  const [chunkCount, setChunkCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestProgress, setIngestProgress] = useState({ current: 0, total: 0 });
  const [ollamaStatus, setOllamaStatus] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === config.adminPassword) {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError("Contraseña incorrecta");
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [chunksData, count, ollamaOk] = await Promise.all([
        getAllChunks(),
        getChunkCount(),
        checkOllamaHealth(),
      ]);
      setChunks(chunksData);
      setChunkCount(count);
      setOllamaStatus(ollamaOk);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  const handleDelete = async (id: string) => {
    try {
      await deleteChunk(id);
      setChunks((prev) => prev.filter((c) => c.id !== id));
      setChunkCount((prev) => prev - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando chunk");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsIngesting(true);
    setError(null);

    try {
      const text = await file.text();
      let chunks: string[];

      if (file.name.endsWith(".csv")) {
        // CSV: cada fila es un chunk (saltando cabecera)
        const lines = text.split("\n").filter((l) => l.trim());
        chunks = lines.slice(1); // Skip header
      } else {
        // Texto plano: dividir por párrafos (doble salto de línea)
        chunks = text
          .split(/\n\n+/)
          .map((c) => c.trim())
          .filter((c) => c.length > 20); // Mínimo 20 caracteres
      }

      setIngestProgress({ current: 0, total: chunks.length });

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const embedding = await generateEmbedding(chunkText);
        await insertChunk(chunkText, embedding, {
          source: file.name,
          chunk_index: i,
          ingested_at: new Date().toISOString(),
        });
        setIngestProgress({ current: i + 1, total: chunks.length });
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error durante la ingesta. Verifica que Ollama esté corriendo."
      );
    } finally {
      setIsIngesting(false);
      e.target.value = "";
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-lg font-medium text-foreground">
              Panel de Administración
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Introduce la contraseña para acceder
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full">
              Acceder
            </Button>
          </form>
          <button
            onClick={() => navigate("/")}
            className="mt-4 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Volver al chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-150"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-lg font-medium text-foreground">
              Gestión de Conocimiento
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-1.5 text-xs ${
                ollamaStatus ? "text-green-400" : "text-destructive"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  ollamaStatus ? "bg-green-400" : "bg-destructive"
                }`}
              />
              Ollama {ollamaStatus ? "conectado" : "desconectado"}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-xs hover:underline"
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: upload & stats */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-depth">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Documentos Indexados
              </p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-foreground">
                {chunkCount}
              </p>
            </div>

            {/* Upload */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-depth">
              <h2 className="mb-3 text-sm font-medium text-foreground">
                Subir Documentos
              </h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Sube archivos .txt o .csv para vectorizar e ingestar automáticamente.
              </p>
              <label
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50 hover:bg-secondary/30 ${
                  isIngesting ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {isIngesting
                    ? `Procesando ${ingestProgress.current}/${ingestProgress.total}...`
                    : "Arrastra o haz clic para subir"}
                </span>
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  disabled={isIngesting}
                  className="hidden"
                />
              </label>

              {isIngesting && (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${
                          ingestProgress.total > 0
                            ? (ingestProgress.current / ingestProgress.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column: chunks table */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card shadow-depth">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <h2 className="text-sm font-medium text-foreground">
                  Chunks Almacenados
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadData}
                  disabled={isLoading}
                >
                  Actualizar
                </Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  Cargando...
                </div>
              ) : chunks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-2 h-8 w-8 text-muted" />
                  <p className="text-sm text-muted-foreground">
                    No hay chunks almacenados
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sube un archivo para comenzar la ingesta
                  </p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  {chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="flex items-start gap-3 border-b border-border px-5 py-3 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm text-foreground leading-relaxed">
                          {chunk.contenido}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="tabular-nums">
                            {new Date(chunk.created_at).toLocaleDateString("es-ES")}
                          </span>
                          {chunk.metadata?.source && (
                            <>
                              <span>·</span>
                              <span>{String(chunk.metadata.source)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(chunk.id)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
