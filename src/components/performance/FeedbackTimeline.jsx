import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, MessageSquare, Clock, Target, Award, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

export default function FeedbackTimeline({ feedback = [], currentUser, filter = "all" }) {
  const queryClient = useQueryClient();
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState("");

  const respondToRequestMutation = useMutation({
    mutationFn: ({ id, feedback_text }) =>
      base44.entities.ContinuousFeedback.update(id, {
        feedback_text,
        status: "provided",
        provided_date: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["continuous-feedback"] });
      setRespondingTo(null);
      setResponseText("");
    },
  });

  const acknowledgeFeedbackMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.ContinuousFeedback.update(id, { status: "acknowledged" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["continuous-feedback"] });
    },
  });

  const filteredFeedback = feedback
    .filter(f => {
      if (filter === "received") return f.recipient_id === currentUser.id;
      if (filter === "given") return f.giver_id === currentUser.id;
      if (filter === "requests") return f.type === "request" && f.status === "pending";
      return true;
    })
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const getTypeIcon = (type, status) => {
    if (type === "request") {
      return status === "pending" ? (
        <Clock className="w-5 h-5 text-blue-600" />
      ) : (
        <CheckCircle className="w-5 h-5 text-green-600" />
      );
    }
    return type === "positive" ? (
      <ThumbsUp className="w-5 h-5 text-green-600" />
    ) : (
      <MessageSquare className="w-5 h-5 text-amber-600" />
    );
  };

  const getTypeBadge = (type, status) => {
    if (type === "request") {
      return (
        <Badge variant={status === "pending" ? "outline" : "secondary"}>
          {status === "pending" ? "Pending Request" : "Request Fulfilled"}
        </Badge>
      );
    }
    return (
      <Badge variant={type === "positive" ? "default" : "secondary"} className={type === "positive" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
        {type === "positive" ? "Positive" : "Constructive"}
      </Badge>
    );
  };

  const handleRespond = (feedbackId) => {
    if (responseText.trim()) {
      respondToRequestMutation.mutate({ id: feedbackId, feedback_text: responseText });
    }
  };

  if (filteredFeedback.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No feedback to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredFeedback.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                {getTypeIcon(item.type, item.status)}
              </div>

              <div className="flex-1 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {item.is_anonymous ? "?" : (item.giver_name?.charAt(0) || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {item.is_anonymous ? "Anonymous" : item.giver_name}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {item.type === "request" ? "requested feedback from" : "→"}
                        </span>
                        <span className="font-medium">{item.recipient_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.created_date), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  {getTypeBadge(item.type, item.status)}
                </div>

                {/* Feedback Content */}
                {item.feedback_text && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{item.feedback_text}</p>
                  </div>
                )}

                {/* Tags and Relations */}
                <div className="flex flex-wrap gap-2">
                  {item.related_goal_title && (
                    <Badge variant="outline" className="gap-1">
                      <Target className="w-3 h-3" />
                      {item.related_goal_title}
                    </Badge>
                  )}
                  {item.related_skill_name && (
                    <Badge variant="outline" className="gap-1">
                      <Award className="w-3 h-3" />
                      {item.related_skill_name}
                    </Badge>
                  )}
                  {item.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                {item.type === "request" && item.status === "pending" && item.giver_id === currentUser.id && (
                  <div className="space-y-2 pt-2">
                    {respondingTo === item.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Provide your feedback..."
                          className="h-24"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRespond(item.id)}
                            disabled={!responseText.trim() || respondToRequestMutation.isPending}
                          >
                            {respondToRequestMutation.isPending ? "Sending..." : "Send Feedback"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseText("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => setRespondingTo(item.id)}>
                        Respond to Request
                      </Button>
                    )}
                  </div>
                )}

                {item.type !== "request" && item.recipient_id === currentUser.id && item.status !== "acknowledged" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeFeedbackMutation.mutate(item.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}