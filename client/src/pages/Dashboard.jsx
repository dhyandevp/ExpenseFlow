import SEO from "../components/SEO";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  PieChart,
  Users,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useGroup } from "../App";
import {
  getBalances,
  getBreakdown,
  getFairnessScore,
} from "../api/client";
import { formatINR } from "../utils/formatCurrency";
import { expandingCard, staggerContainer } from "../utils/motion";
import { getFairnessColor, getCategoryColor } from "../../../shared/fairness";
import SettlementHistory from "../components/SettlementHistory";
import Avatar from "../components/Avatar";
import { CategoryIcon } from "../utils/categoryIcons";

const timeFilters = [
  { label: "All Time", value: "all" },
  { label: "This Month", value: "month" },
  { label: "3 Months", value: "3months" },
  { label: "6 Months", value: "6months" },
];

function getDateRange(filter) {
  const now = new Date();
  switch (filter) {
    case "month":
      return {
        start_date: new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0],
      };
    case "3months":
      return {
        start_date: new Date(now.getFullYear(), now.getMonth() - 3, 1)
          .toISOString()
          .split("T")[0],
      };
    case "6months":
      return {
        start_date: new Date(now.getFullYear(), now.getMonth() - 6, 1)
          .toISOString()
          .split("T")[0],
      };
    default:
      return {};
  }
}

