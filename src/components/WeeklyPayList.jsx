import { format } from "date-fns";
import { Briefcase, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function WeeklyPayList({ entries, onDeleted }) {
  const handleDelete = async (id) => {
    if (!confirm("Delete this entry?")) return;
    await base44.entities.WeeklyPay.delete(id);
    onDeleted();
  };

  if (!entries.length) {
    return (
      <p className="text-center text-gray-400 py-8">No weekly pay entries yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Briefcase className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {entry.week_label || `Week of ${format(new Date(entry.date), "MMM d, yyyy")}`}
              </p>
              {entry.notes && <p className="text-xs text-gray-400">{entry.notes}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-blue-700 text-lg">${entry.amount.toFixed(2)}</span>
            <button
              onClick={() => handleDelete(entry.id)}
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
