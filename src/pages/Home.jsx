import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign } from "lucide-react";
import SummaryCards from "@/components/SummaryCards";
import AddWeeklyPayModal from "@/components/AddWeeklyPayModal";
import AddPaymentModal from "@/components/AddPaymentModal";
import WeeklyPayList from "@/components/WeeklyPayList";
import PaymentList from "@/components/PaymentList";

export default function Home() {
  const [weeklyPays, setWeeklyPays] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showAddPay, setShowAddPay] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [tab, setTab] = useState("earnings");

  const fetchData = async () => {
    const [pays, pmts] = await Promise.all([
      base44.entities.WeeklyPay.list("-date"),
      base44.entities.Payment.list("-date"),
    ]);
    setWeeklyPays(pays);
    setPayments(pmts);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalEarned = weeklyPays.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-green-500 text-white rounded-xl p-2">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pay Tracker</h1>
              <p className="text-xs text-gray-400">Track what your boss owes you</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddPay(true)}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Week</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddPayment(true)}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Got Paid</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        <SummaryCards totalEarned={totalEarned} totalPaid={totalPaid} />

        {/* Owed Banner */}
        {totalEarned - totalPaid > 0 && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Your boss still owes you</p>
              <p className="text-3xl font-extrabold text-red-700">
                ${(totalEarned - totalPaid).toFixed(2)}
              </p>
            </div>
            <Button
              onClick={() => setShowAddPayment(true)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Record Payment
            </Button>
          </div>
        )}

        {totalEarned > 0 && totalEarned - totalPaid === 0 && (
          <div className="mb-6 rounded-2xl bg-green-50 border border-green-100 px-5 py-4">
            <p className="text-green-700 font-semibold text-center">✅ All paid up! You're fully paid.</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => setTab("earnings")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === "earnings"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Weekly Earnings
          </button>
          <button
            onClick={() => setTab("payments")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === "payments"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Payments Received
          </button>
        </div>

        {tab === "earnings" && (
          <>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-700">Weekly Pay Entries</h2>
              <Button size="sm" variant="outline" onClick={() => setShowAddPay(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Week
              </Button>
            </div>
            <WeeklyPayList entries={weeklyPays} onDeleted={fetchData} />
          </>
        )}

        {tab === "payments" && (
          <>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-700">Payments from Boss</h2>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowAddPayment(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> Got Paid
              </Button>
            </div>
            <PaymentList payments={payments} onDeleted={fetchData} />
          </>
        )}
      </div>

      <AddWeeklyPayModal
        open={showAddPay}
        onClose={() => setShowAddPay(false)}
        onSaved={fetchData}
      />
      <AddPaymentModal
        open={showAddPayment}
        onClose={() => setShowAddPayment(false)}
        onSaved={fetchData}
      />
    </div>
  );
}
