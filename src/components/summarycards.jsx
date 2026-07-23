import { TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

export default function SummaryCards({ totalEarned, totalPaid }) {
  const totalOwed = totalEarned - totalPaid;

  const cards = [
    {
      label: "Total Earned",
      value: totalEarned,
      icon: TrendingUp,
      bg: "bg-blue-50",
      iconColor: "text-blue-500",
      valueColor: "text-blue-700",
      border: "border-blue-100",
    },
    {
      label: "Total Paid",
      value: totalPaid,
      icon: CheckCircle,
      bg: "bg-green-50",
      iconColor: "text-green-500",
      valueColor: "text-green-700",
      border: "border-green-100",
    },
    {
      label: "Still Owed to You",
      value: totalOwed,
      icon: AlertCircle,
      bg: totalOwed > 0 ? "bg-red-50" : "bg-gray-50",
      iconColor: totalOwed > 0 ? "text-red-500" : "text-gray-400",
      valueColor: totalOwed > 0 ? "text-red-700" : "text-gray-500",
      border: totalOwed > 0 ? "border-red-100" : "border-gray-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border p-5 ${card.bg} ${card.border} flex items-center gap-4`}
        >
          <div className={`p-3 rounded-xl bg-white/70 ${card.iconColor}`}>
            <card.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{card.label}</p>
            <p className={`text-2xl font-bold ${card.valueColor}`}>
              ${card.value.toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
