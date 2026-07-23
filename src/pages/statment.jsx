import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Download, Mail, Loader2, ChevronDown, Check, Briefcase, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { generateInvoicePdf } from "@/utils/generateInvoicePdf";

export default function Statement() {
  const navigate = useNavigate();
  const [bossEmail, setBossEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("all");
  const [jobDrawerOpen, setJobDrawerOpen] = useState(false);
  const [include, setInclude] = useState({ weeklyPay: true, extraJobs: true, payments: true, balance: true });
  const [user, setUser] = useState(null);

  useState(() => { base44.auth.me().then(setUser); });

  const toggleInclude = (key) => setInclude((prev) => ({ ...prev, [key]: !prev[key] }));

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => base44.entities.Job.list("-created_date") });
  const { data: allWeeklyPays = [] } = useQuery({ queryKey: ["weeklyPays"], queryFn: () => base44.entities.WeeklyPay.list("-date") });
  const { data: allExtraJobs = [] } = useQuery({ queryKey: ["extraJobs"], queryFn: () => base44.entities.ExtraJob.list("-date") });
  const { data: allPayments = [] } = useQuery({ queryKey: ["payments"], queryFn: () => base44.entities.Payment.list("-date") });

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  const weeklyPays = selectedJobId === "all" ? allWeeklyPays
    : selectedJobId === "unassigned" ? allWeeklyPays.filter(w => !w.job_id)
    : allWeeklyPays.filter(w => w.job_id === selectedJobId);
  const extraJobs = selectedJobId === "all" ? allExtraJobs
    : selectedJobId === "unassigned" ? allExtraJobs.filter(j => !j.job_id)
    : allExtraJobs.filter(j => j.job_id === selectedJobId);
  const payments = selectedJobId === "all" ? allPayments
    : selectedJobId === "unassigned" ? allPayments.filter(p => !p.job_id)
    : allPayments.filter(p => p.job_id === selectedJobId);

  const totalWeeklyPay = weeklyPays.reduce((s, w) => s + (w.amount || 0), 0);
  const totalExtraJobs = extraJobs.reduce((s, j) => s + (j.amount || 0), 0);
  const totalEarned = totalWeeklyPay + totalExtraJobs;
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const balance = totalEarned - totalPaid;

  const fmt = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const scopeLabel = selectedJobId === "all" ? "All Jobs" : selectedJobId === "unassigned" ? "❓ Unassigned" : (selectedJob ? `${selectedJob.emoji || "💼"} ${selectedJob.name}` : "All Jobs");

  const buildPdfDoc = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;
    const checkPage = () => { if (y > 270) { doc.addPage(); y = 20; } };
    const line = () => { doc.setDrawColor(200); doc.line(14, y, pageW - 14, y); y += 5; };

    doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.setTextColor(0);
    doc.text(selectedJobId === "all" ? "Pay Statement — All Jobs" : `Pay Statement — ${selectedJob?.name || ""}`, 14, y); y += 8;
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, 14, y); y += 6;
    if (user?.full_name || user?.email) {
      doc.setTextColor(60, 60, 60);
      doc.text(`From: ${user?.full_name || user?.email}`, 14, y);
      if (user?.full_name && user?.email) { doc.text(user.email, 14 + doc.getTextWidth(`From: ${user.full_name}`) + 3, y); }
      y += 6;
    }
    doc.setTextColor(100); y += 2; line();

    // Overall summary
    if (include.balance) {
      doc.setTextColor(0); doc.setFontSize(13); doc.setFont("helvetica", "bold");
      doc.text("Overall Summary", 14, y); y += 7;
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      if (include.weeklyPay) { doc.text(`Total Weekly Pay:   ${fmt(totalWeeklyPay)}`, 14, y); y += 6; }
      if (include.extraJobs) { doc.text(`Total Extra Jobs:   ${fmt(totalExtraJobs)}`, 14, y); y += 6; }
      doc.text(`Total Earned:       ${fmt(totalEarned)}`, 14, y); y += 6;
      doc.text(`Total Paid:         ${fmt(totalPaid)}`, 14, y); y += 6;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(balance > 0 ? 180 : 40, balance > 0 ? 60 : 150, 40);
      doc.text(`Balance Owed:       ${fmt(balance)}`, 14, y);
      doc.setTextColor(0); y += 10; line();
    }

    if (selectedJobId === "all") {
      // Per-job sections
      const sections = [
        ...jobs.map(j => ({ id: j.id, label: `${j.emoji || "💼"} ${j.name}`, job: j })),
        { id: "unassigned", label: "Unassigned", job: null }
      ];
      sections.forEach(({ id, label, job: sJob }) => {
        const sw = allWeeklyPays.filter(w => id === "unassigned" ? !w.job_id : w.job_id === id);
        const se = allExtraJobs.filter(j => id === "unassigned" ? !j.job_id : j.job_id === id);
        const sp = allPayments.filter(p => id === "unassigned" ? !p.job_id : p.job_id === id);
        if (!sw.length && !se.length && !sp.length) return;

        const sEarned = sw.reduce((s, w) => s + (w.amount || 0), 0) + se.reduce((s, j) => s + (j.amount || 0), 0);
        const sPaid = sp.reduce((s, p) => s + (p.amount || 0), 0);

        checkPage();
        doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(34, 120, 70);
        doc.text(label, 14, y); y += 6;

        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
        if (sJob?.boss_name) { doc.text(`Client: ${sJob.boss_name}`, 14, y); y += 5; }
        if (sJob?.role) { doc.text(`Role: ${sJob.role}`, 14, y); y += 5; }
        if (sJob?.address) { doc.text(`Address: ${sJob.address}`, 14, y); y += 5; }

        doc.setTextColor(0); doc.setFontSize(9);
        doc.text(`Earned: ${fmt(sEarned)}   Paid: ${fmt(sPaid)}   Balance: ${fmt(sEarned - sPaid)}`, 14, y); y += 7;

        if (include.weeklyPay && sw.length > 0) {
          doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Weekly Pay", 14, y); y += 5;
          doc.setFont("helvetica", "normal"); doc.setFontSize(9);
          sw.forEach(w => { checkPage(); doc.text(`${w.week_label || w.date}`, 18, y); doc.text(fmt(w.amount), pageW - 14, y, { align: "right" }); y += 5; });
        }
        if (include.extraJobs && se.length > 0) {
          doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Extra Jobs", 14, y); y += 5;
          doc.setFont("helvetica", "normal"); doc.setFontSize(9);
          se.forEach(j => { checkPage(); doc.text(`${format(new Date(j.date), "MMM d, yyyy")} – ${j.title}`, 18, y); doc.text(fmt(j.amount), pageW - 14, y, { align: "right" }); y += 5; });
        }
        if (include.payments && sp.length > 0) {
          doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Payments Received", 14, y); y += 5;
          doc.setFont("helvetica", "normal"); doc.setFontSize(9);
          sp.forEach(p => { checkPage(); doc.text(`${format(new Date(p.date), "MMM d, yyyy")} – ${p.method}`, 18, y); doc.text(fmt(p.amount), pageW - 14, y, { align: "right" }); y += 5; });
        }
        y += 4; line();
      });
    } else {
      // Single job
      if (selectedJob) {
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
        if (selectedJob.boss_name) { doc.text(`Client: ${selectedJob.boss_name}`, 14, y); y += 5; }
        if (selectedJob.role) { doc.text(`Role: ${selectedJob.role}`, 14, y); y += 5; }
        if (selectedJob.address) { doc.text(`Address: ${selectedJob.address}`, 14, y); y += 5; }
        doc.setTextColor(0); y += 3; line();
      }

      if (include.weeklyPay && weeklyPays.length > 0) {
        doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("Weekly Pay", 14, y); y += 7;
        doc.setFontSize(9); doc.setFont("helvetica", "normal");
        weeklyPays.forEach(w => { checkPage(); doc.text(`${w.week_label || w.date}`, 14, y); doc.text(fmt(w.amount), pageW - 14, y, { align: "right" }); y += 5; });
        y += 5; line();
      }
      if (include.extraJobs && extraJobs.length > 0) {
        doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("Extra Jobs", 14, y); y += 7;
        doc.setFontSize(9); doc.setFont("helvetica", "normal");
        extraJobs.forEach(j => { checkPage(); doc.text(`${format(new Date(j.date), "MMM d, yyyy")} – ${j.title}`, 14, y); doc.text(fmt(j.amount), pageW - 14, y, { align: "right" }); y += 5; });
        y += 5; line();
      }
      if (include.payments && payments.length > 0) {
        doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("Payments Received", 14, y); y += 7;
        doc.setFontSize(9); doc.setFont("helvetica", "normal");
        payments.forEach(p => { checkPage(); doc.text(`${format(new Date(p.date), "MMM d, yyyy")} – ${p.method}`, 14, y); doc.text(fmt(p.amount), pageW - 14, y, { align: "right" }); y += 5; });
      }
    }

    return doc;
  };

  const handleDownload = () => {
    const doc = buildPdfDoc();
    const slug = selectedJobId === "all" ? "all-jobs" : (selectedJob?.name?.replace(/\s+/g, "-").toLowerCase() || "job");
    doc.save(`pay-statement-${slug}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF downloaded!");
  };

  const handleExportInvoice = () => {
    if (selectedJobId === "all") {
      toast.error("Please select a specific job to export an invoice.");
      return;
    }
    const jobForInvoice = selectedJobId === "unassigned" ? { name: "Unassigned", emoji: "❓" } : selectedJob;
    const doc = generateInvoicePdf({ job: jobForInvoice, user, weeklyPays, extraJobs, payments, include });
    const slug = selectedJobId === "unassigned" ? "unassigned" : (selectedJob?.name?.replace(/\s+/g, "-").toLowerCase() || "job");
    doc.save(`invoice-${slug}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("Invoice exported!");
  };

  const handleSendEmail = async () => {
    if (!bossEmail) { toast.error("Please enter an email"); return; }
    setSending(true);
    const title = selectedJobId === "all" ? "All Jobs" : selectedJobId === "unassigned" ? "Unassigned" : (selectedJob?.name || "Job");
    const lines = [`<h2>Pay Statement — ${title} — ${format(new Date(), "MMMM d, yyyy")}</h2>`];
    if (include.balance) {
      lines.push(`<p>`);
      if (include.weeklyPay) lines.push(`<strong>Total Weekly Pay:</strong> ${fmt(totalWeeklyPay)}<br/>`);
      if (include.extraJobs) lines.push(`<strong>Total Extra Jobs:</strong> ${fmt(totalExtraJobs)}<br/>`);
      lines.push(`<strong>Total Earned:</strong> ${fmt(totalEarned)}<br/><strong>Total Paid:</strong> ${fmt(totalPaid)}<br/><strong>Balance Owed: ${fmt(balance)}</strong></p><hr/>`);
    }
    if (include.weeklyPay && weeklyPays.length > 0) {
      lines.push(`<h3>Weekly Pay</h3><ul>`);
      weeklyPays.forEach(w => lines.push(`<li>${w.week_label || w.date}: ${fmt(w.amount)}</li>`));
      lines.push(`</ul>`);
    }
    if (include.extraJobs && extraJobs.length > 0) {
      lines.push(`<h3>Extra Jobs</h3><ul>`);
      extraJobs.forEach(j => lines.push(`<li>${format(new Date(j.date), "MMM d, yyyy")} – ${j.title}: ${fmt(j.amount)}</li>`));
      lines.push(`</ul>`);
    }
    if (include.payments && payments.length > 0) {
      lines.push(`<h3>Payments Received</h3><ul>`);
      payments.forEach(p => lines.push(`<li>${format(new Date(p.date), "MMM d, yyyy")} – ${p.method}: ${fmt(p.amount)}</li>`));
      lines.push(`</ul>`);
    }
    await base44.integrations.Core.SendEmail({ to: bossEmail, subject: `Pay Statement – ${title} – ${format(new Date(), "MMMM d, yyyy")}`, body: lines.join("\n") });
    setSending(false);
    toast.success("Statement sent to " + bossEmail);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-foreground">Statement</h1>
      <p className="text-sm text-muted-foreground mt-1">Generate a pay report — for all jobs or a specific one.</p>

      {/* Job scope picker */}
      <div className="mt-5 space-y-2">
        <Label className="text-sm font-semibold">Scope</Label>
        <Drawer open={jobDrawerOpen} onOpenChange={setJobDrawerOpen}>
          <DrawerTrigger asChild>
            <button type="button" className="w-full h-12 rounded-xl border border-input bg-transparent px-3 flex items-center justify-between text-sm font-medium hover:bg-muted/50 transition-colors">
              <span className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                {scopeLabel}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader><DrawerTitle>Select Scope</DrawerTitle></DrawerHeader>
            <div className="px-4 pb-8 space-y-1">
              <button type="button" onClick={() => { setSelectedJobId("all"); setJobDrawerOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground" /> All Jobs (combined)</span>
                {selectedJobId === "all" && <Check className="w-4 h-4 text-primary" />}
              </button>
              <button type="button" onClick={() => { setSelectedJobId("unassigned"); setJobDrawerOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                <span className="flex items-center gap-2 text-muted-foreground"><span>❓</span> Unassigned (no job)</span>
                {selectedJobId === "unassigned" && <Check className="w-4 h-4 text-primary" />}
              </button>
              {jobs.map(j => (
                <button key={j.id} type="button" onClick={() => { setSelectedJobId(j.id); setJobDrawerOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                  <span className="flex items-center gap-2">
                    <span>{j.emoji || "💼"}</span>
                    <div className="text-left"><p>{j.name}</p>{j.boss_name && <p className="text-xs text-muted-foreground">{j.boss_name}</p>}</div>
                  </span>
                  {selectedJobId === j.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Summary */}
      <div className="mt-5 bg-card border rounded-2xl p-5 space-y-2">
        <h2 className="font-semibold text-base mb-1">Summary — {scopeLabel}</h2>
        {selectedJob && (
          <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
            {selectedJob.boss_name && <p>👤 {selectedJob.boss_name}</p>}
            {selectedJob.role && <p>🏷️ {selectedJob.role}</p>}
            {selectedJob.address && <p>📍 {selectedJob.address}</p>}
          </div>
        )}
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Weekly Pay</span><span>{fmt(totalWeeklyPay)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Extra Jobs</span><span>{fmt(totalExtraJobs)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Earned</span><span className="font-semibold">{fmt(totalEarned)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Paid</span><span className="text-primary font-semibold">{fmt(totalPaid)}</span></div>
        <div className="border-t pt-2 flex justify-between font-bold text-base">
          <span>Balance Owed</span>
          <span className={balance > 0 ? "text-destructive" : "text-primary"}>{fmt(balance)}</span>
        </div>
      </div>

      {/* Detail lists */}
      {selectedJobId === "all" ? (
        <>
          {[...jobs.map(j => ({ id: j.id, label: `${j.emoji || "💼"} ${j.name}`, job: j })),
            { id: "unassigned", label: "❓ Unassigned", job: null }
          ].map(({ id, label, job: sectionJob }) => {
            const sw = allWeeklyPays.filter(w => id === "unassigned" ? !w.job_id : w.job_id === id);
            const se = allExtraJobs.filter(j => id === "unassigned" ? !j.job_id : j.job_id === id);
            const sp = allPayments.filter(p => id === "unassigned" ? !p.job_id : p.job_id === id);
            if (!sw.length && !se.length && !sp.length) return null;
            const sEarned = sw.reduce((s, w) => s + (w.amount || 0), 0) + se.reduce((s, j) => s + (j.amount || 0), 0);
            const sPaid = sp.reduce((s, p) => s + (p.amount || 0), 0);
            return (
              <div key={id} className="mt-4 bg-card border rounded-2xl p-5 space-y-3">
                <div>
                  <h2 className="font-semibold text-base">{label}</h2>
                  {sectionJob && (
                    <div className="text-xs text-muted-foreground space-y-0.5 mt-0.5">
                      {sectionJob.boss_name && <span className="mr-2">👤 {sectionJob.boss_name}</span>}
                      {sectionJob.role && <span className="mr-2">🏷️ {sectionJob.role}</span>}
                      {sectionJob.address && <span>📍 {sectionJob.address}</span>}
                    </div>
                  )}
                  <div className="flex gap-4 text-xs mt-1">
                    <span className="text-muted-foreground">Earned: <span className="font-semibold text-foreground">{fmt(sEarned)}</span></span>
                    <span className="text-muted-foreground">Paid: <span className="font-semibold text-primary">{fmt(sPaid)}</span></span>
                    <span className="text-muted-foreground">Balance: <span className={`font-semibold ${(sEarned - sPaid) > 0 ? "text-destructive" : "text-primary"}`}>{fmt(sEarned - sPaid)}</span></span>
                  </div>
                </div>
                {sw.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Weekly Pay</p>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {sw.map(w => <div key={w.id} className="flex justify-between text-sm"><span className="text-muted-foreground">{w.week_label || w.date}</span><span>{fmt(w.amount)}</span></div>)}
                    </div>
                  </div>
                )}
                {se.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Extra Jobs</p>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {se.map(j => <div key={j.id} className="flex justify-between text-sm"><div><span className="font-medium">{j.title}</span><span className="text-muted-foreground ml-2">{format(new Date(j.date), "MMM d")}</span></div><span>{fmt(j.amount)}</span></div>)}
                    </div>
                  </div>
                )}
                {sp.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Payments Received</p>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {sp.map(p => <div key={p.id} className="flex justify-between text-sm"><span className="text-muted-foreground">{format(new Date(p.date), "MMM d")} – {p.method}</span><span className="text-primary">{fmt(p.amount)}</span></div>)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      ) : (
        <>
          {weeklyPays.length > 0 && (
            <div className="mt-4 bg-card border rounded-2xl p-5">
              <h2 className="font-semibold text-base mb-3">Weekly Pay ({weeklyPays.length})</h2>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {weeklyPays.map(w => (
                  <div key={w.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{w.week_label || w.date}</span>
                    <span>{fmt(w.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {extraJobs.length > 0 && (
            <div className="mt-4 bg-card border rounded-2xl p-5">
              <h2 className="font-semibold text-base mb-3">Extra Jobs ({extraJobs.length})</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {extraJobs.map(j => (
                  <div key={j.id} className="flex justify-between text-sm">
                    <div><span className="font-medium">{j.title}</span><span className="text-muted-foreground ml-2">{format(new Date(j.date), "MMM d, yyyy")}</span></div>
                    <span>{fmt(j.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {payments.length > 0 && (
            <div className="mt-4 bg-card border rounded-2xl p-5">
              <h2 className="font-semibold text-base mb-3">Payments Received ({payments.length})</h2>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {payments.map(p => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{format(new Date(p.date), "MMM d, yyyy")} – {p.method}</span>
                    <span className="text-primary">{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="mt-6 space-y-4 pb-4">
        <div className="flex gap-3">
          <Button onClick={handleDownload} className="flex-1 h-12 rounded-xl font-bold" variant="outline">
            <Download className="w-4 h-4 mr-2" /> Statement PDF
          </Button>
          <Button
            onClick={handleExportInvoice}
            disabled={selectedJobId === "all"}
            className="flex-1 h-12 rounded-xl font-bold"
            variant="default"
          >
            <FileText className="w-4 h-4 mr-2" /> Export Invoice
          </Button>
        </div>

        <div className="bg-card border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-base">Send by Email</h2>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Include in report</Label>
            <div className="grid grid-cols-2 gap-2">
              {[{ key: "weeklyPay", label: "Weekly Pay" }, { key: "extraJobs", label: "Extra Jobs" }, { key: "payments", label: "Payments" }, { key: "balance", label: "Balance Summary" }].map(({ key, label }) => (
                <button key={key} type="button" onClick={() => toggleInclude(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${include[key] ? "bg-primary/10 border-primary text-primary" : "bg-muted border-border text-muted-foreground"}`}>
                  <Checkbox checked={include[key]} className="pointer-events-none" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Recipient Email</Label>
            <Input type="email" placeholder="boss@example.com" value={bossEmail} onChange={(e) => setBossEmail(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <Button onClick={handleSendEmail} disabled={sending} className="w-full h-12 rounded-xl font-bold">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4 mr-2" />Send Statement</>}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
