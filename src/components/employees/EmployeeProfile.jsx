import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/ui/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, parseISO, isPast } from "date-fns";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Heart,
  History,
  CheckCircle2,
  Clock,
  MessageCircle,
  Briefcase,
  Users,
  Target
} from "lucide-react";
import SkillMatrixDisplay from "@/components/skills/SkillMatrixDisplay";
import SkillMatrixEditor from "@/components/skills/SkillMatrixEditor";

export default function EmployeeProfile({ employee, onMessage, onEdit, employees }) {
  const [user, setUser] = React.useState(null);
  const [isSkillEditorOpen, setIsSkillEditorOpen] = React.useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);
  const { data: onboardingTasks = [] } = useQuery({
    queryKey: ["onboardingTasks", employee?.id],
    queryFn: () => base44.entities.OnboardingTask.filter({
      $or: [
        { assigned_to: employee.id },
        { employee_id: employee.id }
      ]
    }),
    enabled: !!employee?.id,
  });

  const { data: offboardingTasks = [] } = useQuery({
    queryKey: ["offboardingTasks", employee?.id],
    queryFn: () => base44.entities.OffboardingTask.filter({
      $or: [
        { assigned_to: employee.id },
        { employee_id: employee.id }
      ]
    }),
    enabled: !!employee?.id,
  });

  const { data: timeOffRequests = [] } = useQuery({
    queryKey: ["timeOffRequests", employee?.id],
    queryFn: () => base44.entities.TimeOffRequest.filter({ employee_id: employee.id }),
    enabled: !!employee?.id,
  });

  const { data: performanceReviews = [] } = useQuery({
    queryKey: ["performanceReviews", employee?.id],
    queryFn: () => base44.entities.PerformanceReview.filter({ employee_id: employee.id }),
    enabled: !!employee?.id,
  });

  const { data: assetAssignments = [] } = useQuery({
    queryKey: ["assets", employee?.id],
    queryFn: () => base44.entities.Asset.filter({ assigned_to: employee.id }),
    enabled: !!employee?.id,
  });

  const { data: employeeSkills = [] } = useQuery({
    queryKey: ["employeeSkills", employee?.id],
    queryFn: () => base44.entities.EmployeeSkill.filter({ employee_id: employee.id }),
    enabled: !!employee?.id,
  });

  if (!employee) return null;

  const allTasks = [...onboardingTasks, ...offboardingTasks];
  const pendingTasks = allTasks.filter(t => t.status !== "completed");
  const completedTasks = allTasks.filter(t => t.status === "completed");

  const manager = employee.manager_id ? employees?.find(e => e.id === employee.manager_id) : null;
  const directReports = employees?.filter(e => e.manager_id === employee.id) || [];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={employee.avatar_url} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-3xl font-semibold">
                {employee.full_name?.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{employee.full_name}</h2>
                  <p className="text-lg text-slate-600 mt-1">{employee.job_title}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <StatusBadge status={employee.status} />
                    <Badge className="bg-slate-100 text-slate-700">{employee.department}</Badge>
                    <Badge className="bg-indigo-100 text-indigo-700 capitalize">
                      {employee.employment_type?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => onMessage(employee)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    onClick={() => onEdit(employee)}
                    variant="outline"
                  >
                    Edit Profile
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <a href={`mailto:${employee.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{employee.email}</span>
                </a>
                {employee.phone && (
                  <a href={`tel:${employee.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{employee.phone}</span>
                  </a>
                )}
                {employee.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{employee.location}</span>
                  </div>
                )}
                {employee.start_date && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Started {format(new Date(employee.start_date), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks
            {pendingTasks.length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white text-xs">{pendingTasks.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="timeoff">Time Off</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills */}
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <CardTitle className="text-base">Skills & Competencies</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {employee.skills && employee.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {employee.skills.map((skill, index) => (
                      <Badge key={index} className="bg-indigo-100 text-indigo-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No skills added yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  <CardTitle className="text-base">Emergency Contacts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {employee.emergency_contacts && employee.emergency_contacts.length > 0 ? (
                  <div className="space-y-3">
                    {employee.emergency_contacts.map((contact, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Heart className={`w-5 h-5 mt-0.5 ${contact.is_primary ? "text-red-500 fill-red-500" : "text-slate-400"}`} />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{contact.name}</p>
                          <p className="text-sm text-slate-600">{contact.relationship}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </p>
                        </div>
                        {contact.is_primary && (
                          <Badge className="bg-red-100 text-red-700">Primary</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400">
                    <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No emergency contacts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Job History */}
          {employee.job_history && employee.job_history.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <CardTitle className="text-base">Job History</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employee.job_history.map((job, index) => (
                    <div key={index} className="relative pl-6 pb-4 border-l-2 border-indigo-200 last:pb-0">
                      <div className="absolute left-0 top-1 -translate-x-[9px] w-4 h-4 rounded-full bg-indigo-600"></div>
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="text-sm text-slate-600">{job.department}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {job.start_date && format(parseISO(job.start_date), "MMM yyyy")} - {job.end_date ? format(parseISO(job.end_date), "MMM yyyy") : "Present"}
                      </p>
                      {job.notes && (
                        <p className="text-sm text-slate-600 mt-2 italic">{job.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Reviews Summary */}
          {performanceReviews.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-400" />
                  <CardTitle className="text-base">Recent Performance Review</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const completedReviews = performanceReviews.filter(r => r.status === "completed");
                  const latestReview = completedReviews.sort((a, b) => 
                    new Date(b.completed_date) - new Date(a.completed_date)
                  )[0];
                  
                  if (!latestReview) {
                    return <p className="text-sm text-slate-500">No completed reviews</p>;
                  }
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">{latestReview.review_period}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-indigo-600">{latestReview.overall_rating}</span>
                          <span className="text-sm text-slate-500">/5</span>
                        </div>
                      </div>
                      {latestReview.manager_review?.strengths && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase">Strengths</p>
                          <p className="text-sm text-slate-700 mt-1">{latestReview.manager_review.strengths}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4 mt-6">
          <SkillMatrixDisplay
            employeeSkills={employeeSkills}
            onEdit={() => setIsSkillEditorOpen(true)}
            canEdit={true}
          />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4 mt-6">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pending Tasks</CardTitle>
                <Badge className="bg-amber-100 text-amber-700">{pendingTasks.length} pending</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pendingTasks.length > 0 ? (
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <StatusBadge status={task.priority || task.status} />
                          {task.due_date && (
                            <span className={`text-xs flex items-center gap-1 ${
                              isPast(parseISO(task.due_date)) ? "text-red-600" : "text-slate-500"
                            }`}>
                              <Clock className="w-3 h-3" />
                              Due {format(parseISO(task.due_date), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No pending tasks</p>
                </div>
              )}
            </CardContent>
          </Card>

          {completedTasks.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Completed Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {completedTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <p className="font-medium text-slate-900">{task.title}</p>
                      </div>
                      {task.completed_date && (
                        <span className="text-xs text-slate-500">
                          {format(parseISO(task.completed_date), "MMM d")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Time Off Tab */}
        <TabsContent value="timeoff" className="space-y-4 mt-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Time Off Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {timeOffRequests.length > 0 ? (
                <div className="space-y-3">
                  {timeOffRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900 capitalize">
                          {request.type?.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {request.start_date && format(parseISO(request.start_date), "MMM d, yyyy")} - {request.end_date && format(parseISO(request.end_date), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {request.days_requested} {request.days_requested === 1 ? "day" : "days"}
                        </p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No time off requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4 mt-6">
          {manager && (
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <CardTitle className="text-base">Reports To</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={manager.avatar_url} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700">
                      {manager.full_name?.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-900">{manager.full_name}</p>
                    <p className="text-sm text-slate-600">{manager.job_title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {directReports.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <CardTitle className="text-base">Direct Reports ({directReports.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {directReports.map((report) => (
                    <div key={report.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={report.avatar_url} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700">
                          {report.full_name?.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{report.full_name}</p>
                        <p className="text-sm text-slate-600">{report.job_title}</p>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!manager && directReports.length === 0 && (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No reporting structure defined</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4 mt-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Assigned IT Assets</CardTitle>
            </CardHeader>
            <CardContent>
              {assetAssignments.length > 0 ? (
                <div className="space-y-3">
                  {assetAssignments.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{asset.name}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          {asset.type?.replace(/_/g, " ")} • {asset.manufacturer} {asset.model}
                        </p>
                        {asset.serial_number && (
                          <p className="text-xs text-slate-500 mt-1">SN: {asset.serial_number}</p>
                        )}
                      </div>
                      <StatusBadge status={asset.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No assets assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isSkillEditorOpen} onOpenChange={setIsSkillEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Skill Matrix - {employee.full_name}</DialogTitle>
          </DialogHeader>
          {user && (
            <SkillMatrixEditor
              employee={employee}
              currentUser={user}
              onSave={() => setIsSkillEditorOpen(false)}
              onCancel={() => setIsSkillEditorOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}