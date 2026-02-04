import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";
import { Users, Plus, Star, Target, MessageCircle, Calendar, TrendingUp } from "lucide-react";

export default function MentorshipProgram() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMentorship, setSelectedMentorship] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: mentorships = [], isLoading } = useQuery({
    queryKey: ["mentorships"],
    queryFn: () => base44.entities.Mentorship.list("-created_date"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Mentorship.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorships"] });
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Mentorship.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorships"] });
      setSelectedMentorship(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const mentorId = formData.get("mentor_id");
    const menteeId = formData.get("mentee_id");
    const mentor = employees.find(e => e.id === mentorId);
    const mentee = employees.find(e => e.id === menteeId);

    const data = {
      mentor_id: mentorId,
      mentor_name: mentor?.full_name,
      mentee_id: menteeId,
      mentee_name: mentee?.full_name,
      program_type: formData.get("program_type"),
      meeting_frequency: formData.get("meeting_frequency"),
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date"),
      goals: formData.get("goals")?.split("\n").filter(g => g.trim()),
      notes: formData.get("notes"),
    };

    createMutation.mutate(data);
  };

  const handleLogSession = (mentorship) => {
    updateMutation.mutate({
      id: mentorship.id,
      data: {
        sessions_completed: (mentorship.sessions_completed || 0) + 1
      }
    });
  };

  const filteredMentorships = mentorships.filter(m => 
    filterStatus === "all" || m.status === filterStatus
  );

  const activeMentorships = mentorships.filter(m => m.status === "active").length;
  const completedMentorships = mentorships.filter(m => m.status === "completed").length;
  const totalSessions = mentorships.reduce((sum, m) => sum + (m.sessions_completed || 0), 0);

  return (
    <div>
      <PageHeader
        title="Mentorship Program"
        subtitle={`${activeMentorships} active mentorship relationships`}
        action={() => setIsDialogOpen(true)}
        actionLabel="Create Mentorship"
        icon={<Plus className="w-4 h-4" />}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Active Mentorships</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{activeMentorships}</p>
              </div>
              <div className="p-2 md:p-3 rounded-lg bg-indigo-100">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Total Sessions</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{totalSessions}</p>
              </div>
              <div className="p-2 md:p-3 rounded-lg bg-emerald-100">
                <Calendar className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Completed</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{completedMentorships}</p>
              </div>
              <div className="p-2 md:p-3 rounded-lg bg-amber-100">
                <Star className="w-6 h-6 md:w-8 md:h-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mentorships List */}
      {filteredMentorships.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <EmptyState
            icon={Users}
            title="No mentorships found"
            description="Start building connections by creating your first mentorship"
            action={() => setIsDialogOpen(true)}
            actionLabel="Create Mentorship"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMentorships.map((mentorship) => (
            <Card key={mentorship.id} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <CardTitle className="text-base">
                      {mentorship.program_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </CardTitle>
                  </div>
                  <StatusBadge status={mentorship.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                        {mentorship.mentor_name?.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{mentorship.mentor_name}</p>
                      <p className="text-xs text-slate-500">Mentor</p>
                    </div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-slate-300" />
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{mentorship.mentee_name}</p>
                      <p className="text-xs text-slate-500">Mentee</p>
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                        {mentorship.mentee_name?.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{mentorship.sessions_completed || 0} sessions</span>
                  </div>
                  <Badge className="bg-slate-100 text-slate-700 capitalize">
                    {mentorship.meeting_frequency}
                  </Badge>
                </div>

                {mentorship.goals && mentorship.goals.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Goals</p>
                    <div className="space-y-1">
                      {mentorship.goals.slice(0, 2).map((goal, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Target className="w-3 h-3 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700 line-clamp-1">{goal}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleLogSession(mentorship)}
                    disabled={mentorship.status !== "active"}
                  >
                    Log Session
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setSelectedMentorship(mentorship)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Mentorship</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mentor *</Label>
                <Select name="mentor_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.status === "active").map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name} - {emp.job_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mentee *</Label>
                <Select name="mentee_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mentee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.status === "active" || e.status === "onboarding").map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name} - {emp.job_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Program Type *</Label>
                <Select name="program_type" defaultValue="general" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="career_development">Career Development</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="technical_skills">Technical Skills</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Meeting Frequency</Label>
                <Select name="meeting_frequency" defaultValue="biweekly">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" name="start_date" />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" name="end_date" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Goals (one per line)</Label>
              <Textarea
                name="goals"
                placeholder="Improve leadership skills&#10;Learn project management&#10;Develop technical expertise"
                className="h-24"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea name="notes" className="h-20" />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Create Mentorship
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      {selectedMentorship && (
        <Dialog open={!!selectedMentorship} onOpenChange={() => setSelectedMentorship(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mentorship Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">Mentor</p>
                  <p className="font-semibold text-slate-900">{selectedMentorship.mentor_name}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-slate-300" />
                <div>
                  <p className="text-sm text-slate-500">Mentee</p>
                  <p className="font-semibold text-slate-900">{selectedMentorship.mentee_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Program Type</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">
                    {selectedMentorship.program_type.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Status</p>
                  <StatusBadge status={selectedMentorship.status} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Sessions Completed</p>
                  <p className="text-sm font-medium text-slate-900">{selectedMentorship.sessions_completed || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Meeting Frequency</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{selectedMentorship.meeting_frequency}</p>
                </div>
              </div>

              {selectedMentorship.goals && selectedMentorship.goals.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-3">Goals</p>
                  <div className="space-y-2">
                    {selectedMentorship.goals.map((goal, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-indigo-50 rounded">
                        <Target className="w-4 h-4 text-indigo-600 mt-0.5" />
                        <p className="text-sm text-slate-700">{goal}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMentorship.notes && (
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">Notes</p>
                  <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded">{selectedMentorship.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}