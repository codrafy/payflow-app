import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Plus, Trash2, ChevronRight, Briefcase, Loader2, Pencil, CheckSquare, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const EMOJIS = ["💼", "🏗️", "🌿", "🔧", "🏠", "🚗", "🎨", "🧹", "🌾", "⚡", "🔑", "🛠️"];
const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

const fmt = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Jobs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [bossName, setBossName] = useState("");
  const [notes, setNotes] = useState("");
  const [emoji, setEmoji] = useState("💼");
  const [color, setColor] = useState("#22c55e");

  const [editJob, setEditJob] = useState(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date"),
  });

  const { data: weeklyPays = [] } = useQuery({ queryKey: ["weeklyPays"], queryFn: () => base44.entities.WeeklyPay.list("-date") });
  const { data: payments = [] } = useQuery({ queryKey: ["payments"], queryFn: () => base44.entities.Payment.list("-date") });
  const { data: extraJobs = [] } = useQuery({ queryKey: ["extraJobs"], queryFn: () => base44.entities.ExtraJob.list("-date") });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job created!");
      setDrawerOpen(false);
      setName(""); setBossName(""); setNotes(""); setEmoji("💼"); setColor("#22c55e");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job updated!");
      setEditDrawerOpen(false);
      setEditJob(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Job.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job deleted");
    },
  });

  const bulkDeleteJobsMutation = useMutation({
    mutationFn: async (ids) => { await Promise.all(ids.map(id => base44.entities.Job.delete(id))); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success(`${selectedJobs.size} jobs deleted`);
      setSelectedJobs(new Set()); setSelectMode(false); setBulkDeleteOpen(false);
    },
  });

  const toggleSelectJob = (id) => {
    setSelectedJobs((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const exitSelectMode = () => { setSelectMode(false); setSelectedJobs(new Set()); };

  const getJobStats = (jobId) => {
    const earned =
      weeklyPays.filter(w => w.job_id === jobId).reduce((s, w) => s + (w.amount || 0), 0) +
      extraJobs.filter(j => j.job_id === jobId).reduce((s, j) => s + (j.amount || 0), 0);
    const paid = payments.filter(p => p.job_id === jobId).reduce((s, p) => s + (p.amount || 0), 0);
    return { earned, paid, balance: earned - paid };
  };

  const unassignedEarned =
    weeklyPays.filter(w => !w.job_id).reduce((s, w) => s + (w.amount || 0), 0) +
    extraJobs.filter(j => !j.job_id).reduce((s, j) => s + (j.amount || 0), 0);
  const unassignedPaid = payments.filter(p => !p.job_id).reduce((s, p) => s + (p.amount || 0), 0);
  const unassignedBalance = unassignedEarned - unassignedPaid;
  const hasUnassigned = unassignedEarned > 0 || unassignedPaid > 0;

  const openEdit = (job) => {
    setEditJob({ ...job });
    setEditDrawerOpen(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editJob.name?.trim()) { toast.error("Please enter a job name"); return; }
    updateMutation.mutate({ id: editJob.id, data: { name: editJob.name, boss_name: editJob.boss_name, notes: editJob.notes, emoji: editJob.emoji, color: editJob.color } });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Please enter a job name"); return; }
    createMutation.mutate({ name, boss_name: bossName, notes, emoji, color });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track earnings per job or client.</p>
        </div>
        <div className="flex items-center gap-2">
          {!selectMode ? (
            <Button variant="ghost" size="sm" onClick={() => setSelectMode(true)} className="text-muted-foreground">Select</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={exitSelectMode} className="text-muted-foreground">Cancel</Button>
          )}
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button className="rounded-xl h-10 font-bold">
              <Plus className="w-4 h-4 mr-1" /> New Job
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader><DrawerTitle>Create New Job</DrawerTitle></DrawerHeader>
            <form onSubmit={handleCreate} className="px-4 pb-8 space-y-4">
              <div className="space-y-2">
                <Label>Emoji</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-colors ${emoji === e ? "border-primary bg-primary/10" : "border-transparent bg-muted"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Job Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John's Garden, Smith House..." className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Boss / Client Name</Label>
                <Input value={bossName} onChange={(e) => setBossName(e.target.value)} placeholder="e.g. John Smith" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any extra info..." className="h-12 rounded-xl" />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full h-12 rounded-xl font-bold">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Job"}
              </Button>
            </form>
          </DrawerContent>
        </Drawer>
        </div>
      </div>

      {jobs.length === 0 && !hasUnassigned ? (
        <div className="text-center py-20 text-muted-foreground">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No jobs yet</p>
          <p className="text-sm mt-1">Create your first job to start tracking separately.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {jobs.map((job, i) => {
              const { earned, paid, balance } = getJobStats(job.id);
              return (
                <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}>
                  <div onClick={selectMode ? () => toggleSelectJob(job.id) : undefined}
                    className={`bg-card border rounded-2xl p-4 flex items-center gap-4 group transition-colors ${selectMode ? "cursor-pointer" : ""} ${selectedJobs.has(job.id) ? "border-primary bg-primary/5" : ""}`}>
                    {selectMode && (
                      <div className="shrink-0">
                        {selectedJobs.has(job.id) ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                      </div>
                    )}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: (job.color || "#22c55e") + "22" }}>
                      {job.emoji || "💼"}
                    </div>
                    <div className="flex-1 min-w-0" onClick={!selectMode ? () => navigate(`/jobs/${job.id}`) : undefined} style={{ cursor: selectMode ? "default" : "pointer" }}>
                      <p className="font-semibold text-foreground">{job.name}</p>
                      {job.boss_name && <p className="text-xs text-muted-foreground">{job.boss_name}</p>}
                      <div className="flex gap-3 mt-1.5 text-xs">
                        <span className="text-muted-foreground">Earned: <span className="font-semibold text-foreground">{fmt(earned)}</span></span>
                        <span className="text-muted-foreground">Paid: <span className="font-semibold text-primary">{fmt(paid)}</span></span>
                        <span className={`font-bold ${balance > 0 ? "text-destructive" : "text-primary"}`}>Owes: {fmt(balance)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(job); }}
                        className="h-11 w-11 text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-destructive md:opacity-0 md:group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{job.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>This removes the job. Existing entries linked to it won't be deleted but will become unlinked.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(job.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <button onClick={() => navigate(`/jobs/${job.id}`)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Unassigned card */}
          {hasUnassigned && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div onClick={() => navigate("/jobs/unassigned")} className="bg-card border rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: "#94a3b822" }}>
                  ❓
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">Unassigned</p>
                  <p className="text-xs text-muted-foreground">Records with no job linked</p>
                  <div className="flex gap-3 mt-1.5 text-xs">
                    <span className="text-muted-foreground">Earned: <span className="font-semibold text-foreground">{fmt(unassignedEarned)}</span></span>
                    <span className="text-muted-foreground">Paid: <span className="font-semibold text-primary">{fmt(unassignedPaid)}</span></span>
                    <span className={`font-bold ${unassignedBalance > 0 ? "text-destructive" : "text-primary"}`}>Owes: {fmt(unassignedBalance)}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Bulk delete bar */}
      <AnimatePresence>
        {selectMode && selectedJobs.size > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-24 left-0 right-0 flex justify-center px-4" style={{ zIndex: 40 }}>
            <div className="bg-card border border-border rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 w-full max-w-lg">
              <span className="text-sm font-medium text-foreground flex-1">{selectedJobs.size} selected</span>
              <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1.5">
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedJobs.size} jobs?</AlertDialogTitle>
                    <AlertDialogDescription>This removes {selectedJobs.size} jobs. Linked entries won't be deleted but will become unassigned.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => bulkDeleteJobsMutation.mutate([...selectedJobs])}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Drawer */}
      {editJob && (
        <Drawer open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
          <DrawerContent>
            <DrawerHeader><DrawerTitle>Edit Job</DrawerTitle></DrawerHeader>
            <form onSubmit={handleUpdate} className="px-4 pb-8 space-y-4">
              <div className="space-y-2">
                <Label>Emoji</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => setEditJob(j => ({ ...j, emoji: e }))}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-colors ${editJob.emoji === e ? "border-primary bg-primary/10" : "border-transparent bg-muted"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setEditJob(j => ({ ...j, color: c }))}
                      style={{ backgroundColor: c }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${editJob.color === c ? "border-foreground scale-110" : "border-transparent"}`} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Job Name *</Label>
                <Input value={editJob.name || ""} onChange={(e) => setEditJob(j => ({ ...j, name: e.target.value }))} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Boss / Client Name</Label>
                <Input value={editJob.boss_name || ""} onChange={(e) => setEditJob(j => ({ ...j, boss_name: e.target.value }))} placeholder="e.g. John Smith" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input value={editJob.notes || ""} onChange={(e) => setEditJob(j => ({ ...j, notes: e.target.value }))} placeholder="Any extra info..." className="h-12 rounded-xl" />
              </div>
              <Button type="submit" disabled={updateMutation.isPending} className="w-full h-12 rounded-xl font-bold">
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </form>
          </DrawerContent>
        </Drawer>
      )}
    </motion.div>
  );
}
