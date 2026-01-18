import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Award,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function CareerPathCard({ 
  careerPath, 
  currentSkills = [], 
  onSelectPath,
  showMatch = false,
  compact = false 
}) {
  const levelColors = {
    entry: "bg-blue-100 text-blue-700 border-blue-300",
    intermediate: "bg-green-100 text-green-700 border-green-300",
    senior: "bg-purple-100 text-purple-700 border-purple-300",
    lead: "bg-indigo-100 text-indigo-700 border-indigo-300",
    manager: "bg-amber-100 text-amber-700 border-amber-300",
    director: "bg-red-100 text-red-700 border-red-300",
    executive: "bg-slate-900 text-white border-slate-900",
  };

  // Calculate skill match
  const calculateMatch = () => {
    if (!showMatch || !careerPath.required_skills || careerPath.required_skills.length === 0) {
      return 0;
    }

    let matchedSkills = 0;
    careerPath.required_skills.forEach(required => {
      const currentSkill = currentSkills.find(s => 
        s.skill_name.toLowerCase() === required.skill_name.toLowerCase()
      );
      if (currentSkill && currentSkill.self_rating >= required.minimum_rating) {
        matchedSkills++;
      }
    });

    return Math.round((matchedSkills / careerPath.required_skills.length) * 100);
  };

  const matchPercentage = calculateMatch();

  if (compact) {
    return (
      <div className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
           onClick={onSelectPath}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900">{careerPath.role_name}</h4>
            <p className="text-xs text-slate-500">{careerPath.department}</p>
          </div>
          <Badge variant="outline" className={levelColors[careerPath.level]}>
            {careerPath.level}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {careerPath.role_name}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={levelColors[careerPath.level]}>
                  {careerPath.level}
                </Badge>
                <Badge variant="outline">{careerPath.department}</Badge>
              </div>
            </div>
          </div>

          {/* Description */}
          {careerPath.description && (
            <p className="text-sm text-slate-600">{careerPath.description}</p>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            {careerPath.typical_years_experience && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>{careerPath.typical_years_experience}+ years exp</span>
              </div>
            )}
            {careerPath.salary_range_min && careerPath.salary_range_max && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <DollarSign className="w-4 h-4" />
                <span>${careerPath.salary_range_min.toLocaleString()} - ${careerPath.salary_range_max.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Required Skills */}
          {careerPath.required_skills && careerPath.required_skills.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Award className="w-4 h-4" />
                Required Skills ({careerPath.required_skills.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {careerPath.required_skills.slice(0, 5).map((skill, idx) => {
                  const hasSkill = currentSkills.find(s => 
                    s.skill_name.toLowerCase() === skill.skill_name.toLowerCase() &&
                    s.self_rating >= skill.minimum_rating
                  );
                  return (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className={hasSkill ? "bg-green-50 text-green-700 border-green-300" : ""}
                    >
                      {hasSkill && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {skill.skill_name} (L{skill.minimum_rating})
                    </Badge>
                  );
                })}
                {careerPath.required_skills.length > 5 && (
                  <Badge variant="outline">+{careerPath.required_skills.length - 5} more</Badge>
                )}
              </div>
            </div>
          )}

          {/* Match Percentage */}
          {showMatch && careerPath.required_skills && careerPath.required_skills.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Skill Match</span>
                <span className="font-semibold text-indigo-600">{matchPercentage}%</span>
              </div>
              <Progress value={matchPercentage} className="h-2" />
            </div>
          )}

          {/* Action Button */}
          {onSelectPath && (
            <Button 
              onClick={onSelectPath}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Set as Career Goal
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}