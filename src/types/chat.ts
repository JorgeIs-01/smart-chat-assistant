export interface ChatMessageType {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RAGSourceType[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface RAGSourceType {
  id: string;
  contenido: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessageType[];
  createdAt: Date;
  updatedAt: Date;
}
