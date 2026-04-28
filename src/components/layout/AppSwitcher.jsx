import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink } from "lucide-react";

export default function AppSwitcher() {
  const { data: appLinks = [] } = useQuery({
    queryKey: ["appLinks"],
    queryFn: () => base44.entities.AppLink.list(),
  });

  const catchAllLink = appLinks.find(
    (a) => a.name === "CatchAllAI" && a.is_active
  );

  if (!catchAllLink) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => window.open("https://catchallai.com", "_blank")}
          >
            {/* CatchAll logo mark — stylized "C" */}
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-500 text-white text-[10px] font-bold leading-none select-none">
              C
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex items-center gap-1">
          Open CatchAll AI <ExternalLink className="w-3 h-3" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}