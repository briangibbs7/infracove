import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { format, parseISO } from "date-fns";
import { Megaphone, Plus, Edit, Trash2, AlertCircle, ThumbsUp, Heart, Laugh, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = ["HR", "Finance", "Legal", "IT"];

export default function Announcements() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [categoryFilter, setCategoryFilter] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => base44.entities.Announcement.list("-created_date"),
  });

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
    }
  }, [user, employees]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Announcement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setIsDialogOpen(false);
      setEditingAnnouncement(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Announcement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setIsDialogOpen(false);
      setEditingAnnouncement(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const targetDepts = formData.get("target_departments");
    const data = {
      title: formData.get("title"),
      content: formData.get("content"),
      category: formData.get("category"),
      priority: formData.get("priority"),
      target_departments: targetDepts === "all" ? [] : [targetDepts],
      author_id: currentEmployee?.id,
      author_name: currentEmployee?.full_name,
      status: formData.get("status"),
      publish_date: formData.get("status") === "published" ? new Date().toISOString().split('T')[0] : undefined,
    };

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isAdmin = user?.role === "admin";
  const canManage = isAdmin || currentEmployee?.department === "HR";

  const relevantAnnouncements = announcements.filter(ann => {
    if (ann.status !== "published") return canManage;
    
    // Category filter
    if (categoryFilter !== "all" && ann.category !== categoryFilter) return false;
    
    // Department filter
    if (!ann.target_departments || ann.target_departments.length === 0) return true;
    return ann.target_departments.includes(currentEmployee?.department);
  });

  const handleReaction = async (announcementId, emoji) => {
    const announcement = announcements.find(a => a.id === announcementId);
    const reactions = announcement.reactions || [];
    
    const existingReaction = reactions.find(r => r.user_id === currentEmployee?.id);
    
    let newReactions;
    if (existingReaction && existingReaction.emoji === emoji) {
      // Remove reaction
      newReactions = reactions.filter(r => r.user_id !== currentEmployee?.id);
    } else if (existingReaction) {
      // Update reaction
      newReactions = reactions.map(r => 
        r.user_id === currentEmployee?.id 
          ? { ...r, emoji } 
          : r
      );
    } else {
      // Add new reaction
      newReactions = [...reactions, {
        user_id: currentEmployee?.id,
        user_name: currentEmployee?.full_name,
        emoji
      }];
    }
    
    await updateMutation.mutateAsync({ 
      id: announcementId, 
      data: { reactions: newReactions } 
    });
  };

  const handleAddComment = async (announcementId) => {
    const text = commentText[announcementId];
    if (!text?.trim()) return;
    
    const announcement = announcements.find(a => a.id === announcementId);
    const comments = announcement.comments || [];
    
    const newComment = {
      id: Date.now().toString(),
      user_id: currentEmployee?.id,
      user_name: currentEmployee?.full_name,
      comment: text,
      created_date: new Date().toISOString()
    };
    
    await updateMutation.mutateAsync({ 
      id: announcementId, 
      data: { comments: [...comments, newComment] } 
    });
    
    setCommentText({ ...commentText, [announcementId]: "" });
    toast.success("Comment added");
  };

  const getReactionCount = (reactions, emoji) => {
    return reactions?.filter(r => r.emoji === emoji).length || 0;
  };

  const hasUserReacted = (reactions, emoji) => {
    return reactions?.some(r => r.user_id === currentEmployee?.id && r.emoji === emoji);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-700 border-red-200";
      case "high": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div>
      <PageHeader
        title="Company News"
        subtitle="Stay updated with company announcements and updates"
        action={canManage ? () => {
          setEditingAnnouncement(null);
          setIsDialogOpen(true);
        } : undefined}
        actionLabel={canManage ? "Create Announcement" : undefined}
      >
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="it">IT</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="events">Events</SelectItem>
            <SelectItem value="policy">Policy</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-slate-200 rounded w-2/3 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-full mb-2" />
                <div className="h-4 bg-slate-100 rounded w-4/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : relevantAnnouncements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          description={canManage ? "Create your first announcement" : "No announcements at this time"}
          action={canManage ? () => setIsDialogOpen(true) : undefined}
          actionLabel={canManage ? "Create Announcement" : undefined}
        />
      ) : (
        <div className="space-y-4">
          {relevantAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-slate-900">{announcement.title}</h3>
                      {announcement.priority !== "normal" && (
                        <Badge variant="outline" className={getPriorityColor(announcement.priority)}>
                          {announcement.priority === "urgent" && <AlertCircle className="w-3 h-3 mr-1" />}
                          {announcement.priority}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                      <span>By {announcement.author_name}</span>
                      <span>•</span>
                      <span className="capitalize">{announcement.category}</span>
                      {announcement.publish_date && (
                        <>
                          <span>•</span>
                          <span>{format(parseISO(announcement.publish_date), "MMM d, yyyy")}</span>
                        </>
                      )}
                      <StatusBadge status={announcement.status} />
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAnnouncement(announcement);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteMutation.mutate(announcement.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{announcement.content}</p>
                {announcement.target_departments && announcement.target_departments.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-slate-500">Targeted to:</span>
                    {announcement.target_departments.map(dept => (
                      <Badge key={dept} variant="outline" className="text-xs">
                        {dept}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Reactions */}
                <div className="mt-4 flex items-center gap-2 pb-3 border-b">
                  {["👍", "❤️", "😊", "🎉"].map(emoji => {
                    const count = getReactionCount(announcement.reactions, emoji);
                    const hasReacted = hasUserReacted(announcement.reactions, emoji);
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(announcement.id, emoji)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
                          hasReacted 
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-300" 
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="font-medium">{count}</span>}
                      </button>
                    );
                  })}
                  <div className="ml-auto flex items-center gap-1 text-slate-500">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{announcement.comments?.length || 0}</span>
                  </div>
                </div>

                {/* Comments */}
                <div className="mt-4 space-y-3">
                  {announcement.comments?.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-medium shrink-0">
                        {comment.user_name?.charAt(0)}
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.user_name}</span>
                          <span className="text-xs text-slate-500">
                            {format(parseISO(comment.created_date), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{comment.comment}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add Comment */}
                  <div className="flex gap-3 mt-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-medium shrink-0">
                      {currentEmployee?.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Write a comment..."
                        value={commentText[announcement.id] || ""}
                        onChange={(e) => setCommentText({ ...commentText, [announcement.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(announcement.id);
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(announcement.id)}
                        disabled={!commentText[announcement.id]?.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={editingAnnouncement?.title}
                placeholder="Announcement title..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                name="content"
                defaultValue={editingAnnouncement?.content}
                placeholder="Write your announcement..."
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue={editingAnnouncement?.category || "general"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="it">IT</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select name="priority" defaultValue={editingAnnouncement?.priority || "normal"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_departments">Target Department</Label>
                <Select name="target_departments" defaultValue={
                  editingAnnouncement?.target_departments?.length > 0 
                    ? editingAnnouncement.target_departments[0] 
                    : "all"
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select name="status" defaultValue={editingAnnouncement?.status || "draft"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setEditingAnnouncement(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingAnnouncement ? "Update" : "Create"} Announcement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}