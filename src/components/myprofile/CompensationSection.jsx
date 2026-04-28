import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function CompensationSection({ payrolls = [] }) {
  const latest = [...payrolls].sort((a, b) => new Date(b.pay_period_end) - new Date(a.pay_period_end))[0];

  const formatCurrency = (val) =>
    val != null ? `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="w-4 h-4 text-green-500" />
          Current Compensation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!latest ? (
          <p className="text-slate-400 italic text-sm">No payroll data found.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Base Salary</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(latest.base_salary)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Gross Pay</p>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(latest.gross_pay)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Total Deductions</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(latest.total_deductions)}</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Net Pay</p>
                <p className="text-lg font-bold text-indigo-700">{formatCurrency(latest.net_pay)}</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2 text-sm">
              <p className="font-medium text-slate-700 mb-2">Deduction Breakdown</p>
              {[
                { label: "Federal Tax", val: latest.federal_tax },
                { label: "State Tax", val: latest.state_tax },
                { label: "Social Security", val: latest.social_security },
                { label: "Medicare", val: latest.medicare },
                { label: "Health Insurance", val: latest.health_insurance },
                { label: "401(k)", val: latest.retirement_401k },
              ].map(({ label, val }) => val > 0 && (
                <div key={label} className="flex justify-between text-slate-600">
                  <span>{label}</span>
                  <span className="font-medium">{formatCurrency(val)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 border-t">
              <Calendar className="w-3 h-3" />
              Pay period: {latest.pay_period_start ? format(new Date(latest.pay_period_start), "MMM d") : "?"} –{" "}
              {latest.pay_period_end ? format(new Date(latest.pay_period_end), "MMM d, yyyy") : "?"}
              <Badge variant="outline" className="ml-auto capitalize">{latest.status}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}