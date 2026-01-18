import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Star, 
  Trophy, 
  Zap, 
  Target, 
  Users, 
  TrendingUp,
  BookOpen 
} from "lucide-react";

const BADGE_CONFIG = {
  first_skill: {
    name: "First Skill",
    description: "Added your first skill",
    icon: Award,
    color: "bg-blue-100 text-blue-700 border-blue-300",
    iconColor: "text-blue-600",
    points: 10,
  },
  skill_master: {
    name: "Skill Master",
    description: "Added 5+ skills to your profile",
    icon: Star,
    color: "bg-amber-100 text-amber-700 border-amber-300",
    iconColor: "text-amber-600",
    points: 50,
  },
  training_starter: {
    name: "Training Starter",
    description: "Started your first training course",
    icon: BookOpen,
    color: "bg-green-100 text-green-700 border-green-300",
    iconColor: "text-green-600",
    points: 20,
  },
  training_champion: {
    name: "Training Champion",
    description: "Completed 5+ training courses",
    icon: Trophy,
    color: "bg-purple-100 text-purple-700 border-purple-300",
    iconColor: "text-purple-600",
    points: 100,
  },
  quick_learner: {
    name: "Quick Learner",
    description: "Completed a course ahead of deadline",
    icon: Zap,
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    iconColor: "text-yellow-600",
    points: 30,
  },
  expert_level: {
    name: "Expert Level",
    description: "Achieved expert rating (5/5) on a skill",
    icon: Target,
    color: "bg-red-100 text-red-700 border-red-300",
    iconColor: "text-red-600",
    points: 75,
  },
  team_mentor: {
    name: "Team Mentor",
    description: "Endorsed 10+ skills for colleagues",
    icon: Users,
    color: "bg-indigo-100 text-indigo-700 border-indigo-300",
    iconColor: "text-indigo-600",
    points: 60,
  },
  continuous_learner: {
    name: "Continuous Learner",
    description: "3+ active training assignments",
    icon: TrendingUp,
    color: "bg-teal-100 text-teal-700 border-teal-300",
    iconColor: "text-teal-600",
    points: 40,
  },
};

export function BadgeCard({ badgeType, earned = false, earnedDate = null, compact = false }) {
  const config = BADGE_CONFIG[badgeType];
  if (!config) return null;

  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`relative p-2 rounded-lg border ${earned ? config.color : "bg-slate-100 text-slate-400 border-slate-200"}`}>
        <Icon className={`w-6 h-6 ${earned ? config.iconColor : "text-slate-400"}`} />
        {!earned && (
          <div className="absolute inset-0 bg-slate-200/50 backdrop-blur-[1px] rounded-lg" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative p-4 rounded-lg border transition-all ${
      earned 
        ? `${config.color} shadow-sm hover:shadow-md` 
        : "bg-slate-50 text-slate-400 border-slate-200"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${earned ? "bg-white/50" : "bg-slate-200"}`}>
          <Icon className={`w-6 h-6 ${earned ? config.iconColor : "text-slate-400"}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{config.name}</h4>
          <p className="text-xs mb-2">{config.description}</p>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {config.points} pts
            </Badge>
            {earned && earnedDate && (
              <span className="text-xs opacity-70">
                {new Date(earnedDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
      {!earned && (
        <div className="absolute inset-0 bg-slate-200/30 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
          <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-1 rounded">Locked</span>
        </div>
      )}
    </div>
  );
}

export function ProgressLevel({ points }) {
  const level = Math.floor(points / 100) + 1;
  const pointsInLevel = points % 100;
  const nextLevelPoints = 100;

  return (
    <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm opacity-90">Your Level</p>
          <p className="text-3xl font-bold">Level {level}</p>
        </div>
        <Trophy className="w-12 h-12 opacity-80" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span>{pointsInLevel} / {nextLevelPoints} pts</span>
          <span>{Math.round((pointsInLevel / nextLevelPoints) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${(pointsInLevel / nextLevelPoints) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export { BADGE_CONFIG };