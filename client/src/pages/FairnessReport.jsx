import SEO from "../components/SEO";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Share2,
  Calendar,
  TrendingUp,
  AlertCircle,
  ChartColumn,
} from "lucide-react";
import { useGroup } from "../App";
import { getReport } from "../api/client";
import { formatINR as formatCurrency } from "../utils/formatCurrency";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { csvSafe } from "../../../shared/balanceMath";
import Avatar from "../components/Avatar";
// getCategoryColor not currently used in this component

const periodOptions = [
  { label: "All Time", value: "all" },
  { label: "This Month", value: "month" },
  { label: "Last 3 Months", value: "3months" },
  { label: "Last 6 Months", value: "6months" },
];

function getDateRange(filter) {
  const now = new Date();
  switch (filter) {
    case "month":
      return {
        start_date: new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0],
        end_date: now.toISOString().split("T")[0],
      };
    case "3months":
      return {
        start_date: new Date(now.getFullYear(), now.getMonth() - 3, 1)
          .toISOString()
          .split("T")[0],
        end_date: now.toISOString().split("T")[0],
      };
    case "6months":
      return {
        start_date: new Date(now.getFullYear(), now.getMonth() - 6, 1)
          .toISOString()
          .split("T")[0],
        end_date: now.toISOString().split("T")[0],
      };
    default:
      return {};
  }
}

