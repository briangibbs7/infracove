import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Award } from "lucide-react";
import { format, parseISO } from "date-fns";

const RECOGNITION_CONFIG = {
  kudos: { emoji: "👏", color: "bg-blue-100 text-blue-700" },
  achievement: { emoji: "🏆", color: "bg-amber-100 text-amber-700" },
  skill_milestone: { emoji: "🎯", color: "bg-purple-100 text-purple-700" },
  training_completion: { emoji: "📚", color: "bg-green-100 text-green-700" },
  project_success: { emoji: "🚀", color: "bg-indigo-100 text-indigo-700" },
  peer_recognition: { emoji: "🤝", color: "bg-pink-100 text-pink-700" },
  leadership: { emoji: "⭐", color: "bg-orange-100 text-orange-700" }
};

export default function RecognitionFeed({ recognitions, currentUser, employees = [] }) {
  const queryClient = useQueryClient();

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ recognitionId, likes }) => {
      const hasLiked = likes.includes(currentUser.id);
      const newLikes = hasLiked
        ? likes.filter(id => id !== currentUser.id)
        : [...likes, currentUser.id];
      
      return base44.entities.Recognition.update(recognitionId, { likes: newLikes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognitions"] });
    },
  });

  if (recognitions.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-12 text-center">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">No recognitions yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recognitions.map((recognition) => {
        const config = RECOGNITION_CONFIG[recognition.type] || RECOGNITION_CONFIG.kudos;
        const giver = employees.find(e => e.id === recognition.giver_id);
        const recipient = employees.find(e => e.id === recognition.recipient_id);
        const hasLiked = recognition.likes?.includes(currentUser?.id);

        return (
          <Card key={recognition.id} className="border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={giver?.avatar_url} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700">
                        {giver?.full_name?.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm border-2 border-white">
                      {config.emoji}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">{giver?.full_name}</span>
                        {" recognized "}
                        <span className="font-semibold text-slate-900">{recipient?.full_name}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(parseISO(recognition.created_date), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <Badge className={config.color}>
                      +{recognition.points_awarded} pts
                    </Badge>
                  </div>

                  <h4 className="font-semibold text-slate-900 mb-2">{recognition.title}</h4>
                  <p className="text-slate-700 mb-3">{recognition.message}</p>

                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <Badge variant="outline" className="capitalize">
                      {recognition.type.replace(/_/g, " ")}
                    </Badge>
                    {recognition.related_skill_name && (
                      <Badge className="bg-purple-100 text-purple-700">
                        🎯 {recognition.related_skill_name}
                      </Badge>
                    )}
                    {recognition.related_training_name && (
                      <Badge className="bg-green-100 text-green-700">
                        📚 {recognition.related_training_name}
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLikeMutation.mutate({
                      recognitionId: recognition.id,
                      likes: recognition.likes || []
                    })}
                    className={hasLiked ? "text-red-600" : "text-slate-600"}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${hasLiked ? "fill-red-600" : ""}`} />
                    {recognition.likes?.length || 0}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}