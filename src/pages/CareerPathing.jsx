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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import CareerPathCard from "@/components/career/CareerPathCard";
import {
  TrendingUp,
  Plus,
  Target,
  Award,
  Edit,
  Trash2,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format, addMonths, addYears } from "date-fns";

const DEPARTMENTS = ["HR", "Finance", "Legal", "IT"];

export default function CareerPathing() {
  const [user, setUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isPathDialogOpen, setIsPathDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingPath, setEditingPath] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [requiredSkills, setRequiredSkills] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: careerPaths = [] } = useQuery({
    queryKey: ["careerPaths"],
    queryFn: () => base44.entities.CareerPath.filter({ status: "active" }),
  });

  const { data: careerGoals = [] } = useQuery({
    queryKey: ["careerGoals"],
    queryFn: () => base44.entities.EmployeeCareerGoal.list("-created_date"),
  });

  const { data: skills = [] } = useQuery({
    queryKey: ["skills"],
    queryFn: () => base44.entities.SkillEndorsement.list(),
  });

  const { data: trainingCourses = [] } = useQuery({
    queryKey: ["trainingCourses"],
    queryFn: () => base44.entities.TrainingCourse.list(),
  });

  useEffect(() => {
    if (user && employees.length > 0) {
      const emp = employees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
    }
  }, [user, employees]);

  const createPathMutation = useMutation({
    mutationFn: (data) => base44.entities.CareerPath.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careerPaths"] });
      setIsPathDialogOpen(false);
      setEditingPath(null);
      setRequiredSkills([]);
    },
  });

  const updatePathMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CareerPath.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careerPaths"] });
      setIsPathDialogOpen(false);
      setEditingPath(null);
      setRequiredSkills([]);
    },
  });

  const deletePathMutation = useMutation({
    mutationFn: (id) => base44.entities.CareerPath.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["careerPaths"] }),
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.EmployeeCareerGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careerGoals"] });
      setIsGoalDialogOpen(false);
      setSelectedPath(null);
    },
  });

  const handleAddSkillRequirement = () => {
    setRequiredSkills([...requiredSkills, { skill_name: "", category: "technical", minimum_rating: 3 }]);
  };

  const handleUpdateSkillRequirement = (index, field, value) => {
    const updated = [...requiredSkills];
    updated[index][field] = value;
    setRequiredSkills(updated);
  };

  const handleRemoveSkillRequirement = (index) => {
    setRequiredSkills(requiredSkills.filter((_, i) => i !== index));
  };

  const handleSubmitPath = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      role_name: formData.get("role_name"),
      department: formData.get("department"),
      level: formData.get("level"),
      description: formData.get("description"),
      typical_years_experience: parseInt(formData.get("typical_years_experience")) || 0,
      salary_range_min: parseFloat(formData.get("salary_range_min")) || 0,
      salary_range_max: parseFloat(formData.get("salary_range_max")) || 0,
      required_skills: requiredSkills.filter(s => s.skill_name),
      status: formData.get("status") || "active",
    };

    if (editingPath) {
      updatePathMutation.mutate({ id: editingPath.id, data });
    } else {
      createPathMutation.mutate(data);
    }
  };

  const handleSetGoal = (path) => {
    setSelectedPath(path);
    setIsGoalDialogOpen(true);
  };

  const handleSubmitGoal = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const mySkills = skills.filter(s => s.employee_id === currentEmployee.id);
    const skillsGap = selectedPath.required_skills?.map(required => {
      const current = mySkills.find(s => s.skill_name.toLowerCase() === required.skill_name.toLowerCase());
      return {
        skill_name: required.skill_name,
        current_level: current?.self_rating || 0,
        required_level: required.minimum_rating,
        gap: required.minimum_rating - (current?.self_rating || 0),
      };
    }) || [];

    const totalSkills = selectedPath.required_skills?.length || 1;
    const metSkills = skillsGap.filter(g => g.gap <= 0).length;
    const readiness = Math.round((metSkills / totalSkills) * 100);

    const recommendations = [];
    skillsGap.filter(g => g.gap > 0).forEach(gap => {
      recommendations.push(`Improve ${gap.skill_name} from level ${gap.current_level} to ${gap.required_level}`);
    });

    const timeline = formData.get("target_timeline");
    let targetDate = new Date();
    switch(timeline) {
      case "6_months": targetDate = addMonths(targetDate, 6); break;
      case "1_year": targetDate = addYears(targetDate, 1); break;
      case "2_years": targetDate = addYears(targetDate, 2); break;
      case "3_years": targetDate = addYears(targetDate, 3); break;
      case "5_years": targetDate = addYears(targetDate, 5); break;
    }

    createGoalMutation.mutate({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.full_name,
      target_role: selectedPath.role_name,
      career_path_id: selectedPath.id,
      target_timeline: timeline,
      motivation: formData.get("motivation"),
      current_readiness: readiness,
      skills_gap: skillsGap,
      recommended_actions: recommendations,
      status: "active",
      set_date: new Date().toISOString().split('T')[0],
      target_date: targetDate.toISOString().split('T')[0],
    });
  };

  const isAdmin = user?.role === "admin";
  const canManage = isAdmin || currentEmployee?.department === "HR";

  const myGoals = currentEmployee
    ? careerGoals.filter(g => g.employee_id === currentEmployee.id && g.status === "active")
    : [];

  const mySkills = currentEmployee
    ? skills.filter(s => s.employee_id === currentEmployee.id)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career Pathing"
        subtitle="Plan your career journey and achieve your professional goals"
        action={canManage ? () => {
          setEditingPath(null);
          setRequiredSkills([]);
          setIsPathDialogOpen(true);
        } : undefined}
        actionLabel={canManage ? "Create Career Path" : undefined}
      />

      <Tabs defaultValue={canManage ? "paths" : "my-goals"} className="w-full">
        <TabsList>
          {!canManage && <TabsTrigger value="my-goals">My Goals</TabsTrigger>}
          <TabsTrigger value="paths">Career Paths</TabsTrigger>
          {canManage && <TabsTrigger value="all-goals">Employee Goals</TabsTrigger>}
        </TabsList>

        {/* My Goals Tab */}
        {!canManage && (
          <TabsContent value="my-goals" className="space-y-6">
            {myGoals.length > 0 ? (
              <div className="space-y-4">
                {myGoals.map(goal => {
                  const path = careerPaths.find(p => p.id === goal.career_path_id);
                  return (
                    <Card key={goal.id} className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-5 h-5 text-indigo-600" />
                              <h3 className="text-xl font-semibold text-slate-900">{goal.target_role}</h3>
                              <StatusBadge status={goal.status} />
                            </div>
                            {goal.motivation && (
                              <p className="text-sm text-slate-600 mb-3 italic">"{goal.motivation}"</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span>Target: {format(new Date(goal.target_date), "MMM yyyy")}</span>
                              <span>•</span>
                              <span className="capitalize">{goal.target_timeline?.replace(/_/g, " ")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Readiness */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-medium text-slate-700">Readiness Score</span>
                            <span className="font-semibold text-indigo-600">{goal.current_readiness}%</span>
                          </div>
                          <Progress value={goal.current_readiness} className="h-3" />
                        </div>

                        {/* Skills Gap */}
                        {goal.skills_gap && goal.skills_gap.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              Skills Gap Analysis
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {goal.skills_gap.slice(0, 6).map((gap, idx) => (
                                <div key={idx} className={`p-2 rounded-lg text-xs ${
                                  gap.gap <= 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{gap.skill_name}</span>
                                    {gap.gap <= 0 ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                      <span>L{gap.current_level} → L{gap.required_level}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {goal.recommended_actions && goal.recommended_actions.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                              <Lightbulb className="w-4 h-4 text-amber-500" />
                              Recommended Actions
                            </p>
                            <ul className="space-y-1">
                              {goal.recommended_actions.slice(0, 3).map((action, idx) => (
                                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                  <span className="text-indigo-600 mt-1">•</span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="No career goals set"
                description="Explore career paths and set your first goal"
              />
            )}
          </TabsContent>
        )}

        {/* Career Paths Tab */}
        <TabsContent value="paths" className="space-y-6">
          {careerPaths.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {careerPaths.map(path => (
                <div key={path.id} className="relative">
                  <CareerPathCard
                    careerPath={path}
                    currentSkills={mySkills}
                    onSelectPath={!canManage ? () => handleSetGoal(path) : undefined}
                    showMatch={!canManage}
                  />
                  {canManage && (
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPath(path);
                          setRequiredSkills(path.required_skills || []);
                          setIsPathDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => deletePathMutation.mutate(path.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No career paths available"
              description={canManage ? "Create your first career path" : "Career paths coming soon"}
              action={canManage ? () => setIsPathDialogOpen(true) : undefined}
              actionLabel={canManage ? "Create Career Path" : undefined}
            />
          )}
        </TabsContent>

        {/* All Employee Goals (Admin) */}
        {canManage && (
          <TabsContent value="all-goals" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Employee Career Goals</CardTitle>
              </CardHeader>
              <CardContent>
                {careerGoals.length > 0 ? (
                  <div className="space-y-3">
                    {careerGoals.map(goal => (
                      <div key={goal.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-slate-900">{goal.employee_name}</p>
                              <span className="text-slate-500">→</span>
                              <p className="font-medium text-indigo-600">{goal.target_role}</p>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                              <StatusBadge status={goal.status} />
                              <span>{goal.current_readiness}% ready</span>
                              <span>Target: {format(new Date(goal.target_date), "MMM yyyy")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Target}
                    title="No employee goals"
                    description="Employees haven't set career goals yet"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Create/Edit Career Path Dialog */}
      <Dialog open={isPathDialogOpen} onOpenChange={setIsPathDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPath ? "Edit" : "Create"} Career Path</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPath} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role_name">Role Name *</Label>
                <Input
                  id="role_name"
                  name="role_name"
                  defaultValue={editingPath?.role_name}
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select name="department" defaultValue={editingPath?.department || "IT"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level *</Label>
                <Select name="level" defaultValue={editingPath?.level || "intermediate"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="director">Director</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="typical_years_experience">Years Experience</Label>
                <Input
                  id="typical_years_experience"
                  name="typical_years_experience"
                  type="number"
                  defaultValue={editingPath?.typical_years_experience}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingPath?.status || "active"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingPath?.description}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary_range_min">Salary Min</Label>
                <Input
                  id="salary_range_min"
                  name="salary_range_min"
                  type="number"
                  defaultValue={editingPath?.salary_range_min}
                  placeholder="60000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_range_max">Salary Max</Label>
                <Input
                  id="salary_range_max"
                  name="salary_range_max"
                  type="number"
                  defaultValue={editingPath?.salary_range_max}
                  placeholder="120000"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label>Required Skills</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSkillRequirement}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skill
                </Button>
              </div>
              {requiredSkills.map((skill, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                  <Input
                    placeholder="Skill name"
                    value={skill.skill_name}
                    onChange={(e) => handleUpdateSkillRequirement(index, "skill_name", e.target.value)}
                    className="col-span-5"
                  />
                  <Select
                    value={skill.category}
                    onValueChange={(value) => handleUpdateSkillRequirement(index, "category", value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="problem_solving">Problem Solving</SelectItem>
                      <SelectItem value="project_management">Project Management</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(skill.minimum_rating)}
                    onValueChange={(value) => handleUpdateSkillRequirement(index, "minimum_rating", parseInt(value))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1</SelectItem>
                      <SelectItem value="2">Level 2</SelectItem>
                      <SelectItem value="3">Level 3</SelectItem>
                      <SelectItem value="4">Level 4</SelectItem>
                      <SelectItem value="5">Level 5</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSkillRequirement(index)}
                    className="col-span-1 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPathDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingPath ? "Update" : "Create"} Path
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set Career Goal Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Career Goal: {selectedPath?.role_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitGoal} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target_timeline">Target Timeline *</Label>
              <Select name="target_timeline" required>
                <SelectTrigger>
                  <SelectValue placeholder="When do you want to achieve this?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6_months">6 Months</SelectItem>
                  <SelectItem value="1_year">1 Year</SelectItem>
                  <SelectItem value="2_years">2 Years</SelectItem>
                  <SelectItem value="3_years">3 Years</SelectItem>
                  <SelectItem value="5_years">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivation">Why this role?</Label>
              <Textarea
                id="motivation"
                name="motivation"
                rows={3}
                placeholder="What motivates you to pursue this career path?"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Set Goal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}