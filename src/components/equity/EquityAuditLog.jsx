import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, Edit, Plus, Trash, Eye } from "lucide-react";
import { format } from "date-fns";

export default function EquityAuditLog({ entityType, entityId, limit = 50 }) {
  const { data: activities = [] } = useQuery({
    queryKey: ["activities", entityType, entityId],
    queryFn: async () => {
      let query = { entity_type: entityType };
      if (entityId) {
        query.entity_id = entityId;
      }
      return base44.entities.Activity.filter(query, "-created_date", limit);
    },
  });

  const getActionIcon = (action) => {
    switch (action) {
      case "created":
        return <Plus className="w-4 h-4" />;
      case "updated":
        return <Edit className="w-4 h-4" />;
      case "deleted":
        return <Trash className="w-4 h-4" />;
      case "viewed":
        return <Eye className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "created":
        return "bg-green-100 text-green-700";
      case "updated":
        return "bg-blue-100 text-blue-700";
      case "deleted":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Audit Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className={`p-2 rounded-full ${getActionColor(activity.action)} h-fit`}>
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {activity.description || `${activity.action} ${activity.entity_type}`}
                        </p>
                        {activity.entity_name && (
                          <p className="text-xs text-slate-600">{activity.entity_name}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {activity.action}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {activity.user_name || activity.created_by}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(activity.created_date), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                    {activity.changes && (
                      <div className="mt-2 p-2 bg-white rounded text-xs">
                        <p className="text-slate-600 font-medium mb-1">Changes:</p>
                        <pre className="text-slate-700 whitespace-pre-wrap">
                          {JSON.stringify(activity.changes, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No activity recorded yet</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}