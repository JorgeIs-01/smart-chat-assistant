import { useState, useCallback, useRef } from "react";
import type { ChatMessageType, Conversation } from "@/types/chat";
import { queryRAG } from "@/lib/rag-engine";

function generateId(): string {
  return crypto.randomUUID();
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;
  const messages = activeConversation?.messages ?? [];

  const createConversation = useCallback(() => {
    const id = generateId();
    const newConv: Conversation = {
      id,
      title: "Nueva consulta",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(id);
    return id;
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    },
    [activeConversationId]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      let convId = activeConversationId;
      if (!convId) {
        convId = createConversation();
      }

      const userMessage: ChatMessageType = {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      const assistantMessage: ChatMessageType = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      // Update title from first message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                title: c.messages.length === 0 ? content.slice(0, 50) : c.title,
                messages: [...c.messages, userMessage, assistantMessage],
                updatedAt: new Date(),
              }
            : c
        )
      );

      setIsLoading(true);
      abortRef.current = false;

      try {
        const result = await queryRAG(content, (token) => {
          if (abortRef.current) return;
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMessage.id
                        ? { ...m, content: m.content + token }
                        : m
                    ),
                  }
                : c
            )
          );
        });

        // Finalize message with sources
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, isStreaming: false, sources: result.sources }
                      : m
                  ),
                }
              : c
          )
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Error desconocido";
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessage.id
                      ? {
                          ...m,
                          content: `Error: ${errorMsg}. Verifica que Ollama esté ejecutándose y Supabase esté configurado correctamente.`,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, createConversation]
  );

  return {
    conversations,
    activeConversation,
    activeConversationId,
    messages,
    isLoading,
    sendMessage,
    createConversation,
    deleteConversation,
    setActiveConversationId,
  };
}
