import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { Building2, DollarSign, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const PIPELINE_STAGES = [
  { id: "new", label: "New", color: "bg-blue-500" },
  { id: "contacted", label: "Contacted", color: "bg-indigo-500" },
  { id: "qualified", label: "Qualified", color: "bg-violet-500" },
  { id: "proposal", label: "Proposal", color: "bg-purple-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-amber-500" },
  { id: "won", label: "Won", color: "bg-emerald-500" },
];

export default function Pipeline() {
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId;

    updateMutation.mutate({
      id: leadId,
      data: { status: newStatus },
    });
  };

  const getLeadsByStage = (stageId) =>
    leads.filter((lead) => lead.status === stageId);

  const getStageValue = (stageId) =>
    getLeadsByStage(stageId).reduce((sum, lead) => sum + (lead.value || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-slate-500 mt-1">
            Drag and drop leads to update their status
          </p>
        </div>
        <Link to={createPageUrl("Leads")}>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            Manage Leads
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-6 gap-4">
          {PIPELINE_STAGES.map((stage) => (
            <Card key={stage.id} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map((stage) => {
              const stageLeads = getLeadsByStage(stage.id);
              const stageValue = getStageValue(stage.id);

              return (
                <div key={stage.id} className="flex-shrink-0 w-72">
                  <Card className="border-0 shadow-sm h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                          <CardTitle className="text-sm font-semibold">
                            {stage.label}
                          </CardTitle>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {stageLeads.length}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        ${stageValue.toLocaleString()}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Droppable droppableId={stage.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[400px] space-y-3 rounded-lg transition-colors ${
                              snapshot.isDraggingOver ? "bg-slate-50" : ""
                            }`}
                          >
                            {stageLeads.map((lead, index) => (
                              <Draggable
                                key={lead.id}
                                draggableId={lead.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white border border-slate-200 rounded-lg p-4 cursor-grab active:cursor-grabbing transition-shadow ${
                                      snapshot.isDragging
                                        ? "shadow-lg ring-2 ring-indigo-500"
                                        : "hover:shadow-md"
                                    }`}
                                  >
                                    <h3 className="font-medium text-slate-900 mb-2">
                                      {lead.company_name}
                                    </h3>
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <User className="w-3.5 h-3.5" />
                                        <span>{lead.contact_name}</span>
                                      </div>
                                      {lead.value && (
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                          <DollarSign className="w-3.5 h-3.5" />
                                          <span>${lead.value.toLocaleString()}</span>
                                        </div>
                                      )}
                                      {lead.next_follow_up && (
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                          <Calendar className="w-3.5 h-3.5" />
                                          <span>
                                            {format(
                                              new Date(lead.next_follow_up),
                                              "MMM d"
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {lead.probability && (
                                      <div className="mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-slate-400">
                                            Win probability
                                          </span>
                                          <span className="font-medium text-slate-700">
                                            {lead.probability}%
                                          </span>
                                        </div>
                                        <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{
                                              width: `${lead.probability}%`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            {stageLeads.length === 0 && (
                              <div className="text-center py-8 text-slate-400 text-sm">
                                No leads
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}