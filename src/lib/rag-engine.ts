// =============================================
// MOTOR RAG — Retrieval Augmented Generation
// =============================================
// Orquesta la búsqueda semántica y la generación de respuestas.

import { generateEmbedding, generateChatResponse } from "./ollama";
import { searchSimilarChunks } from "./supabase-client";
import { config } from "./config";

export interface RAGSource {
  id: string;
  contenido: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface RAGResponse {
  answer: string;
  sources: RAGSource[];
}

const SYSTEM_PROMPT = `Eres un asistente de conocimiento interno. Tu función es responder preguntas basándote EXCLUSIVAMENTE en el contexto proporcionado.

Reglas:
1. Responde SOLO con información del contexto. No inventes datos.
2. Si el contexto no contiene información suficiente, responde: "No he encontrado información relevante en los documentos para responder a tu pregunta."
3. Cita las fuentes cuando sea posible, referenciándolas por su número.
4. Sé conciso y directo.
5. Usa formato markdown cuando sea útil.`;

/**
 * Ejecuta el pipeline RAG completo:
 * 1. Genera embedding de la pregunta
 * 2. Busca chunks similares en Supabase
 * 3. Construye contexto y genera respuesta con Ollama
 */
export async function queryRAG(
  question: string,
  onToken: (token: string) => void
): Promise<RAGResponse> {
  // Paso 1: Generar embedding de la pregunta
  const queryEmbedding = await generateEmbedding(question);

  // Paso 2: Buscar chunks relevantes
  const results = await searchSimilarChunks(
    queryEmbedding,
    config.topK,
    config.similarityThreshold
  );

  const sources: RAGSource[] = results.map((r) => ({
    id: r.id,
    contenido: r.contenido,
    metadata: r.metadata,
    similarity: r.similarity,
  }));

  // Paso 3: Construir contexto
  let contextText = "";
  if (sources.length > 0) {
    contextText = sources
      .map((s, i) => `[Fuente ${i + 1}] (Similitud: ${(s.similarity * 100).toFixed(1)}%)\n${s.contenido}`)
      .join("\n\n---\n\n");
  } else {
    contextText = "No se encontraron documentos relevantes.";
  }

  const userMessage = `Contexto de documentos internos:\n\n${contextText}\n\n---\n\nPregunta del usuario: ${question}`;

  // Paso 4: Generar respuesta
  const answer = await generateChatResponse(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    onToken
  );

  return { answer, sources };
}
