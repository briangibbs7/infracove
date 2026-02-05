import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Minus, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";

export default function LeaveBalanceManager({ employee }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [balances, setBalances] = useState({
    vacation_balance: employee.vacation_balance || 0,
    sick_balance: employee.sick_balance || 0,
    personal_balance: employee.personal_balance || 0,
    bereavement_balance: employee.bereavement_balance || 0,
    parental_balance: employee.parental_balance || 0,
  });
  const queryClient = useQueryClient();

  const updateBalanceMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.update(employee.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setEditDialogOpen(false);
      toast.success("Leave balances updated");
    },
  });

  const handleSave = () => {
    updateBalanceMutation.mutate(balances);
  };

  const leaveTypes = [
    { key: "vacation_balance", label: "Vacation", color: "bg-blue-100 text-blue-700" },
    { key: "sick_balance", label: "Sick", color: "bg-red-100 text-red-700" },
    { key: "personal_balance", label: "Personal", color: "bg-purple-100 text-purple-700" },
    { key: "bereavement_balance", label: "Bereavement", color: "bg-slate-100 text-slate-700" },
    { key: "parental_balance", label: "Parental", color: "bg-green-100 text-green-700" },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Leave Balances
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Adjust
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {leaveTypes.map((type) => (
              <div key={type.key} className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">{type.label}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {employee[type.key] || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">days</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Leave Balances</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {leaveTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <Label>{type.label} Days</Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      setBalances({ ...balances, [type.key]: Math.max(0, balances[type.key] - 1) })
                    }
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    className="w-20 text-center"
                    value={balances[type.key]}
                    onChange={(e) =>
                      setBalances({ ...balances, [type.key]: parseFloat(e.target.value) || 0 })
                    }
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setBalances({ ...balances, [type.key]: balances[type.key] + 1 })}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}