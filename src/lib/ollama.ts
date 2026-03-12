// =============================================
// CLIENTE OLLAMA — IA LOCAL
// =============================================
// Todas las llamadas a Ollama pasan por aquí.
// Si cambias de proveedor de IA, solo modifica este archivo.

import { config } from "./config";

interface EmbeddingResponse {
  embedding: number[];
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  message: {
    content: string;
  };
  done: boolean;
}

/**
 * Genera un embedding vectorial para el texto dado.
 * Usa nomic-embed-text (768 dimensiones) por defecto.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${config.ollamaUrl}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.embeddingModel,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error generando embedding: ${response.statusText}`);
  }

  const data: EmbeddingResponse = await response.json();
  return data.embedding;
}

/**
 * Genera una respuesta de chat usando el modelo LLM local.
 * Retorna el stream de texto para renderizado progresivo.
 */
export async function generateChatResponse(
  messages: ChatMessage[],
  onToken: (token: string) => void
): Promise<string> {
  const response = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.chatModel,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error en Ollama: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No se pudo leer la respuesta de Ollama");

  const decoder = new TextDecoder();
  let fullResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    // Ollama envía JSON por línea
    const lines = chunk.split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const parsed: ChatResponse = JSON.parse(line);
        if (parsed.message?.content) {
          fullResponse += parsed.message.content;
          onToken(parsed.message.content);
        }
      } catch {
        // Línea parcial, ignorar
      }
    }
  }

  return fullResponse;
}

/**
 * Verifica si Ollama está disponible.
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${config.ollamaUrl}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}
