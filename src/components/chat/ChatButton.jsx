import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import ChatPanel from "./ChatPanel";

export default function ChatButton({ currentUser, currentEmployee }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["chatMessages"],
    queryFn: () => base44.entities.ChatMessage.list("-created_date", 200),
  });

  // Real-time subscription for new messages
  React.useEffect(() => {
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      // Refetch on any message change
      if (event.type === 'create' || event.type === 'update') {
        // Force immediate refetch
        base44.entities.ChatMessage.list("-created_date", 200).then(newMessages => {
          // Update the query cache directly
          queryClient.setQueryData(["chatMessages"], newMessages);
        });
      }
    });

    return unsubscribe;
  }, []);

  const unreadCount = messages.filter(
    m => !m.is_read && m.recipient_id === currentUser?.id
  ).length;

  if (isOpen) {
    return <ChatPanel currentUser={currentUser} currentEmployee={currentEmployee} onClose={() => setIsOpen(false)} />;
  }

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      <Button
        onClick={() => setIsOpen(true)}
        className="h-14 w-14 md:h-14 md:w-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
      >
        <MessageSquare className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white p-0 flex items-center justify-center text-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );
}