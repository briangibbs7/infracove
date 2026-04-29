import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, X, Sparkles } from "lucide-react";

const STEPS = [
  { key: "photo", label: "Add a profile photo", check: (e) => !!e?.profile_photo },
  { key: "bio", label: "Write a bio", check: (e) => !!e?.bio },
  { key: "phone", label: "Add your phone number", check: (e) => !!e?.phone },
  { key: "skills", label: "Add at least 3 skills", check: (e) => (e?.skills?.length || 0) >= 3 },
  { key: "interests", label: "Add interests/hobbies", check: (e) => (e?.interests?.length || 0) > 0 },
];

export default function GettingStartedBanner({ employee, onEditProfile }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const completed = STEPS.filter(s => s.check(employee));
  const remaining = STEPS.filter(s => !s.check(employee));

  if (remaining.length === 0) return null;

  const pct = Math.round((completed.length / STEPS.length) * 100);

  return (
    <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-indigo-900">Complete your profile — {pct}% done</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
              {STEPS.map(step => {
                const done = step.check(employee);
                return (
                  <div key={step.key} className="flex items-center gap-2 text-sm">
                    {done
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      : <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
                    <span className={done ? "text-slate-400 line-through" : "text-slate-700"}>{step.label}</span>
                  </div>
                );
              })}
            </div>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={onEditProfile}>
              Complete Profile
            </Button>
          </div>
          <button onClick={() => setDismissed(true)} className="text-slate-400 hover:text-slate-600 transition-colors mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 w-full bg-indigo-100 rounded-full h-1.5">
          <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}