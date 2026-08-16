import { motion } from "framer-motion";
import { formatCompact } from "../utils/formatCurrency";
import Avatar from "./Avatar";

export default function BalanceChip({ member, netBalance, currency = "₹", onClick }) {
  const isPositive = netBalance > 0;
  const isNegative = netBalance < 0;
  const isZero = netBalance === 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
        isPositive
          ? "bg-success text-surface"
          : isNegative
          ? "bg-border text-text-muted"
          : "bg-highlight text-text-dark"
      }`}
    >
      <Avatar member={member} size={24} />
      <span className="whitespace-nowrap">{member.name}</span>
      <span className="font-mono font-semibold">
        {isPositive ? "+" : ""}
        {formatCompact(netBalance, currency)}
      </span>
    </motion.button>
  );
}
