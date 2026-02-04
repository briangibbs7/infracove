import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";

export default function QuickScreeningView({ candidates, onApprove, onReject, onSkip }) {
  if (candidates.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center text-slate-500">
          <p>No candidates to screen</p>
        </CardContent>
      </Card>
    );
  }

  const candidate = candidates[0];
  const analysis = candidate.ai_analysis;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {candidate.first_name} {candidate.last_name}
          </CardTitle>
          <Badge className="text-xs">
            {candidates.length} remaining
          </Badge>
        </div>
        <p className="text-sm text-slate-600 mt-1">{candidate.job_title}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* AI Score */}
        {analysis?.match_score && (
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
            <div>
              <p className="text-sm text-slate-600 mb-1">AI Match Score</p>
              <p className="text-3xl font-bold text-indigo-600">{analysis.match_score}%</p>
            </div>
            <Sparkles className="w-12 h-12 text-indigo-200" />
          </div>
        )}

        {/* Summary */}
        {analysis?.summary && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Summary</h3>
            <p className="text-sm text-slate-700">{analysis.summary}</p>
          </div>
        )}

        {/* Strengths */}
        {analysis?.strengths && analysis.strengths.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Strengths
            </h3>
            <ul className="space-y-1">
              {analysis.strengths.slice(0, 3).map((strength, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Red Flags */}
        {analysis?.red_flags && analysis.red_flags.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Concerns
            </h3>
            <ul className="space-y-1">
              {analysis.red_flags.slice(0, 3).map((flag, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact */}
        <div className="pt-4 border-t">
          <div className="text-sm space-y-1">
            <p className="text-slate-600">Email: <span className="text-slate-900">{candidate.email}</span></p>
            {candidate.phone && (
              <p className="text-slate-600">Phone: <span className="text-slate-900">{candidate.phone}</span></p>
            )}
            {candidate.years_of_experience && (
              <p className="text-slate-600">Experience: <span className="text-slate-900">{candidate.years_of_experience} years</span></p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => onReject(candidate)}
            variant="outline"
            className="flex-1 text-red-600 hover:text-red-700"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={() => onSkip(candidate)}
            variant="outline"
            className="flex-1"
          >
            Skip
          </Button>
          <Button
            onClick={() => onApprove(candidate)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}