import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function JobsBreakdown({ jobs, weeklyPays, payments, extraJobs }) {
  const navigate = useNavigate();

  if (!jobs || jobs.length === 0) return null;

  const fmt = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const jobStats = jobs.map((job) => {
    const earned =
      weeklyPays.filter(w => w.job_id === job.id).reduce((s, w) => s + (w.amount || 0), 0) +
      extraJobs.filter(j => j.job_id === job.id).reduce((s, j) => s + (j.amount || 0), 0);
    const paid = payments.filter(p => p.job_id === job.id).reduce((s, p) => s + (p.amount || 0), 0);
    return { ...job, earned, paid, balance: earned - paid };
  }).filter(j => j.earned > 0 || j.paid > 0);

  if (jobStats.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">By Job</h3>
      <div className="space-y-2">
        {jobStats.map((job, i) => (
          <motion.button
            key={job.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="w-full bg-card border rounded-xl p-3.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: (job.color || "#22c55e") + "22" }}>
              {job.emoji || "💼"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{job.name}</p>
              {job.boss_name && <p className="text-xs text-muted-foreground truncate">{job.boss_name}</p>}
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                <span>Earned: <span className="text-foreground font-medium">{fmt(job.earned)}</span></span>
                <span className={`font-semibold ${job.balance > 0 ? "text-destructive" : "text-primary"}`}>
                  Owes: {fmt(job.balance)}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
