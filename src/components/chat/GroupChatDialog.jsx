import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Users, Paperclip, Download, FileText, Image as ImageIcon } from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";

export default function GroupChatDialog({ isOpen, onClose, currentUser, currentEmployee }) {
  const [message, setMessage] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [step, setStep] = useState("select"); // select, chat
  const [conversationId, setConversationId] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["groupMessages", conversationId],
    queryFn: () => base44.entities.ChatMessage.filter({
      conversation_id: conversationId
    }),
    enabled: !!conversationId && step === "chat",
  });

  // Real-time subscription
  useEffect(() => {
    if (!conversationId || step !== "chat") return;

    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === "create" && event.data?.conversation_id === conversationId) {
        queryClient.invalidateQueries({ queryKey: ["groupMessages", conversationId] });
        setTimeout(() => messageEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    });

    return unsubscribe;
  }, [conversationId, step, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMessages", conversationId] });
      setMessage("");
      setTimeout(() => messageEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
  });

  const handleCreateGroup = () => {
    if (selectedMembers.length === 0) return;
    
    const groupId = `group_${Date.now()}`;
    setConversationId(groupId);
    setStep("chat");
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const data = {
      conversation_id: conversationId,
      sender_id: currentUser.id,
      sender_name: currentEmployee?.full_name || currentUser.full_name,
      sender_avatar: currentEmployee?.avatar_url,
      message: message.trim(),
      is_read: false,
    };

    await sendMessageMutation.mutateAsync(data);

    // Notify group members
    for (const memberId of selectedMembers) {
      if (memberId !== currentUser.id) {
        const member = employees.find(e => e.id === memberId);
        await base44.entities.Notification.create({
          type: "message",
          title: `New message in ${groupName}`,
          message: message.trim().substring(0, 50),
          recipient_id: memberId,
          recipient_name: member?.full_name,
          link: "/Dashboard"
        });
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const attachmentData = {
        conversation_id: conversationId,
        sender_id: currentUser.id,
        sender_name: currentEmployee?.full_name || currentUser.full_name,
        sender_avatar: currentEmployee?.avatar_url,
        message: `📎 Shared a file: ${file.name}`,
        attachments: [{
          file_name: file.name,
          file_url: file_url,
          file_type: file.type,
          file_size: file.size
        }],
        is_read: false,
      };

      await sendMessageMutation.mutateAsync(attachmentData);
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatMessageTime = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        {step === "select" ? (
          <>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Create Group Chat
              </DialogTitle>
            </DialogHeader>

            <div className="px-6 pb-4">
              <Input
                placeholder="Group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <ScrollArea className="flex-1 px-6">
              <div className="space-y-2">
                {employees.filter(e => e.id !== currentUser?.id).map(emp => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedMembers.includes(emp.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMembers([...selectedMembers, emp.id]);
                        } else {
                          setSelectedMembers(selectedMembers.filter(id => id !== emp.id));
                        }
                      }}
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={emp.avatar_url} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700">
                        {emp.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">{emp.full_name}</p>
                      <p className="text-sm text-slate-500">{emp.job_title}</p>
                    </div>
                  </label>
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 pt-4 border-t flex justify-between">
              <p className="text-sm text-slate-600">{selectedMembers.length} members selected</p>
              <Button
                onClick={handleCreateGroup}
                disabled={selectedMembers.length === 0 || !groupName.trim()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Create Group
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="p-6 pb-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {groupName}
                <Badge className="ml-2">{selectedMembers.length + 1} members</Badge>
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages
                  .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                  .map((msg) => {
                    const isMine = msg.sender_id === currentUser?.id;
                    const hasAttachments = msg.attachments && msg.attachments.length > 0;
                    
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] ${isMine ? "order-2" : ""}`}>
                          {!isMine && (
                            <p className="text-xs text-slate-500 mb-1 ml-1">{msg.sender_name}</p>
                          )}
                          <div className={`rounded-lg p-3 ${
                            isMine 
                              ? "bg-indigo-600 text-white" 
                              : "bg-slate-100 text-slate-900"
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            
                            {hasAttachments && (
                              <div className="mt-2 space-y-2">
                                {msg.attachments.map((att, idx) => (
                                  <a
                                    key={idx}
                                    href={att.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded ${
                                      isMine ? "bg-indigo-700" : "bg-slate-200"
                                    } hover:opacity-80 transition-opacity`}
                                  >
                                    {att.file_type?.startsWith('image/') ? (
                                      <ImageIcon className="w-4 h-4" />
                                    ) : (
                                      <FileText className="w-4 h-4" />
                                    )}
                                    <span className="text-xs truncate flex-1">{att.file_name}</span>
                                    <Download className="w-3 h-3" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className={`text-xs text-slate-400 mt-1 ${isMine ? "text-right" : ""}`}>
                            {formatMessageTime(msg.created_date)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                <div ref={messageEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}