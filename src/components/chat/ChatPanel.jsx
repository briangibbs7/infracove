import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, X, Search, Paperclip, AtSign } from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";

export default function ChatPanel({ currentUser, currentEmployee }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const messageEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["chatMessages"],
    queryFn: () => base44.entities.ChatMessage.list("-created_date", 500),
    enabled: isOpen,
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
      
      // Auto-scroll to new messages
      if (event.type === "create") {
        setTimeout(() => messageEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    });

    return unsubscribe;
  }, [isOpen, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
      setMessage("");
      setTimeout(() => messageEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.ChatMessage.update(id, { 
      is_read: true, 
      read_date: new Date().toISOString() 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
    },
  });

  // Get conversations grouped by recipient/sender
  const conversations = React.useMemo(() => {
    const convMap = new Map();
    
    messages.forEach(msg => {
      const otherUserId = msg.sender_id === currentUser?.id ? msg.recipient_id : msg.sender_id;
      const otherUserName = msg.sender_id === currentUser?.id ? msg.recipient_name : msg.sender_name;
      
      if (!otherUserId) return;
      
      if (!convMap.has(otherUserId)) {
        convMap.set(otherUserId, {
          userId: otherUserId,
          userName: otherUserName,
          messages: [],
          lastMessage: msg,
          unreadCount: 0,
        });
      }
      
      const conv = convMap.get(otherUserId);
      conv.messages.push(msg);
      
      if (msg.created_date > conv.lastMessage.created_date) {
        conv.lastMessage = msg;
      }
      
      if (!msg.is_read && msg.recipient_id === currentUser?.id) {
        conv.unreadCount++;
      }
    });
    
    return Array.from(convMap.values()).sort((a, b) => 
      new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
    );
  }, [messages, currentUser]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;

    // Extract mentions
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(message)) !== null) {
      const mentionedName = match[1];
      const mentionedUser = employees.find(e => 
        e.full_name?.toLowerCase().includes(mentionedName.toLowerCase())
      );
      if (mentionedUser) {
        mentions.push({
          user_id: mentionedUser.id,
          user_name: mentionedUser.full_name
        });
      }
    }

    const data = {
      conversation_id: selectedConversation.userId,
      sender_id: currentUser.id,
      sender_name: currentEmployee?.full_name || currentUser.full_name,
      sender_avatar: currentEmployee?.avatar_url,
      recipient_id: selectedConversation.userId,
      recipient_name: selectedConversation.userName,
      message: message.trim(),
      mentions,
      is_read: false,
    };

    await sendMessageMutation.mutateAsync(data);

    // Create notifications for mentions
    for (const mention of mentions) {
      await base44.entities.Notification.create({
        type: "mention",
        title: "You were mentioned",
        message: `${currentEmployee?.full_name || currentUser.full_name} mentioned you in a message`,
        recipient_id: mention.user_id,
        link: "/Dashboard"
      });
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    
    // Mark messages as read
    conv.messages.forEach(msg => {
      if (!msg.is_read && msg.recipient_id === currentUser?.id) {
        markAsReadMutation.mutate({ id: msg.id });
      }
    });
  };

  const handleMentionSelect = (employee) => {
    const mentionText = `@${employee.full_name} `;
    setMessage(prev => prev + mentionText);
    setShowMentions(false);
    setMentionSearch("");
  };

  const filteredEmployeesForMention = employees.filter(e => 
    e.id !== currentUser?.id &&
    e.full_name?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const formatMessageTime = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700"
        >
          <MessageSquare className="w-6 h-6" />
          {totalUnread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white p-0 flex items-center justify-center">
              {totalUnread}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] shadow-2xl rounded-lg overflow-hidden">
      <Card className="h-full flex flex-col">
        <CardHeader className="bg-indigo-600 text-white pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Messages
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-indigo-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
          {!selectedConversation ? (
            <div className="flex flex-col h-full">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2">
                  {conversations.filter(c => 
                    c.userName?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((conv) => (
                    <button
                      key={conv.userId}
                      onClick={() => handleSelectConversation(conv)}
                      className="w-full p-3 hover:bg-slate-50 rounded-lg transition-colors text-left flex items-start gap-3"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700">
                          {conv.userName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900 text-sm truncate">{conv.userName}</p>
                          <span className="text-xs text-slate-500">
                            {formatMessageTime(conv.lastMessage.created_date)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 truncate">{conv.lastMessage.message}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-indigo-600 h-5 min-w-5 px-1 flex items-center justify-center">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </button>
                  ))}
                  
                  {conversations.length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No conversations yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-3 border-b flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                >
                  ←
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                    {selectedConversation.userName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-slate-900">{selectedConversation.userName}</span>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {selectedConversation.messages
                    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                    .map((msg) => {
                      const isMine = msg.sender_id === currentUser?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] ${isMine ? "order-2" : ""}`}>
                            <div className={`rounded-lg p-3 ${
                              isMine 
                                ? "bg-indigo-600 text-white" 
                                : "bg-slate-100 text-slate-900"
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
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

              <div className="p-3 border-t">
                {showMentions && (
                  <div className="mb-2 border rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto">
                    {filteredEmployeesForMention.slice(0, 5).map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => handleMentionSelect(emp)}
                        className="w-full p-2 hover:bg-slate-50 flex items-center gap-2 text-left"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={emp.avatar_url} />
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                            {emp.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{emp.full_name}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMentions(!showMentions)}
                    className="flex-shrink-0"
                  >
                    <AtSign className="w-4 h-4" />
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
                    className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}