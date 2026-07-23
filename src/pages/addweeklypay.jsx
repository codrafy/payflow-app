import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CalendarRange } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import AddWeeklyPayModal from "@/components/AddWeeklyPayModal";
import JobPickerDrawer from "@/components/JobPickerDrawer";

export default function AddWeeklyPay() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weekLabel, setWeekLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [jobId, setJobId] = useState(null);
  const [jobDrawerOpen, setJobDrawerOpen] = useState(false);

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date") });

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.WeeklyPay.create(data),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ["weeklyPays"] });
      const previous = queryClient.getQueryData(["weeklyPays"]);
      queryClient.setQueryData(["weeklyPays"], (old = []) => [
        { ...newItem, id: `temp-${Date.now()}` },
        ...old,
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["weeklyPays"], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeklyPays"] });
      toast.success("Weekly pay added!");
      navigate("/");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const realJobId = jobId === "unassigned" ? null : jobId;
    mutation.mutate({
      amount: parseFloat(amount),
      date,
      week_label: weekLabel || `Week of ${format(new Date(date), "MMM d")}`,
      notes,
      ...(realJobId ? { job_id: realJobId } : {}),
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Weekly Pay</h1>
          <p className="text-sm text-muted-foreground mt-1">Record what your boss owes you this week.</p>
        </div>
        <Button variant="outline" onClick={() => setShowBulkModal(true)} className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4" />
          Bulk Add
        </Button>
      </div>

      <AddWeeklyPayModal
        open={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["weeklyPays"] });
          toast.success("Weeks added!");
          navigate("/");
        }}
      />

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-semibold">Amount ($)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-14 text-2xl font-bold text-center rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-semibold">Week Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="label" className="text-sm font-semibold">Label (optional)</Label>
          <Input
            id="label"
            placeholder={`e.g. Week of ${format(new Date(), "MMM d")}`}
            value={weekLabel}
            onChange={(e) => setWeekLabel(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Job / Client (optional)</Label>
          <JobPickerDrawer jobs={jobs} value={jobId} onChange={setJobId} open={jobDrawerOpen} onOpenChange={setJobDrawerOpen} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-semibold">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any extra details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-xl"
          />
        </div>

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full h-14 rounded-xl text-base font-bold"
        >
          {mutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Add Weekly Pay"
          )}
        </Button>
      </form>
    </motion.div>
  );
}
