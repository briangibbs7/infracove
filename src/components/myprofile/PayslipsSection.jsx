import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  paid: "bg-green-100 text-green-700",
  processed: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
};

export default function PayslipsSection({ payslips = [] }) {
  const sorted = [...payslips].sort((a, b) => new Date(b.pay_date) - new Date(a.pay_date));

  const formatCurrency = (val) =>
    val != null ? `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-4 h-4 text-blue-500" />
          Pay Stubs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-slate-400 italic text-sm">No payslips available yet.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map(slip => (
              <div key={slip.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-800">{slip.pay_period}</p>
                    <p className="text-xs text-slate-500">
                      Paid {slip.pay_date ? format(new Date(slip.pay_date), "MMM d, yyyy") : "—"} ·{" "}
                      Net: <span className="font-semibold text-slate-700">{formatCurrency(slip.net_pay)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[slip.status] || "bg-slate-100 text-slate-600"}`}>
                    {slip.status}
                  </span>
                  {slip.file_url ? (
                    <a href={slip.file_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <Download className="w-3 h-3 mr-1" /> Download
                      </Button>
                    </a>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      <Download className="w-3 h-3 mr-1" /> No File
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}