function FairnessReport() {
  useDocumentTitle("Fairness Report");
  const { currentGroup } = useGroup();
  const [period, setPeriod] = useState("all");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const reportRef = useRef(null);

  const loadData = useCallback(() => {
    if (!currentGroup) return;
    setLoading(true);
    setError(null);
    Promise.race([
      getReport(currentGroup.id, getDateRange(period)),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 8000))
    ])
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.message || "Failed to load report."))
      .finally(() => setLoading(false));
  }, [currentGroup, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const handleExportCSV = async () => {
    try {
      const { data: expenses } = await getReport(currentGroup.id, getDateRange(period));
      // getReport was modified to return raw data, but wait, the Expenses are not returned in getReport!
      // I should fetch expenses directly here to get descriptions and amounts for the CSV.
      const { getExpenses } = await import("../api/client");
      const { data: expenseData } = await getExpenses(currentGroup.id, getDateRange(period));
      const { getMembers } = await import("../api/client");
      const members = await getMembers(currentGroup.id);
      const memberMap = Object.fromEntries(members.map(m => [m.id, m.name]));

      let csv = "Date,Category,Description,Amount,Paid By\n";
      for (const e of expenseData) {
        const safeDesc = csvSafe(e.description);
        const safeCat = csvSafe(e.category);
        const safeName = csvSafe(memberMap[e.paidBy] || e.paidBy);
        csv += `${e.createdAt},${safeCat},"${safeDesc.replace(/"/g, '""')}",${e.amount},${safeName}\n`;
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ExpenseFlow-${currentGroup.name}-report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export CSV failed", err);
      setActionError("Failed to export CSV.");
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: `ExpenseFlow Report - ${currentGroup.name}`,
      text: `Check out the fairness report for ${currentGroup.name} on ExpenseFlow!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const categories = report?.category_list || [];

  const gridColumns = ["Member", ...categories, "Total"];

  return (
    <div className="print:bg-white print:text-black">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-xl md:text-2xl text-text-dark print:text-black">
            Fairness Report
          </h1>
          <p className="text-sm text-text-muted print:text-gray-600">
            Auto-generated expense summary for {currentGroup.name}
          </p>
        </div>
        <div className="flex gap-1 bg-highlight/30 rounded-xl p-1 print:hidden">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === opt.value
                  ? "bg-surface text-primary shadow-sm"
                  : "text-text-muted hover:text-text-dark"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded-xl print:hidden">
          {actionError}
        </div>
      )}
      {error ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 print:hidden">
          <p className="text-accent">{error}</p>
          <button onClick={loadData} className="btn-primary">Retry</button>
        </div>
      ) : loading ? (
        <div className="space-y-4 print:hidden">
          <div className="skeleton h-24 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      ) : !report ? (
        <div className="text-center py-16 print:hidden">
          <div className="flex justify-center mb-4"><ChartColumn size={48} className="text-text-muted" /></div>
          <h3 className="font-heading font-semibold text-lg text-text-muted mb-2">
            No data to report
          </h3>
          <p className="text-text-muted text-sm">
            Start adding expenses to see your fairness report.
          </p>
        </div>
      ) : (
        <div className="space-y-6" ref={reportRef}>
          {/* Summary narrative */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card print:border-none print:shadow-none print:p-0"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 print:hidden">
                <FileText size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-text-dark mb-2 print:text-black">
                  Overview
                </h3>
                <p className="text-sm text-text-dark leading-relaxed print:text-black">
                  {report.narrative}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Fairness Overview */}
          <div className="card print:border-none print:shadow-none print:p-0 print:mt-4">
            <h3 className="font-heading font-semibold text-text-dark mb-3 flex items-center gap-2 print:text-black">
              <TrendingUp size={18} className="text-primary print:hidden" />
              Fairness Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
              {report.member_summary?.map((member) => {
                const total = report.total_expenses || 1;
                const pct = Math.round((member.total_paid / total) * 100);
                const fairShare = 100 / (report.members?.length || 1);
                const diff = Math.abs(pct - fairShare);
                const isFair = diff < 10;

                return (
                  <div key={member.name} className="p-3 rounded-xl border border-border text-center flex flex-col items-center print:border-gray-300">
                    <div className="mb-2 print:hidden">
                      <Avatar member={currentGroup.members?.find((m) => m.name === member.name) || {name: member.name}} size={40} />
                    </div>
                    <p className="font-medium text-text-dark text-sm print:text-black">
                      {member.name}
                    </p>
                    <p className="font-mono text-lg font-bold text-text-dark print:text-black">
                      {pct}%
                    </p>
                    <p
                      className={`text-xs ${
                        isFair ? "text-success print:text-gray-600" : "text-accent print:text-black"
                      }`}
                    >
                      {isFair ? "Fair" : `${diff > 20 ? "Off" : "Slightly off"}`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category × Member Grid */}
          {categories.length > 0 && (
            <div className="card print:border-none print:shadow-none print:p-0 print:mt-4">
              <h3 className="font-heading font-semibold text-text-dark mb-3 print:text-black">
                Expense Breakdown
              </h3>
              <table className="w-full text-sm block md:table print:table">
                <thead className="hidden md:table-header-group print:table-header-group">
                  <tr className="border-b border-border print:border-gray-300">
                    {gridColumns.map((col) => (
                      <th
                         key={col}
                         className={`text-left py-2 px-3 text-xs font-medium text-text-muted print:text-black ${
                           col === "Total" ? "text-right" : ""
                         }`}
                      >
                         {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="block md:table-row-group print:table-row-group">
                  {report.member_summary?.map((member) => (
                    <tr key={member.name} className="block md:table-row mb-4 md:mb-0 border-b border-border/50 md:border-b-0 print:border-b-0 pb-2 md:pb-0 print:pb-0">
                      <td className="py-2 px-3 block md:table-cell print:table-cell bg-highlight/10 md:bg-transparent print:bg-transparent mb-1 md:mb-0 rounded md:rounded-none">
                        <div className="flex items-center gap-2">
                          <div className="print:hidden"><Avatar member={currentGroup.members?.find((m) => m.name === member.name) || {name: member.name}} size={20} /></div>
                          <span className="font-medium text-text-dark print:text-black">
                            {member.name}
                          </span>
                        </div>
                      </td>
                      {categories.map((cat) => {
                        const memberEntry = report.category_grid[cat]?.members?.[
                          report.members.find((m) => m.name === member.name)
                            ?.id
                        ];
                        const amount = memberEntry?.amount || 0;
                        return (
                          <td key={cat} className="py-1 px-3 md:py-2 print:py-2 flex md:table-cell print:table-cell justify-between items-center font-mono text-xs border-b border-border/10 md:border-none print:border-none">
                            <span className="md:hidden print:hidden font-sans text-text-muted">{cat}</span>
                            <span className="print:text-black">{amount > 0 ? formatCurrency(amount, currentGroup?.currency) : "-"}</span>
                          </td>
                        );
                      })}
                      <td className="py-1 px-3 md:py-2 print:py-2 flex md:table-cell print:table-cell justify-between items-center font-mono font-semibold md:text-right print:text-right border-t border-border/50 md:border-none print:border-none mt-1 md:mt-0 pt-2">
                        <span className="md:hidden print:hidden font-sans font-medium">Total</span>
                        <span className="print:text-black">{formatCurrency(member.total_paid, currentGroup?.currency)}</span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-surface font-medium block md:table-row print:table-row mt-4 md:mt-0 rounded-xl md:rounded-none p-3 md:p-0 print:bg-transparent print:border-t print:border-gray-300">
                    <td className="py-2 px-3 text-text-dark text-xs block md:table-cell print:table-cell text-center md:text-left mb-2 md:mb-0 print:text-black">Group Totals</td>
                    {categories.map((cat) => (
                      <td key={cat} className="py-1 px-3 md:py-2 print:py-2 flex md:table-cell print:table-cell justify-between items-center font-mono text-xs border-b border-border/20 md:border-none print:border-none">
                        <span className="md:hidden print:hidden font-sans text-text-muted">{cat}</span>
                        <span className="print:text-black">{formatCurrency(report.category_grid[cat]?.total || 0, currentGroup?.currency)}</span>
                      </td>
                    ))}
                    <td className="py-2 px-3 flex md:table-cell print:table-cell justify-between items-center font-mono md:text-right print:text-right border-t border-border/30 md:border-none print:border-none mt-2 md:mt-0 pt-2 print:text-black">
                      <span className="md:hidden print:hidden font-sans font-medium">Grand Total</span>
                      <span>{formatCurrency(report.total_expenses, currentGroup?.currency)}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Settlement plan */}
          {report.settlement_plan?.length > 0 && (
            <div className="card border border-border print:border-none print:shadow-none print:p-0 print:mt-4">
              <h3 className="font-heading font-semibold text-text-dark mb-3 print:text-black">
                Settlement Plan
              </h3>
              <div className="space-y-2">
                {report.settlement_plan.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border print:border-gray-300 print:bg-transparent"
                  >
                    <span className="text-sm text-text-dark print:text-black">
                      <strong>{s.from}</strong> pays <strong>{s.to}</strong>
                    </span>
                    <span className="font-mono font-bold text-text-dark print:text-black">
                      {formatCurrency(s.amount, currentGroup?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export buttons */}
          <div className="flex flex-wrap gap-3 print:hidden">
            <button onClick={handleExportPDF} className="btn-primary">
              <Download size={16} />
              Download PDF
            </button>
            <button onClick={handleExportCSV} className="btn-secondary">
              <Download size={16} />
              Download CSV
            </button>
            <button onClick={handleShare} className="btn-ghost">
              <Share2 size={16} />
              Share Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export default function FairnessReportWrapper(props) {
  return (
    <>
      <SEO title="FairnessReport" />
      <FairnessReport {...props} />
    </>
  );
}
