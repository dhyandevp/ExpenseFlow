import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useGroup } from "../App";
import { getFairnessTrend, snapshotFairness } from "../api/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function FairnessTrend() {
  const { currentGroup } = useGroup();
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!currentGroup) return;
    loadTrend();
  }, [currentGroup]);

  const loadTrend = async () => {
    try {
      // Take a snapshot for the current month if none exists
      await snapshotFairness(currentGroup.id);

      const res = await getFairnessTrend(currentGroup.id);
      const months = res.data;

      if (months.length === 0) {
        setLoading(false);
        return;
      }

      // Collect unique members
      const memberSet = new Map();
      for (const m of months) {
        for (const mem of m.members) {
          memberSet.set(mem.member_id, { name: mem.name, color: mem.color, emoji: mem.emoji });
        }
      }
      setMembers(Array.from(memberSet.entries()).map(([id, data]) => ({ id, ...data })));

      // Transform for Recharts: { month, member1_score, member2_score, ... }
      const chartData = months.map((m) => {
        const point = {
          month: new Date(m.month + "-01").toLocaleDateString("en-IN", {
            month: "short",
            year: "2-digit",
          }),
        };
        for (const mem of m.members) {
          point[mem.name] = mem.score;
        }
        return point;
      });

      setTrendData(chartData);
    } catch (err) {
      console.error("Failed to load fairness trend:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentGroup) return null;

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-6 w-40 mb-4" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  if (trendData.length < 2) {
    return (
      <div className="card">
        <h3 className="font-heading font-semibold text-text-dark mb-2 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          Fairness Trend
        </h3>
        <p className="text-sm text-text-muted">
          Trend data will appear here after 2+ months of activity. Keep logging expenses!
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <h3 className="font-heading font-semibold text-text-dark mb-3 flex items-center gap-2">
        <TrendingUp size={18} className="text-primary" />
        Fairness Trend
      </h3>
      <p className="text-xs text-text-muted mb-4">
        Per-member fairness scores over time. 100 = perfectly fair.
      </p>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#C2CBC9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                fontSize: 12,
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
            />
            {members.map((m) => (
              <Line
                key={m.id}
                type="monotone"
                dataKey={m.name}
                stroke={m.color || "#009A6E"}
                strokeWidth={2}
                dot={{ r: 4, fill: m.color || "#009A6E" }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
