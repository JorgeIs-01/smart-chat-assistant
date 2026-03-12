import { useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";

const Index = () => {
  const {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    sendMessage,
    createConversation,
    deleteConversation,
    setActiveConversationId,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={(id) => {
          setActiveConversationId(id);
          setSidebarOpen(false);
        }}
        onCreate={() => {
          createConversation();
          setSidebarOpen(false);
        }}
        onDelete={deleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <ChatWindow
          messages={messages}
          onSend={sendMessage}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
};

export default Index;
