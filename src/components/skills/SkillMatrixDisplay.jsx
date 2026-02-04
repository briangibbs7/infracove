import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, Star, TrendingUp, Edit, Target } from "lucide-react";

const PROFICIENCY_CONFIG = {
  beginner: { label: "Beginner", color: "bg-blue-100 text-blue-700", progress: 25, icon: Target },
  intermediate: { label: "Intermediate", color: "bg-green-100 text-green-700", progress: 50, icon: TrendingUp },
  advanced: { label: "Advanced", color: "bg-purple-100 text-purple-700", progress: 75, icon: Award },
  expert: { label: "Expert", color: "bg-amber-100 text-amber-700", progress: 100, icon: Star }
};

const CATEGORY_COLORS = {
  technical: "border-blue-300 bg-blue-50",
  leadership: "border-purple-300 bg-purple-50",
  communication: "border-green-300 bg-green-50",
  analytical: "border-indigo-300 bg-indigo-50",
  creative: "border-pink-300 bg-pink-50",
  operational: "border-amber-300 bg-amber-50",
  other: "border-slate-300 bg-slate-50"
};

export default function SkillMatrixDisplay({ employeeSkills, onEdit, canEdit = false }) {
  const groupedSkills = employeeSkills.reduce((acc, skill) => {
    const category = skill.skill_category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  if (employeeSkills.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-12 text-center">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">No skills added yet</p>
          {canEdit && (
            <Button onClick={onEdit} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
              Add Skills
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={onEdit} variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit Skills
          </Button>
        </div>
      )}

      {Object.entries(groupedSkills).map(([category, skills]) => (
        <Card key={category} className={`border ${CATEGORY_COLORS[category]}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base capitalize flex items-center gap-2">
              {category.replace(/_/g, " ")}
              <Badge variant="outline">{skills.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((skill) => {
                const config = PROFICIENCY_CONFIG[skill.proficiency_level];
                const Icon = config.icon;
                
                return (
                  <div key={skill.id} className="p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">{skill.skill_name}</h4>
                          {skill.is_primary && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        {skill.years_of_experience && (
                          <p className="text-xs text-slate-500 mt-1">
                            {skill.years_of_experience} {skill.years_of_experience === 1 ? 'year' : 'years'} experience
                          </p>
                        )}
                      </div>
                      <Icon className="w-5 h-5 text-slate-400" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Progress value={config.progress} className="flex-1 h-2" />
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>

                      {skill.certifications && skill.certifications.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {skill.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              <Award className="w-3 h-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {skill.notes && (
                        <p className="text-xs text-slate-600 mt-2 italic">{skill.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}