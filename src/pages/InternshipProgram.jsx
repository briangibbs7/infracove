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
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, differenceInWeeks } from "date-fns";
import { Briefcase, Plus, GraduationCap, TrendingUp, Star, CheckCircle2 } from "lucide-react";

export default function InternshipProgram() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: internships = [], isLoading } = useQuery({
    queryKey: ["internships"],
    queryFn: () => base44.entities.Internship.list("-created_date"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Internship.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internships"] });
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Internship.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internships"] });
      setSelectedIntern(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const supervisorId = formData.get("supervisor_id");
    const supervisor = employees.find(e => e.id === supervisorId);

    const data = {
      intern_name: formData.get("intern_name"),
      intern_email: formData.get("intern_email"),
      position_title: formData.get("position_title"),
      department: formData.get("department"),
      supervisor_id: supervisorId,
      supervisor_name: supervisor?.full_name,
      internship_type: formData.get("internship_type"),
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date"),
      stipend: formData.get("stipend") ? parseFloat(formData.get("stipend")) : undefined,
      skills_to_develop: formData.get("skills")?.split(",").map(s => s.trim()).filter(Boolean),
      notes: formData.get("notes"),
    };

    createMutation.mutate(data);
  };

  const handleStatusUpdate = (internship, newStatus) => {
    updateMutation.mutate({
      id: internship.id,
      data: { status: newStatus }
    });
  };

  const filteredInternships = internships.filter(i => 
    filterStatus === "all" || i.status === filterStatus
  );

  const activeInterns = internships.filter(i => i.status === "active").length;
  const completedInterns = internships.filter(i => i.status === "completed").length;
  const convertedToFullTime = internships.filter(i => i.converted_to_fulltime).length;

  return (
    <div>
      <PageHeader
        title="Internship Program"
        subtitle={`${activeInterns} active interns`}
        action={() => setIsDialogOpen(true)}
        actionLabel="Add Intern"
        icon={<Plus className="w-4 h-4" />}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Active Interns</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{activeInterns}</p>
              </div>
              <div className="p-2 md:p-3 rounded-lg bg-indigo-100">
                <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Completed</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{completedInterns}</p>
              </div>
              <div className="p-2 md:p-3 rounded-lg bg-emerald-100">
                <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-slate-500 mb-1">Hired Full-Time</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{convertedToFullTime}</p>
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
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="application_received">Application Received</SelectItem>
            <SelectItem value="interviewing">Interviewing</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Internships List */}
      {filteredInternships.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <EmptyState
            icon={GraduationCap}
            title="No internships found"
            description="Start growing talent by adding your first intern"
            action={() => setIsDialogOpen(true)}
            actionLabel="Add Intern"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInternships.map((intern) => (
            <Card key={intern.id} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{intern.intern_name}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">{intern.position_title}</p>
                  </div>
                  <StatusBadge status={intern.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <Badge className="bg-slate-100 text-slate-700">{intern.department}</Badge>
                  {intern.converted_to_fulltime && (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      <Star className="w-3 h-3 mr-1" />
                      Hired
                    </Badge>
                  )}
                </div>

                {intern.supervisor_name && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Supervisor</p>
                    <p className="text-sm font-medium text-slate-900">{intern.supervisor_name}</p>
                  </div>
                )}

                {intern.start_date && intern.end_date && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Duration</p>
                    <p className="text-sm text-slate-700">
                      {format(parseISO(intern.start_date), "MMM d")} - {format(parseISO(intern.end_date), "MMM d, yyyy")}
                    </p>
                  </div>
                )}

                {intern.skills_to_develop && intern.skills_to_develop.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {intern.skills_to_develop.slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} className="bg-indigo-100 text-indigo-700 text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {intern.skills_to_develop.length > 3 && (
                        <Badge className="bg-slate-100 text-slate-600 text-xs">
                          +{intern.skills_to_develop.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  size="sm"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setSelectedIntern(intern)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Intern</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Intern Name *</Label>
                <Input name="intern_name" required />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" name="intern_email" required />
              </div>

              <div className="space-y-2">
                <Label>Position Title *</Label>
                <Input name="position_title" required placeholder="e.g., Software Engineering Intern" />
              </div>

              <div className="space-y-2">
                <Label>Department *</Label>
                <Select name="department" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Supervisor</Label>
                <Select name="supervisor_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Select supervisor" />
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
                <Label>Internship Type</Label>
                <Select name="internship_type" defaultValue="summer">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="semester">Semester</SelectItem>
                    <SelectItem value="year_round">Year Round</SelectItem>
                    <SelectItem value="project_based">Project Based</SelectItem>
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

              <div className="space-y-2">
                <Label>Stipend ($)</Label>
                <Input type="number" name="stipend" placeholder="0" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Skills to Develop (comma-separated)</Label>
              <Input
                name="skills"
                placeholder="JavaScript, React, Team Collaboration"
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
                Add Intern
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      {selectedIntern && (
        <Dialog open={!!selectedIntern} onOpenChange={() => setSelectedIntern(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Internship Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedIntern.intern_name}</h3>
                  <p className="text-slate-600 mt-1">{selectedIntern.position_title}</p>
                  <div className="flex gap-2 mt-3">
                    <StatusBadge status={selectedIntern.status} />
                    <Badge className="bg-slate-100 text-slate-700">{selectedIntern.department}</Badge>
                    {selectedIntern.converted_to_fulltime && (
                      <Badge className="bg-emerald-100 text-emerald-700">Hired Full-Time</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Email</p>
                  <p className="text-sm font-medium text-slate-900">{selectedIntern.intern_email}</p>
                </div>
                {selectedIntern.supervisor_name && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Supervisor</p>
                    <p className="text-sm font-medium text-slate-900">{selectedIntern.supervisor_name}</p>
                  </div>
                )}
                {selectedIntern.stipend && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Stipend</p>
                    <p className="text-sm font-medium text-slate-900">${selectedIntern.stipend.toLocaleString()}</p>
                  </div>
                )}
                {selectedIntern.internship_type && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Type</p>
                    <p className="text-sm font-medium text-slate-900 capitalize">
                      {selectedIntern.internship_type.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
              </div>

              {selectedIntern.skills_to_develop && selectedIntern.skills_to_develop.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-3">Skills to Develop</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedIntern.skills_to_develop.map((skill, idx) => (
                      <Badge key={idx} className="bg-indigo-100 text-indigo-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedIntern.projects && selectedIntern.projects.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-3">Projects</p>
                  <div className="space-y-3">
                    {selectedIntern.projects.map((project, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-slate-900">{project.title}</p>
                          <StatusBadge status={project.status} />
                        </div>
                        {project.description && (
                          <p className="text-sm text-slate-600 mt-2">{project.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedIntern.feedback && (
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">Feedback</p>
                  <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded">{selectedIntern.feedback}</p>
                </div>
              )}

              {selectedIntern.status === "active" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedIntern, "completed")}
                  >
                    Mark as Completed
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}