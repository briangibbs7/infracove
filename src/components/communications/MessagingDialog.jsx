import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";

export default function MessagingDialog({ isOpen, onClose, recipient, currentEmployee }) {
  const [messageContent, setMessageContent] = useState("");
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", currentEmployee?.id, recipient?.id],
    queryFn: async () => {
      if (!currentEmployee || !recipient) return [];
      const sent = await base44.entities.Message.filter({
        sender_id: currentEmployee.id,
        recipient_id: recipient.id,
      });
      const received = await base44.entities.Message.filter({
        sender_id: recipient.id,
        recipient_id: currentEmployee.id,
      });
      return [...sent, ...received].sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );
    },
    enabled: !!currentEmployee && !!recipient && isOpen,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setMessageContent("");
    },
  });

  const createNotificationMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.create(data),
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageContent.trim() || !currentEmployee || !recipient) return;

    await sendMessageMutation.mutateAsync({
      sender_id: currentEmployee.id,
      sender_name: currentEmployee.full_name,
      recipient_id: recipient.id,
      recipient_name: recipient.full_name,
      content: messageContent,
      is_read: false,
    });

    // Create notification for recipient
    createNotificationMutation.mutate({
      recipient_id: recipient.id,
      recipient_name: recipient.full_name,
      type: "message_received",
      title: `New message from ${currentEmployee.full_name}`,
      message: messageContent.substring(0, 100),
      priority: "normal",
    });
  };

  useEffect(() => {
    if (isOpen) {
      setMessageContent("");
    }
  }, [isOpen]);

  if (!recipient || !currentEmployee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[600px] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={recipient.avatar_url} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                {recipient.full_name?.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{recipient.full_name}</DialogTitle>
              <p className="text-sm text-slate-500">{recipient.job_title}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4 min-h-[300px]">
          {messages.length > 0 ? (
            messages.map((message) => {
              const isSent = message.sender_id === currentEmployee.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isSent
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isSent ? "text-indigo-200" : "text-slate-500"
                      }`}
                    >
                      {format(new Date(message.created_date), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="border-t pt-4 space-y-3">
          <Textarea
            placeholder="Type your message..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!messageContent.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}