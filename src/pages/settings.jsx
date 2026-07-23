import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AutoPaySettings from "@/components/settings/AutoPaySettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setFullName(u?.full_name || "");
    });
  }, []);

  const handleSaveName = async () => {
    setSavingName(true);
    await base44.auth.updateMe({ full_name: fullName });
    toast.success("Name updated!");
    setSavingName(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Delete all user data first
      const [pays, payments, jobs] = await Promise.all([
        base44.entities.WeeklyPay.list(),
        base44.entities.Payment.list(),
        base44.entities.ExtraJob.list(),
      ]);
      await Promise.all([
        ...pays.map((r) => base44.entities.WeeklyPay.delete(r.id)),
        ...payments.map((r) => base44.entities.Payment.delete(r.id)),
        ...jobs.map((r) => base44.entities.ExtraJob.delete(r.id)),
      ]);
      toast.success("All data deleted. You have been logged out.");
      base44.auth.logout();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences.</p>

      {/* Account */}
      <div className="mt-6 bg-card border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-base">Account</h2>

        {/* Signed-in email */}
        {user && (
          <div className="flex items-center gap-3 bg-muted/60 rounded-xl px-4 py-3">
            <User className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Edit name */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Your Name</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-xl flex-1"
            />
            <Button
              onClick={handleSaveName}
              disabled={savingName || !fullName.trim()}
              className="h-11 rounded-xl px-5"
            >
              {savingName ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-12 rounded-xl"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>

      <AutoPaySettings />

      {/* Delete Account */}
      <div className="mt-4 bg-card border border-destructive/20 rounded-2xl p-5">
        <h2 className="font-semibold text-base mb-1 text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full h-12 rounded-xl" disabled={deleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your weekly pay records, extra jobs, payments, and account data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, delete everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}
