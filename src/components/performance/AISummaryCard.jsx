import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Target, TrendingUp, Lightbulb } from "lucide-react";

export default function AISummaryCard({ aiSummary }) {
  if (!aiSummary) return null;

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <CardTitle className="text-base">AI-Powered Analysis</CardTitle>
          <Badge className="bg-indigo-600 text-white ml-auto">Auto-Generated</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Overall Summary</h4>
          <p className="text-sm text-slate-700">{aiSummary.overall_summary}</p>
        </div>

        {aiSummary.key_strengths && aiSummary.key_strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-semibold text-slate-900">Key Strengths</h4>
            </div>
            <ul className="space-y-1">
              {aiSummary.key_strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {aiSummary.development_areas && aiSummary.development_areas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-semibold text-slate-900">Development Areas</h4>
            </div>
            <ul className="space-y-1">
              {aiSummary.development_areas.map((area, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {aiSummary.recommended_actions && aiSummary.recommended_actions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-semibold text-slate-900">Recommended Actions</h4>
            </div>
            <ul className="space-y-1">
              {aiSummary.recommended_actions.map((action, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}