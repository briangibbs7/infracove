import React, { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/ui/StatusBadge";
import { Plus, Star, TrendingUp, Award, CheckCircle, Users, Trophy } from "lucide-react";
import { format } from "date-fns";
import { BadgeCard, ProgressLevel } from "@/components/gamification/BadgeDisplay";
import Leaderboard from "@/components/gamification/Leaderboard";

export default function SkillsSection({ currentEmployee, isAdmin }) {
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const queryClient = useQueryClient();

  const { data: skills = [] } = useQuery({
    queryKey: ["skills", currentEmployee?.id],
    queryFn: () => base44.entities.SkillEndorsement.filter({ employee_id: currentEmployee?.id }),
    enabled: !!currentEmployee,
  });

  const { data: developmentRequests = [] } = useQuery({
    queryKey: ["developmentRequests", currentEmployee?.id],
    queryFn: () => base44.entities.SkillDevelopmentRequest.filter({ employee_id: currentEmployee?.id }),
    enabled: !!currentEmployee,
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ["allDevelopmentRequests"],
    queryFn: () => base44.entities.SkillDevelopmentRequest.list("-created_date"),
    enabled: isAdmin,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements", currentEmployee?.id],
    queryFn: () => base44.entities.Achievement.filter({ employee_id: currentEmployee?.id }),
    enabled: !!currentEmployee,
  });

  const { data: allAchievements = [] } = useQuery({
    queryKey: ["allAchievements"],
    queryFn: () => base44.entities.Achievement.list(),
  });

  const { data: allSkills = [] } = useQuery({
    queryKey: ["allSkills"],
    queryFn: () => base44.entities.SkillEndorsement.list(),
  });

  const { data: allTrainingAssignments = [] } = useQuery({
    queryKey: ["allTrainingAssignments"],
    queryFn: () => base44.entities.TrainingAssignment.list(),
  });

  const createSkillMutation = useMutation({
    mutationFn: (data) => base44.entities.SkillEndorsement.create(data),
    onSuccess: async (newSkill) => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      setIsSkillDialogOpen(false);
      
      // Check for badges
      const empSkills = await base44.entities.SkillEndorsement.filter({ employee_id: currentEmployee?.id });
      if (empSkills.length === 1) {
        checkAndAwardBadge("first_skill", "First Skill", "Added your first skill", 10);
      } else if (empSkills.length >= 5) {
        checkAndAwardBadge("skill_master", "Skill Master", "Added 5+ skills", 50);
      }
      if (newSkill.self_rating === 5) {
        checkAndAwardBadge("expert_level", "Expert Level", "Achieved expert rating", 75);
      }
    },
  });

  const updateSkillMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SkillEndorsement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.SkillDevelopmentRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developmentRequests"] });
      setIsRequestDialogOpen(false);
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SkillDevelopmentRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developmentRequests", "allDevelopmentRequests"] });
    },
  });

  const handleAddSkill = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    createSkillMutation.mutate({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.full_name,
      skill_name: formData.get("skill_name"),
      category: formData.get("category"),
      self_rating: parseInt(formData.get("self_rating")),
      years_experience: parseFloat(formData.get("years_experience")) || 0,
      notes: formData.get("notes"),
    });
  };

  const handleEndorseSkill = (skill, rating, comment) => {
    const newEndorsement = {
      endorser_id: currentEmployee.id,
      endorser_name: currentEmployee.full_name,
      rating: rating,
      endorsed_date: new Date().toISOString().split('T')[0],
      comment: comment,
    };

    updateSkillMutation.mutate({
      id: skill.id,
      data: {
        endorsed_by: [...(skill.endorsed_by || []), newEndorsement],
      },
    });
  };

  const handleRequestTraining = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    createRequestMutation.mutate({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.full_name,
      skill_name: formData.get("skill_name"),
      current_level: parseInt(formData.get("current_level")),
      target_level: parseInt(formData.get("target_level")),
      reason: formData.get("reason"),
      preferred_training_type: formData.get("preferred_training_type"),
      status: "pending",
    });
  };

  const categoryColors = {
    technical: "bg-blue-100 text-blue-700 border-blue-200",
    leadership: "bg-purple-100 text-purple-700 border-purple-200",
    communication: "bg-green-100 text-green-700 border-green-200",
    problem_solving: "bg-amber-100 text-amber-700 border-amber-200",
    project_management: "bg-indigo-100 text-indigo-700 border-indigo-200",
    language: "bg-pink-100 text-pink-700 border-pink-200",
    other: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const createAchievementMutation = useMutation({
    mutationFn: (data) => base44.entities.Achievement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });

  const checkAndAwardBadge = async (badgeType, badgeName, description, points) => {
    const existing = achievements.find(a => a.badge_type === badgeType);
    if (!existing) {
      createAchievementMutation.mutate({
        employee_id: currentEmployee.id,
        employee_name: currentEmployee.full_name,
        badge_type: badgeType,
        badge_name: badgeName,
        badge_description: description,
        points_earned: points,
        earned_date: new Date().toISOString().split('T')[0],
      });
    }
  };

  const totalPoints = achievements.reduce((sum, a) => sum + (a.points_earned || 0), 0);

  const averageRating = (skill) => {
    if (!skill.endorsed_by || skill.endorsed_by.length === 0) return skill.self_rating;
    const totalRating = skill.endorsed_by.reduce((sum, e) => sum + e.rating, skill.self_rating);
    return (totalRating / (skill.endorsed_by.length + 1)).toFixed(1);
  };

  // Leaderboard data
  const employeePoints = allAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.employee_id]) {
      acc[achievement.employee_id] = {
        employee_id: achievement.employee_id,
        employee_name: achievement.employee_name,
        points: 0,
      };
    }
    acc[achievement.employee_id].points += achievement.points_earned || 0;
    return acc;
  }, {});

  const skillsLeaderboard = Object.entries(
    allSkills.reduce((acc, skill) => {
      if (!acc[skill.employee_id]) {
        acc[skill.employee_id] = {
          employee_id: skill.employee_id,
          employee_name: skill.employee_name,
          skillCount: 0,
        };
      }
      acc[skill.employee_id].skillCount++;
      return acc;
    }, {})
  ).map(([id, data]) => data);

  const trainingLeaderboard = Object.entries(
    allTrainingAssignments
      .filter(a => a.status === "completed")
      .reduce((acc, assignment) => {
        if (!acc[assignment.employee_id]) {
          acc[assignment.employee_id] = {
            employee_id: assignment.employee_id,
            employee_name: assignment.employee_name,
            completedTraining: 0,
          };
        }
        acc[assignment.employee_id].completedTraining++;
        return acc;
      }, {})
  ).map(([id, data]) => data);

  return (
    <div className="space-y-6">
      {/* Progress Level */}
      <ProgressLevel points={totalPoints} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
            <p className="text-2xl font-bold text-slate-900">{skills.length}</p>
            <p className="text-xs text-slate-500">Total Skills</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
            <p className="text-2xl font-bold text-slate-900">
              {skills.filter(s => s.endorsed_by?.length > 0).length}
            </p>
            <p className="text-xs text-slate-500">Endorsed Skills</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-amber-600" />
            <p className="text-2xl font-bold text-slate-900">
              {developmentRequests.filter(r => r.status === "in_progress").length}
            </p>
            <p className="text-xs text-slate-500">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-slate-900">
              {skills.length > 0 ? (skills.reduce((sum, s) => sum + parseFloat(averageRating(s)), 0) / skills.length).toFixed(1) : "N/A"}
            </p>
            <p className="text-xs text-slate-500">Avg Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* My Skills */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Skills</CardTitle>
            <Button onClick={() => setIsSkillDialogOpen(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Skill
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {skills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((skill) => (
                <div key={skill.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{skill.skill_name}</h4>
                      <Badge variant="outline" className={`mt-1 text-xs ${categoryColors[skill.category]}`}>
                        {skill.category.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-semibold text-slate-900">{averageRating(skill)}</span>
                      <span className="text-xs text-slate-500">/5</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Self-rated: {skill.self_rating}/5</span>
                      {skill.years_experience > 0 && (
                        <span className="text-slate-500">{skill.years_experience} yrs exp</span>
                      )}
                    </div>
                    <Progress value={(parseFloat(averageRating(skill)) / 5) * 100} className="h-2" />
                  </div>

                  {skill.endorsed_by && skill.endorsed_by.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Users className="w-3 h-3" />
                        <span>Endorsed by {skill.endorsed_by.length} {skill.endorsed_by.length === 1 ? "person" : "people"}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No skills added yet</p>
              <Button onClick={() => setIsSkillDialogOpen(true)} variant="outline" className="mt-3">
                Add Your First Skill
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Development Requests */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Skill Development Requests</CardTitle>
            <Button onClick={() => setIsRequestDialogOpen(true)} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Request Training
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {developmentRequests.length > 0 ? (
            <div className="space-y-3">
              {developmentRequests.map((request) => (
                <div key={request.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900">{request.skill_name}</h4>
                        <StatusBadge status={request.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                        <span>Current: Level {request.current_level}</span>
                        <span>→</span>
                        <span>Target: Level {request.target_level}</span>
                      </div>
                      <p className="text-sm text-slate-500 capitalize">{request.preferred_training_type?.replace(/_/g, " ")}</p>
                      {request.reason && (
                        <p className="text-xs text-slate-500 mt-2 italic">"{request.reason}"</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No development requests</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Section - All Requests */}
      {isAdmin && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>All Development Requests (Admin)</CardTitle>
          </CardHeader>
          <CardContent>
            {allRequests.length > 0 ? (
              <div className="space-y-3">
                {allRequests.slice(0, 10).map((request) => (
                  <div key={request.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-slate-900">{request.employee_name}</h4>
                          <span className="text-sm text-slate-500">• {request.skill_name}</span>
                          <StatusBadge status={request.status} />
                        </div>
                        <p className="text-xs text-slate-600">
                          Level {request.current_level} → {request.target_level}
                        </p>
                      </div>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600"
                            onClick={() => updateRequestMutation.mutate({
                              id: request.id,
                              data: {
                                status: "approved",
                                approved_by: currentEmployee.id,
                                approved_by_name: currentEmployee.full_name,
                                approved_date: new Date().toISOString().split('T')[0],
                              }
                            })}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => updateRequestMutation.mutate({
                              id: request.id,
                              data: { status: "rejected" }
                            })}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-slate-400">No requests</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Skill Dialog */}
      <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSkill} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill_name">Skill Name *</Label>
              <Input id="skill_name" name="skill_name" placeholder="e.g., JavaScript, Leadership" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="problem_solving">Problem Solving</SelectItem>
                    <SelectItem value="project_management">Project Management</SelectItem>
                    <SelectItem value="language">Language</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="self_rating">Self Rating (1-5) *</Label>
                <Select name="self_rating" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Rate yourself" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Beginner</SelectItem>
                    <SelectItem value="2">2 - Novice</SelectItem>
                    <SelectItem value="3">3 - Intermediate</SelectItem>
                    <SelectItem value="4">4 - Advanced</SelectItem>
                    <SelectItem value="5">5 - Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input id="years_experience" name="years_experience" type="number" step="0.5" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} placeholder="Any additional details..." />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsSkillDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Add Skill
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Request Training Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Skill Development</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRequestTraining} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill_name">Skill to Develop *</Label>
              <Input id="skill_name" name="skill_name" placeholder="e.g., Python, Public Speaking" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_level">Current Level *</Label>
                <Select name="current_level" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Beginner</SelectItem>
                    <SelectItem value="2">2 - Novice</SelectItem>
                    <SelectItem value="3">3 - Intermediate</SelectItem>
                    <SelectItem value="4">4 - Advanced</SelectItem>
                    <SelectItem value="5">5 - Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_level">Target Level *</Label>
                <Select name="target_level" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 - Novice</SelectItem>
                    <SelectItem value="3">3 - Intermediate</SelectItem>
                    <SelectItem value="4">4 - Advanced</SelectItem>
                    <SelectItem value="5">5 - Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_training_type">Preferred Training Type *</Label>
              <Select name="preferred_training_type" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online_course">Online Course</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="mentorship">Mentorship</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="on_the_job">On-the-job Training</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Development</Label>
              <Textarea id="reason" name="reason" rows={3} placeholder="Why is this important for your role?" />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}