import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ExerciseOptionsDialog({ grant, valuation, isOpen, onClose, onExercise }) {
  const [sharesToExercise, setSharesToExercise] = useState(0);

  if (!grant) return null;

  const vestedShares = grant.shares_vested || 0;
  const alreadyExercised = grant.shares_exercised || 0;
  const availableToExercise = vestedShares - alreadyExercised;
  const strikePrice = grant.strike_price || 0;
  const currentPrice = valuation?.common_stock_price || 0;
  const spread = currentPrice - strikePrice;

  const exerciseCost = sharesToExercise * strikePrice;
  const currentValue = sharesToExercise * currentPrice;
  const potentialGain = sharesToExercise * spread;

  const handleExercise = () => {
    if (sharesToExercise <= 0 || sharesToExercise > availableToExercise) {
      toast.error("Invalid number of shares");
      return;
    }

    onExercise?.({
      ...grant,
      shares_exercised: alreadyExercised + sharesToExercise
    });
    
    setSharesToExercise(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Exercise Stock Options</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Grant Info */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-2">Grant Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-600">Grant Type</p>
                <p className="font-medium capitalize">{grant.grant_type?.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-slate-600">Strike Price</p>
                <p className="font-medium">${strikePrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-600">Vested Shares</p>
                <p className="font-medium text-green-600">{vestedShares.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-600">Already Exercised</p>
                <p className="font-medium">{alreadyExercised.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Available to Exercise */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Available to Exercise</span>
              <span className="text-2xl font-bold text-blue-900">
                {availableToExercise.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Exercise Input */}
          <div>
            <Label>Shares to Exercise</Label>
            <Input
              type="number"
              value={sharesToExercise}
              onChange={(e) => setSharesToExercise(parseInt(e.target.value) || 0)}
              max={availableToExercise}
              placeholder="Enter number of shares"
            />
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSharesToExercise(Math.floor(availableToExercise * 0.25))}
              >
                25%
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSharesToExercise(Math.floor(availableToExercise * 0.5))}
              >
                50%
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSharesToExercise(Math.floor(availableToExercise * 0.75))}
              >
                75%
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSharesToExercise(availableToExercise)}
              >
                100%
              </Button>
            </div>
          </div>

          {/* Calculation Summary */}
          {sharesToExercise > 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
              <h4 className="font-semibold text-emerald-900 mb-3">Exercise Summary</h4>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Exercise Cost:</span>
                <span className="font-semibold text-emerald-900">
                  ${exerciseCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Current Value:</span>
                <span className="font-semibold text-emerald-900">
                  ${currentValue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-emerald-300">
                <span className="text-emerald-700 font-medium">Potential Gain:</span>
                <span className="font-bold text-emerald-900">
                  ${potentialGain.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Spread per Share:</span>
                <span className="font-semibold text-emerald-900">
                  ${spread.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-900">
              Exercising stock options may have tax implications. Please consult with a financial advisor before proceeding.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExercise}
            disabled={sharesToExercise <= 0 || sharesToExercise > availableToExercise}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Exercise {sharesToExercise.toLocaleString()} Share{sharesToExercise !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}