import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PageHeader({ 
  title, 
  subtitle, 
  action, 
  actionLabel = "Add New",
  actionIcon: ActionIcon = Plus,
  children 
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-slate-500">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {action && (
          <Button onClick={action} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
            <ActionIcon className="w-4 h-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}