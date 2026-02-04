import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Calendar, Eye, Edit2, Archive } from "lucide-react";

export default function SurveyList({ surveys, onView, onEdit, onArchive }) {
  const getSurveyIcon = (type) => {
    const icons = {
      onboarding: "👋",
      department: "🏢",
      quarterly: "📊",
      annual: "📈",
      all_hands: "🎤",
      custom: "⚙️",
    };
    return icons[type] || "📋";
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      closed: "bg-blue-100 text-blue-800",
      archived: "bg-slate-100 text-slate-800",
    };
    return colors[status] || "bg-gray-100";
  };

  const getTypeLabel = (type) => {
    const labels = {
      onboarding: "Onboarding",
      department: "Department",
      quarterly: "Quarterly",
      annual: "Annual",
      all_hands: "All Hands",
      custom: "Custom",
    };
    return labels[type] || type;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {surveys.map((survey) => (
        <Card key={survey.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 space-y-4">
            <div>
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl">{getSurveyIcon(survey.type)}</span>
                <Badge className={getStatusColor(survey.status)}>
                  {survey.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-slate-900 line-clamp-2">
                {survey.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {survey.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 py-2 border-y">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-muted-foreground">
                  {survey.questions?.length || 0} questions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-muted-foreground">
                  {survey.response_count || 0} responses
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-muted-foreground">
                  {getTypeLabel(survey.type)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {survey.completion_rate || 0}% complete
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => onView(survey)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              {survey.status === "draft" && (
                <Button
                  onClick={() => onEdit(survey)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              )}
              <Button
                onClick={() => onArchive(survey)}
                variant="ghost"
                size="sm"
              >
                <Archive className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}