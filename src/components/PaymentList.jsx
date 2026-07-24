import { format } from "date-fns";
import { Banknote, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const methodLabel = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  check: "Check",
  other: "Other",
};

export default function PaymentList({ payments, onDeleted }) {
  const handleDelete = async (id) => {
    if (!confirm("Delete this payment?")) return;
    await base44.entities.Payment.delete(id);
    onDeleted();
  };

  if (!payments.length) {
    return (
      <p className="text-center text-gray-400 py-8">No payments recorded yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Banknote className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {format(new Date(payment.date), "MMM d, yyyy")}
              </p>
              <p className="text-xs text-gray-400">
                {methodLabel[payment.method] || payment.method}
                {payment.notes ? ` · ${payment.notes}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-green-700 text-lg">${payment.amount.toFixed(2)}</span>
            <button
              onClick={() => handleDelete(payment.id)}
              className="text-gray-300 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
