import { jsPDF } from "jspdf";
import { format } from "date-fns";

const fmt = (n) => "$" + (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function generateInvoicePdf({ job, user, weeklyPays, extraJobs, payments, include }) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  let y = 0;

  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
  const today = format(new Date(), "MMMM d, yyyy");

  const totalWeekly = weeklyPays.reduce((s, w) => s + (w.amount || 0), 0);
  const totalExtra = extraJobs.reduce((s, j) => s + (j.amount || 0), 0);
  const totalEarned = totalWeekly + totalExtra;
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const balance = totalEarned - totalPaid;

  // ── Header band ──────────────────────────────────────────────────────────────
  doc.setFillColor(34, 197, 94); // primary green
  doc.rect(0, 0, pageW, 42, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("INVOICE", margin, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`#${invoiceNumber}`, margin, 29);
  doc.text(`Date: ${today}`, margin, 37);

  // Job / client info on right side of header
  if (job) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    const jobLabel = `${job.emoji || "💼"} ${job.name}`;
    doc.text(jobLabel, pageW - margin, 20, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let headerY = 29;
    if (job.boss_name) { doc.text(`Client: ${job.boss_name}`, pageW - margin, headerY, { align: "right" }); headerY += 8; }
    if (job.role) { doc.text(`Role: ${job.role}`, pageW - margin, headerY, { align: "right" }); headerY += 8; }
    if (job.address) { doc.text(`📍 ${job.address}`, pageW - margin, headerY, { align: "right" }); }
  }

  y = 58;

  // ── From / To ────────────────────────────────────────────────────────────────
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text("FROM", margin, y);
  doc.text("TO", pageW / 2 + 4, y);
  y += 5;

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(user?.full_name || user?.email || "Worker", margin, y);
  doc.text(job?.boss_name || job?.name || "Client", pageW / 2 + 4, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  if (user?.full_name && user?.email) { doc.text(user.email, margin, y); }
  if (job?.address) { doc.text(job.address, pageW / 2 + 4, y); }
  y += 5;
  if (job?.role) { doc.setTextColor(100, 100, 100); doc.text(`Role: ${job.role}`, margin, y); y += 5; }
  else { y += 5; }
  y += 5;

  // ── Divider ──────────────────────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Line Items Table ─────────────────────────────────────────────────────────
  const colDate = margin;
  const colDesc = margin + 28;
  const colAmt = pageW - margin;

  // Table header
  doc.setFillColor(245, 247, 245);
  doc.rect(margin, y - 4, pageW - margin * 2, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("DATE", colDate, y + 2);
  doc.text("DESCRIPTION", colDesc, y + 2);
  doc.text("AMOUNT", colAmt, y + 2, { align: "right" });
  y += 11;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const addRow = (dateStr, desc, amount, isAlt) => {
    if (y > pageH - 40) { doc.addPage(); y = 20; }
    if (isAlt) {
      doc.setFillColor(252, 252, 252);
      doc.rect(margin, y - 3.5, pageW - margin * 2, 8, "F");
    }
    doc.setTextColor(60, 60, 60);
    doc.text(dateStr, colDate, y + 1);
    doc.setTextColor(0);
    const maxDescW = colAmt - colDesc - 30;
    const truncated = doc.splitTextToSize(desc, maxDescW)[0];
    doc.text(truncated, colDesc, y + 1);
    doc.text(fmt(amount), colAmt, y + 1, { align: "right" });
    y += 8;
  };

  let rowIdx = 0;

  if (include.weeklyPay) {
    weeklyPays.forEach((w) => {
      addRow(
        format(new Date(w.date), "MM/dd/yy"),
        w.week_label || "Weekly Pay",
        w.amount,
        rowIdx++ % 2 === 0
      );
    });
  }

  if (include.extraJobs) {
    extraJobs.forEach((j) => {
      addRow(
        format(new Date(j.date), "MM/dd/yy"),
        j.title,
        j.amount,
        rowIdx++ % 2 === 0
      );
    });
  }

  // ── Payments credited ─────────────────────────────────────────────────────
  if (include.payments && payments.length > 0) {
    y += 2;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("PAYMENTS RECEIVED", colDate, y);
    y += 6;
    payments.forEach((p) => {
      addRow(
        format(new Date(p.date), "MM/dd/yy"),
        `Payment – ${p.method?.replace("_", " ") || ""}`,
        -p.amount,
        rowIdx++ % 2 === 0
      );
    });
  }

  // ── Totals box ────────────────────────────────────────────────────────────
  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  const totalsX = pageW / 2;
  const totalsRight = pageW - margin;

  const totRow = (label, value, bold, color) => {
    if (bold) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }
    if (color) doc.setTextColor(...color);
    else doc.setTextColor(0);
    doc.text(label, totalsX, y);
    doc.text(value, totalsRight, y, { align: "right" });
    y += bold ? 9 : 7;
  };

  if (include.weeklyPay) totRow("Weekly Pay subtotal:", fmt(totalWeekly));
  if (include.extraJobs) totRow("Extra jobs subtotal:", fmt(totalExtra));
  totRow("Total Earned:", fmt(totalEarned));
  if (include.payments) totRow("Total Paid:", fmt(totalPaid), false, [34, 197, 94]);
  y += 2;
  totRow("Balance Due:", fmt(balance), true, balance > 0 ? [220, 38, 38] : [34, 197, 94]);

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("Generated by PayFlow", margin, pageH - 10);
  doc.text(today, pageW - margin, pageH - 10, { align: "right" });

  return doc;
}
