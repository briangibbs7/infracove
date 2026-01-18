import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Check, Trash2, AlertCircle, Calendar, FileText, MessageCircle } from "lucide-react";
import { format } from "date-fns";

const notificationIcons = {
  task_assigned: Calendar,
  approval_needed: AlertCircle,
  timeoff_approved: Check,
  timeoff_rejected: AlertCircle,
  policy_update: FileText,
  message_received: MessageCircle,
  review_pending: FileText,
  other: Bell,
};

export default function NotificationCenter({ currentEmployee }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", currentEmployee?.id],
    queryFn: () => base44.entities.Notification.filter({ recipient_id: currentEmployee?.id }, "-created_date"),
    enabled: !!currentEmployee,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { 
      is_read: true, 
      read_date: new Date().toISOString().split('T')[0] 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
    setIsOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-slate-500" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-slate-900">Notifications</h3>
          <p className="text-xs text-slate-500">{unreadCount} unread</p>
        </div>
        
        {notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.slice(0, 10).map((notification) => {
              const Icon = notificationIcons[notification.type] || Bell;
              return (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-slate-50 cursor-pointer ${
                    !notification.is_read ? "bg-indigo-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      notification.priority === "urgent" ? "bg-red-100" :
                      notification.priority === "high" ? "bg-amber-100" :
                      "bg-indigo-100"
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        notification.priority === "urgent" ? "text-red-600" :
                        notification.priority === "high" ? "text-amber-600" :
                        "text-indigo-600"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900">{notification.title}</p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {format(new Date(notification.created_date), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(notification.id);
                      }}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}