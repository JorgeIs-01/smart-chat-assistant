// =============================================
// CLIENTE SUPABASE — BASE DE DATOS VECTORIAL
// =============================================
// Centraliza todas las operaciones con Supabase.
// Si cambias de base de datos, modifica solo este archivo.

import { config } from "./config";

// -----------------------------------------------
// NOTA: En este proyecto NO se usa el SDK de Supabase
// porque Ollama corre en local y las operaciones
// de embedding + búsqueda se hacen directamente.
// Si conectas Supabase Cloud, descomenta y usa el SDK.
// -----------------------------------------------

interface DocumentChunk {
  id: string;
  contenido: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  created_at: string;
}

interface SearchResult {
  id: string;
  contenido: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

/**
 * Busca chunks similares al embedding dado usando pgvector.
 * Llama a la función RPC `match_documentos` en Supabase.
 *
 * SQL necesario en Supabase:
 * ```sql
 * CREATE OR REPLACE FUNCTION match_documentos(
 *   query_embedding VECTOR(768),
 *   match_threshold FLOAT DEFAULT 0.3,
 *   match_count INT DEFAULT 5
 * )
 * RETURNS TABLE (
 *   id UUID,
 *   contenido TEXT,
 *   metadata JSONB,
 *   similarity FLOAT
 * )
 * LANGUAGE sql STABLE
 * AS $$
 *   SELECT
 *     id,
 *     contenido,
 *     metadata,
 *     1 - (embedding <=> query_embedding) AS similarity
 *   FROM documentos
 *   WHERE 1 - (embedding <=> query_embedding) > match_threshold
 *   ORDER BY embedding <=> query_embedding
 *   LIMIT match_count;
 * $$;
 * ```
 */
export async function searchSimilarChunks(
  queryEmbedding: number[],
  matchCount: number = config.topK,
  threshold: number = config.similarityThreshold
): Promise<SearchResult[]> {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/match_documentos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
    },
    body: JSON.stringify({
      query_embedding: `[${queryEmbedding.join(",")}]`,
      match_threshold: threshold,
      match_count: matchCount,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error buscando documentos: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Inserta un chunk con su embedding en la base de datos.
 */
export async function insertChunk(
  contenido: string,
  embedding: number[],
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/documentos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      contenido,
      embedding: `[${embedding.join(",")}]`,
      metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error insertando chunk: ${response.statusText}`);
  }
}

/**
 * Obtiene todos los chunks almacenados (para el panel admin).
 */
export async function getAllChunks(): Promise<DocumentChunk[]> {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/documentos?select=id,contenido,metadata,created_at&order=created_at.desc`,
    {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Error obteniendo chunks: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Elimina un chunk por su ID.
 */
export async function deleteChunk(id: string): Promise<void> {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/documentos?id=eq.${id}`,
    {
      method: "DELETE",
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Error eliminando chunk: ${response.statusText}`);
  }
}

/**
 * Cuenta el total de documentos indexados.
 */
export async function getChunkCount(): Promise<number> {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/documentos?select=id&head=true`,
    {
      method: "HEAD",
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        Prefer: "count=exact",
      },
    }
  );

  const count = response.headers.get("content-range");
  if (count) {
    const total = count.split("/")[1];
    return parseInt(total, 10) || 0;
  }
  return 0;
}
