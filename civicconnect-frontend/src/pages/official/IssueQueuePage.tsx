import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { IssueDocument } from "../../types/issue.types";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { ISSUE_STATUSES } from "../../config/constants";
import { Input } from "../../components/ui/input";
import { motion } from "framer-motion";
import { Search, ArrowUpRight, ShieldAlert, Clock, Filter } from "lucide-react";

// Skeleton row for loading state
const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-white/5 animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-3 w-full bg-white/5 rounded" />
      </td>
    ))}
  </tr>
);

export const IssueQueuePage: React.FC = () => {
  const [issues, setIssues] = useState<IssueDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: IssueDocument[] = [];
      snap.forEach((doc) => list.push(doc.data() as IssueDocument));
      setIssues(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = issues.filter((issue) => {
    const matchesSearch =
      issue.aiAnalysis?.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.location?.ward?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.routing?.primaryDepartment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || issue.aiAnalysis?.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const severityLevelMap = { critical: 0, high: 1, medium: 2, low: 3 };

  const selectStyle =
    "w-full bg-white/5 border border-white/10 rounded-[12px] px-3 py-2.5 text-sm font-semibold text-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 focus:border-[#22C55E]/50 transition-all cursor-pointer appearance-none";

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Operations Queue</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Issue Queue</h1>
        <p className="text-sm text-[#9AA3B8] font-medium">
          Monitor and manage all municipal issue tickets routed by the AI City Council.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#9AA3B8]" />
            <Input
              placeholder="Search by ID, subcategory, ward..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectStyle}
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <option value="all">All Statuses</option>
            {ISSUE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className={selectStyle}
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        {/* Result count */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#9AA3B8]">
            Showing {filtered.length} of {issues.length} reports
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1E293B] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {["Issue Details", "Ward / Address", "Assigned Dept", "Status & Severity", "SLA Deadline", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-[#9AA3B8] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-[#9AA3B8] font-medium">
                    No reports matching active filters.
                  </td>
                </tr>
              ) : (
                filtered.map((issue, idx) => {
                  const level = severityLevelMap[issue.aiAnalysis?.severity as keyof typeof severityLevelMap] ?? 2;
                  const statusMeta = ISSUE_STATUSES.find((s) => s.value === issue.status);
                  const isSlaBreached = issue.priority?.slaDeadline
                    ? new Date(
                        (issue.priority.slaDeadline as any).toDate
                          ? (issue.priority.slaDeadline as any).toDate()
                          : issue.priority.slaDeadline
                      ).getTime() < Date.now() &&
                      issue.status !== "resolved" &&
                      issue.status !== "closed"
                    : false;

                  return (
                    <motion.tr
                      key={issue.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Issue Details */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-xs text-white leading-snug">
                          {issue.aiAnalysis?.subcategory || "Civic Issue"}
                        </div>
                        <span className="text-[9px] text-[#9AA3B8] block mt-0.5 font-mono">
                          #{issue.id.slice(0, 8)}
                        </span>
                      </td>

                      {/* Ward / Address */}
                      <td className="px-4 py-4">
                        <div className="text-xs text-[#F5F7FA] font-semibold">{issue.location?.ward}</div>
                        <span className="text-[10px] text-[#9AA3B8] block truncate max-w-[160px]">
                          {issue.location?.address}
                        </span>
                      </td>

                      {/* Assigned Department */}
                      <td className="px-4 py-4">
                        <div className="text-xs font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-xl inline-block whitespace-nowrap">
                          {issue.routing?.primaryDepartment || "Unassigned"}
                        </div>
                      </td>

                      {/* Status & Severity */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <SeverityBadge level={level as any} />
                          {statusMeta && (
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusMeta.color}`}>
                              {statusMeta.label}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* SLA Deadline */}
                      <td className="px-4 py-4">
                        {issue.priority?.slaDeadline ? (
                          <div className={`text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${isSlaBreached ? "text-red-400" : "text-[#9AA3B8]"}`}>
                            {isSlaBreached ? (
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                            )}
                            {new Date(
                              (issue.priority.slaDeadline as any).toDate
                                ? (issue.priority.slaDeadline as any).toDate()
                                : issue.priority.slaDeadline
                            ).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        ) : (
                          <span className="text-xs text-[#9AA3B8]/40 font-bold">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => navigate(`/dashboard/issues/${issue.id}`)}
                          className="p-2 bg-white/5 hover:bg-[#22C55E]/10 hover:text-[#22C55E] border border-white/5 hover:border-[#22C55E]/20 rounded-xl text-[#9AA3B8] transition-all cursor-pointer group-hover:opacity-100"
                          title="View Issue"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IssueQueuePage;
