import { useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Database } from "lucide-react";
import type { ChatMessageType } from "@/types/chat";

interface ChatWindowProps {
  messages: ChatMessageType[];
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatWindow({ messages, onSend, isLoading }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Chat history */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <Database className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-lg font-medium text-foreground">
              Pregúntame cualquier cosa sobre tus documentos
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Escribe una pregunta en lenguaje natural. Buscaré en tu base de conocimiento
              y responderé citando las fuentes relevantes.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => (
                <ChatMessage key={msg.id} message={msg} isFirst={i === 0} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} isLoading={isLoading} />
    </div>
  );
}