function Dashboard() {
  const { currentGroup } = useGroup();
  const [timeFilter, setTimeFilter] = useState("all");

  const [balances, setBalances] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [fairness, setFairness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    if (!currentGroup) return;
    const period = getDateRange(timeFilter);

    setLoading(true);
    setError(null);
    Promise.race([
      Promise.all([
        getBalances(currentGroup.id, period),
        getBreakdown(currentGroup.id, period),
        getFairnessScore(currentGroup.id, period),
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 8000))
    ])
      .then(([balRes, breakRes, fairRes]) => {
        setBalances(balRes.data);
        setBreakdown(breakRes.data);
        setFairness(fairRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentGroup, timeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const members = currentGroup.members || [];
  const currency = currentGroup.currency || "₹";

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-accent">{error}</p>
        <button onClick={fetchData} className="btn-primary">Retry</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="skeleton h-48 rounded-xl md:col-span-1" />
          <div className="skeleton h-48 rounded-xl md:col-span-2" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="skeleton h-64 rounded-xl md:col-span-2" />
          <div className="skeleton h-64 rounded-xl md:col-span-1" />
        </div>
      </div>
    );
  }

  const chartData =
    balances?.balances.map((b) => ({
      name: b.name,
      paid: b.total_paid,
      share: b.total_share,
      net: b.net_balance,
    })) || [];

  const catStackData = breakdown
    ? Object.entries(breakdown.breakdown)
        .filter(([, data]) => data.total > 0)
        .map(([cat, data]) => {
          const row = { category: cat };
          for (const m of members) {
            row[m.name] = data.members[m.id]?.amount || 0;
          }
          return row;
        })
    : [];

  const totalSpending = breakdown
    ? Object.values(breakdown.breakdown).reduce((sum, catData) => sum + catData.total, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl md:text-2xl text-text-dark">
          Dashboard
        </h1>
        <div className="flex gap-1 bg-highlight/30 rounded-xl p-1">
          {timeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTimeFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeFilter === f.value
                  ? "bg-surface text-primary shadow-sm"
                  : "text-text-muted hover:text-text-dark"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Row: Total Spending & Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1 flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-highlight/20 to-surface border border-highlight/50 shadow-sm">
          <p className="text-sm font-medium text-text-muted mb-2 uppercase tracking-wide">Total Spending</p>
          <p className="font-heading font-bold text-4xl md:text-5xl text-text-dark">
            {formatINR(totalSpending, currency)}
          </p>
        </div>
        
        <div className="lg:col-span-2 card bg-highlight/10 shadow-sm">
          <h2 className="font-heading font-semibold text-lg text-text-dark mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary" />
            Net Balances
          </h2>
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:snap-none hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {balances?.balances.map((b) => {
              const maxAbs = Math.max(
                ...balances.balances.map((x) => Math.abs(x.net_balance)),
                1
              );
              const pct = Math.abs(b.net_balance) / maxAbs;
              const isPos = b.net_balance > 0;

              return (
                <motion.div
                  key={b.member_id}
                  variants={expandingCard}
                  whileHover={{ scale: 1.02, backgroundColor: "var(--highlight)" }}
                  layout
                  className="p-4 rounded-xl bg-surface border border-border snap-center min-w-[260px] md:min-w-0 flex-shrink-0 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar member={b} size={32} />
                      <span className="font-medium text-text-dark truncate">{b.name}</span>
                    </div>
                    <span
                      className={`font-mono font-bold text-lg ${
                        isPos ? "text-success" : b.net_balance < 0 ? "text-text-muted" : "text-text-dark"
                      }`}
                    >
                      {isPos ? "+" : ""}
                      {formatINR(b.net_balance, currency)}
                    </span>
                  </div>

                  {/* Visual bar */}
                  <div className="h-1.5 bg-highlight rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct * 100, 100)}%` }}
                      className={`h-full rounded-full ${
                        isPos ? "bg-success" : "bg-border"
                      }`}
                      style={{
                        marginLeft: isPos ? "0" : "auto",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-text-muted font-medium">
                    <span>Paid: {formatINR(b.total_paid, currency)}</span>
                    <span>Share: {formatINR(b.total_share, currency)}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Settlement suggestion */}
          {balances?.settlement_suggestions?.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 rounded-xl bg-success/10 border border-success/30 shadow-sm"
            >
              <span className="font-semibold text-text-dark block mb-3 text-sm">Suggested Settlements</span>
              <div className="flex flex-col gap-2">
              {balances.settlement_suggestions.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-surface/50 p-2 rounded-lg">
                  <span className="text-text-dark"><strong>{s.from}</strong> pays <strong>{s.to}</strong></span>
                  <span className="font-mono font-bold text-success">
                    {formatINR(s.amount, currency)}
                  </span>
                </div>
              ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {totalSpending > 0 ? (
            <>
              {/* Bar chart */}
              {chartData.length > 0 && (
                <div className="card shadow-sm">
                  <h2 className="font-heading font-semibold text-lg text-text-dark mb-6 flex items-center gap-2">
                    <BarChart3 size={18} className="text-primary" />
                    Paid vs Share
                  </h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#C2CBC9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#7E908C" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#7E908C" }} axisLine={false} tickLine={false} tickFormatter={(value) => formatINR(value, currency)} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            backgroundColor: "var(--surface)",
                          }}
                          formatter={(value) => formatINR(value, currency)}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                        <Bar dataKey="paid" name="Paid" fill="#105D5E" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar dataKey="share" name="Fair Share" fill="#009A6E" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Category Breakdown */}
              {catStackData.length > 0 && (
                <div className="card shadow-sm">
                  <h2 className="font-heading font-semibold text-lg text-text-dark mb-6 flex items-center gap-2">
                    <PieChart size={18} className="text-primary" />
                    Category Breakdown
                  </h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={catStackData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#C2CBC9" vertical={false} />
                        <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#7E908C" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#7E908C" }} axisLine={false} tickLine={false} tickFormatter={(value) => formatINR(value, currency)} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            backgroundColor: "var(--surface)",
                          }}
                          formatter={(value) => formatINR(value, currency)}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                        {members.map((m) => (
                          <Bar
                            key={m.id}
                            dataKey={m.name}
                            name={m.name}
                            stackId="a"
                            fill={m.color}
                            radius={[2, 2, 0, 0]}
                            maxBarSize={60}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Insight Cards */}
              {breakdown?.insights?.length > 0 && (
                <div className="card shadow-sm">
                  <h2 className="font-heading font-semibold text-lg text-text-dark mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary" />
                    Insights
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {breakdown.insights.map((insight, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-xl bg-highlight/20 border border-highlight/50"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: getCategoryColor(insight.category) + "20", color: getCategoryColor(insight.category) }}
                        >
                          <CategoryIcon category={{name: insight.category}} size={16} />
                        </div>
                        <p className="text-sm text-text-dark leading-snug">{insight.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center p-12 text-center text-text-muted shadow-sm min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-highlight/30 flex items-center justify-center mb-4">
                <PieChart size={32} className="text-primary opacity-50" />
              </div>
              <p className="font-medium text-text-dark text-lg mb-2">No expenses yet</p>
              <p className="text-sm max-w-sm">Add some expenses to see charts, breakdowns, and who owes what.</p>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          {/* Fairness Score */}
          {fairness && totalSpending > 0 && (
            <div className="card shadow-sm">
              <h2 className="font-heading font-semibold text-lg text-text-dark mb-6 flex items-center gap-2">
                <Target size={18} className="text-primary" />
                Fairness Score
              </h2>

              {/* Group Score */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center mb-2">
                  <span
                    className="font-heading font-bold text-5xl"
                    style={{ color: getFairnessColor(fairness.group_score) }}
                  >
                    {fairness.group_score}
                  </span>
                </div>
                <p className="text-sm font-medium uppercase tracking-wider text-text-muted">Group Score</p>
              </div>

              {/* Per-member scores */}
              <div className="space-y-3">
                {fairness.scores.map((s) => (
                  <motion.div
                    key={s.member_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-2 p-3 rounded-xl bg-highlight/10 border border-highlight/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar member={s} size={24} />
                        <span className="font-medium text-text-dark text-sm truncate">
                          {s.name}
                        </span>
                      </div>
                      <span
                        className="font-heading font-bold"
                        style={{ color: getFairnessColor(s.score) }}
                      >
                        {s.score}
                      </span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.score}%` }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: getFairnessColor(s.score) }}
                      />
                    </div>
                    <p className="text-xs text-text-muted">{s.explanation}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Settlement History */}
          <SettlementHistory />
        </div>
      </div>
    </div>
  );
}

export default function DashboardWrapper(props) {
  return (
    <>
      <SEO title="Dashboard" />
      <Dashboard {...props} />
    </>
  );
}
