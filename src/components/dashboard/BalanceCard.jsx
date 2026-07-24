import { motion } from "framer-motion";

export default function BalanceCard({ totalEarned, totalPaid, balance }) {
  const paidPercentage = totalEarned > 0 ? (totalPaid / totalEarned) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 md:p-8 text-primary-foreground"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-20 -translate-x-20" />
      
      <p className="text-sm font-medium opacity-80 tracking-wide uppercase">Your Boss Owes You</p>
      <h1 className="text-4xl md:text-5xl font-extrabold mt-2 tracking-tight">
        ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h1>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between text-sm opacity-90">
          <span>Paid so far</span>
          <span>{paidPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(paidPercentage, 100)}%` }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="h-full bg-white/90 rounded-full"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-xs opacity-70">Total Earned</p>
          <p className="text-lg font-bold mt-0.5">
            ${totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-xs opacity-70">Total Paid</p>
          <p className="text-lg font-bold mt-0.5">
            ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
