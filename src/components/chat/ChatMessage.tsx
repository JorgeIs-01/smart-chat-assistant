import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { SourcePanel } from "./SourcePanel";
import { TypingIndicator } from "./TypingIndicator";
import type { ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  isFirst?: boolean;
}

export function ChatMessage({ message, isFirst = false }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={isFirst ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] ${
          isUser
            ? "rounded-2xl bg-chat-user px-5 py-3 text-chat-user-foreground"
            : "rounded-2xl bg-chat-ai px-5 py-3 text-chat-ai-foreground"
        }`}
      >
        {message.isStreaming && !message.content ? (
          <TypingIndicator />
        ) : isUser ? (
          <p className="text-sm leading-relaxed">{message.content}</p>
        ) : (
          <div className="chat-prose text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {!isUser && message.sources && !message.isStreaming && (
          <SourcePanel sources={message.sources} />
        )}
      </div>
    </motion.div>
  );
}
