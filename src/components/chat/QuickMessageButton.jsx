import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Send } from "lucide-react";

export default function QuickMessageButton({ recipient, currentUser, currentEmployee }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      await base44.entities.ChatMessage.create({
        conversation_id: recipient.id,
        sender_id: currentUser.id,
        sender_name: currentEmployee?.full_name || currentUser.full_name,
        sender_avatar: currentEmployee?.avatar_url,
        recipient_id: recipient.id,
        recipient_name: recipient.full_name || recipient.name,
        message: message.trim(),
        is_read: false,
      });

      await base44.entities.Notification.create({
        type: "new_message",
        title: "New Message",
        message: `${currentEmployee?.full_name || currentUser.full_name} sent you a message`,
        recipient_id: recipient.id,
        link: "/Dashboard"
      });

      setMessage("");
      setIsOpen(false);
    } catch (error) {
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Message
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message to {recipient.full_name || recipient.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}