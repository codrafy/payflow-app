import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Check, ChevronDown, Briefcase, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const EMOJIS = ["💼", "🏗️", "🌿", "🔧", "🏠", "🚗", "🎨", "🧹", "🌾", "⚡", "🔑", "🛠️"];
const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

export default function JobPickerDrawer({ jobs, value, onChange, open, onOpenChange }) {
  const selected = jobs.find((j) => j.id === value);
  const queryClient = useQueryClient();

  const [addingJob, setAddingJob] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBoss, setNewBoss] = useState("");
  const [newEmoji, setNewEmoji] = useState("💼");
  const [newColor, setNewColor] = useState("#22c55e");
  const [saving, setSaving] = useState(false);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const created = await base44.entities.Job.create({ name: newName, boss_name: newBoss, emoji: newEmoji, color: newColor });
    await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    onChange(created.id);
    setSaving(false);
    setAddingJob(false);
    setNewName(""); setNewBoss(""); setNewEmoji("💼"); setNewColor("#22c55e");
    onOpenChange(false);
  };

  const getLabel = () => {
    if (value === "unassigned") return "Unassigned (no job)";
    if (selected) return `${selected.emoji || "💼"} ${selected.name}`;
    return null;
  };

  return (
    <Drawer open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setAddingJob(false); }}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="w-full h-12 rounded-xl border border-input bg-transparent px-3 flex items-center justify-between text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            {getLabel() ? (
              <span>{getLabel()}</span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> No job selected (General)
              </span>
            )}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        {addingJob ? (
          <>
            <DrawerHeader className="flex items-center gap-2">
              <button type="button" onClick={() => setAddingJob(false)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <DrawerTitle>Add New Job</DrawerTitle>
            </DrawerHeader>
            <form onSubmit={handleCreateJob} className="px-4 pb-8 space-y-4">
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button key={e} type="button" onClick={() => setNewEmoji(e)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-colors ${newEmoji === e ? "border-primary bg-primary/10" : "border-transparent bg-muted"}`}>
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setNewColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${newColor === c ? "border-foreground scale-110" : "border-transparent"}`} />
                ))}
              </div>
              <div className="space-y-2">
                <Label>Job Name *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. John's Garden" className="h-12 rounded-xl" autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Boss / Client Name</Label>
                <Input value={newBoss} onChange={(e) => setNewBoss(e.target.value)} placeholder="e.g. John Smith" className="h-12 rounded-xl" />
              </div>
              <Button type="submit" disabled={saving || !newName.trim()} className="w-full h-12 rounded-xl font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Select"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <DrawerHeader><DrawerTitle>Select Job / Client</DrawerTitle></DrawerHeader>
            <div className="px-4 pb-8 space-y-1">
              {/* General */}
              <button type="button" onClick={() => { onChange(null); onOpenChange(false); }}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-4 h-4" /> General (no specific job)
                </span>
                {!value && <Check className="w-4 h-4 text-primary" />}
              </button>

              {/* Unassigned */}
              <button type="button" onClick={() => { onChange("unassigned"); onOpenChange(false); }}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span>❓</span> Unassigned (no job)
                </span>
                {value === "unassigned" && <Check className="w-4 h-4 text-primary" />}
              </button>

              {/* Existing jobs */}
              {jobs.map((j) => (
                <button key={j.id} type="button" onClick={() => { onChange(j.id); onOpenChange(false); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                  <span className="flex items-center gap-2">
                    <span>{j.emoji || "💼"}</span>
                    <div className="text-left">
                      <p>{j.name}</p>
                      {j.boss_name && <p className="text-xs text-muted-foreground">{j.boss_name}</p>}
                    </div>
                  </span>
                  {value === j.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}

              {/* Add new job button */}
              <button type="button" onClick={() => setAddingJob(true)}
                className="w-full flex items-center gap-2 px-4 py-3.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors border border-dashed border-primary/30 mt-2">
                <Plus className="w-4 h-4" /> Add New Job
              </button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
