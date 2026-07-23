import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Square, Clock } from "lucide-react";

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function HourlyTimer({ hourlyRate, onHourlyRateChange, onResult }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [manualHours, setManualHours] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const hoursWorked = elapsed > 0 ? elapsed / 3600 : parseFloat(manualHours) || 0;
  const rate = parseFloat(hourlyRate) || 0;
  const total = +(hoursWorked * rate).toFixed(2);

  // Notify parent whenever total changes
  useEffect(() => {
    if (rate > 0 && hoursWorked > 0) {
      onResult({ hours: +hoursWorked.toFixed(4), total });
    }
  }, [hoursWorked, rate]);

  const handleStop = () => {
    setRunning(false);
  };

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    setManualHours("");
    onResult({ hours: 0, total: 0 });
  };

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-xl border border-border">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Hourly Rate ($/hr)</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g. 25.00"
          value={hourlyRate}
          onChange={(e) => onHourlyRateChange(e.target.value)}
          className="h-12 rounded-xl text-xl font-bold text-center"
        />
      </div>

      {/* Timer */}
      <div className="text-center space-y-3">
        <div className="text-4xl font-mono font-bold tracking-widest text-foreground">
          {formatTime(elapsed)}
        </div>
        <div className="flex gap-2 justify-center">
          {!running ? (
            <Button
              type="button"
              onClick={() => setRunning(true)}
              className="h-11 px-6 rounded-xl bg-primary"
              disabled={!rate}
            >
              <Play className="w-4 h-4 mr-1" /> Start Timer
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleStop}
              variant="destructive"
              className="h-11 px-6 rounded-xl"
            >
              <Square className="w-4 h-4 mr-1" /> Stop
            </Button>
          )}
          {(elapsed > 0) && !running && (
            <Button type="button" variant="outline" onClick={handleReset} className="h-11 rounded-xl">
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Manual hours fallback */}
      {elapsed === 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Or enter hours manually
          </Label>
          <Input
            type="number"
            step="0.25"
            min="0"
            placeholder="e.g. 2.5"
            value={manualHours}
            onChange={(e) => setManualHours(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>
      )}

      {/* Calculated total */}
      {total > 0 && (
        <div className="flex justify-between items-center bg-primary/10 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-primary">
            {hoursWorked.toFixed(2)} hrs × ${rate}/hr
          </span>
          <span className="text-lg font-bold text-primary">${total.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
