import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Mail, Phone, FileText, Star, Sparkles } from "lucide-react";

export default function CandidateCard({ candidate, onView, onMove, stages, isSelected, onToggleSelect }) {
  const currentStageIndex = stages.findIndex(s => s.id === candidate.status);
  const nextStage = stages[currentStageIndex + 1];
  const prevStage = stages[currentStageIndex - 1];

  return (
    <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group ${isSelected ? "ring-2 ring-indigo-500" : ""}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(candidate.id)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />
          <div className="flex-1" onClick={() => onView(candidate)}>
            <p className="font-semibold text-sm text-slate-900">{candidate.first_name} {candidate.last_name}</p>
            <p className="text-xs text-slate-500 truncate">{candidate.job_title}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(candidate)}>
                <FileText className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {nextStage && (
                <DropdownMenuItem onClick={() => onMove(candidate, nextStage.id)}>
                  Move to {nextStage.label}
                </DropdownMenuItem>
              )}
              {prevStage && (
                <DropdownMenuItem onClick={() => onMove(candidate, prevStage.id)}>
                  Move to {prevStage.label}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onMove(candidate, "rejected")} className="text-red-600">
                Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mb-2">
          {candidate.overall_rating && (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < candidate.overall_rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                />
              ))}
            </div>
          )}
          {candidate.ai_analysis?.match_score && (
            <Badge className={`text-xs ${
              candidate.ai_analysis.match_score >= 80 ? "bg-green-100 text-green-700" :
              candidate.ai_analysis.match_score >= 60 ? "bg-amber-100 text-amber-700" :
              "bg-red-100 text-red-700"
            }`}>
              <Sparkles className="w-2 h-2 mr-1" />
              {candidate.ai_analysis.match_score}%
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          {candidate.email && (
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Mail className="w-3 h-3" />
              <span className="truncate">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Phone className="w-3 h-3" />
              <span>{candidate.phone}</span>
            </div>
          )}
        </div>

        {candidate.skills && candidate.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {candidate.skills.slice(0, 2).map((skill, idx) => (
              <Badge key={idx} variant="outline" className="text-xs py-0">
                {skill}
              </Badge>
            ))}
            {candidate.skills.length > 2 && (
              <Badge variant="outline" className="text-xs py-0">
                +{candidate.skills.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}