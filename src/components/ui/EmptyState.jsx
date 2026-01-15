import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel = "Get Started" 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <Button onClick={action} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}