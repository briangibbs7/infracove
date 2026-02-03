import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import ChatPanel from "./ChatPanel";

export default function ChatButton({ currentUser, currentEmployee }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: messages = [] } = useQuery({
    queryKey: ["chatMessages"],
    queryFn: () => base44.entities.ChatMessage.list("-created_date", 200),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = messages.filter(
    m => !m.is_read && m.recipient_id === currentUser?.id
  ).length;

  if (isOpen) {
    return <ChatPanel currentUser={currentUser} currentEmployee={currentEmployee} onClose={() => setIsOpen(false)} />;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={() => setIsOpen(true)}
        className="h-14 w-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700"
      >
        <MessageSquare className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white p-0 flex items-center justify-center">
            {unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );
}