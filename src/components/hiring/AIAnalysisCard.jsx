import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, TrendingUp, Award } from "lucide-react";

export default function AIAnalysisCard({ analysis }) {
  if (!analysis) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center text-slate-500">
          <p className="text-sm">No AI analysis available</p>
          <p className="text-xs mt-1">Upload a resume to trigger analysis</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    return "Needs Review";
  };

  return (
    <div className="space-y-4">
      {/* Match Score */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">AI Match Score</p>
              <p className={`text-4xl font-bold ${getScoreColor(analysis.match_score)}`}>
                {analysis.match_score}%
              </p>
              <p className="text-sm text-slate-600 mt-1">{getScoreLabel(analysis.match_score)}</p>
            </div>
            <TrendingUp className={`w-16 h-16 ${getScoreColor(analysis.match_score)} opacity-20`} />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {analysis.summary && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">AI Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">{analysis.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Red Flags */}
      {analysis.red_flags && analysis.red_flags.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Areas of Concern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.red_flags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{flag}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Extracted Skills */}
      {analysis.extracted_skills && analysis.extracted_skills.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              Extracted Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.extracted_skills.map((skill, idx) => (
                <Badge key={idx} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {analysis.extracted_experience && analysis.extracted_experience.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Work Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.extracted_experience.map((exp, idx) => (
                <div key={idx} className="border-l-2 border-slate-200 pl-3">
                  <p className="font-medium text-sm text-slate-900">{exp.title}</p>
                  <p className="text-sm text-slate-600">{exp.company}</p>
                  <p className="text-xs text-slate-500">{exp.duration}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {analysis.education && analysis.education.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Education</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.education.map((edu, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium text-slate-900">{edu.degree}</p>
                  <p className="text-slate-600">{edu.institution} • {edu.year}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}