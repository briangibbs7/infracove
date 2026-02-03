import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Star } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function PerformanceReviewSummary({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-8 text-center">
          <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No performance reviews yet</p>
        </CardContent>
      </Card>
    );
  }

  const completedReviews = reviews.filter(r => r.status === "completed");
  const avgRating = completedReviews.length > 0
    ? (completedReviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / completedReviews.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-4">
      {avgRating > 0 && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-900">Average Rating</span>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="text-2xl font-bold text-indigo-900">{avgRating}</span>
                <span className="text-slate-600">/ 5.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {completedReviews.map((review) => (
        <Card key={review.id} className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {review.review_period}
              </CardTitle>
              <Badge variant="outline" className="text-xs capitalize">
                {review.review_type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {review.overall_rating && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Overall Rating:</span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.overall_rating
                          ? "text-amber-500 fill-amber-500"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{review.overall_rating}/5</span>
              </div>
            )}

            {review.manager_review?.strengths && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Strengths</p>
                <p className="text-sm text-slate-900">{review.manager_review.strengths}</p>
              </div>
            )}

            {review.manager_review?.areas_for_improvement && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Areas for Improvement</p>
                <p className="text-sm text-slate-900">{review.manager_review.areas_for_improvement}</p>
              </div>
            )}

            {review.completed_date && (
              <p className="text-xs text-slate-400">
                Completed: {format(parseISO(review.completed_date), "MMM d, yyyy")}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}