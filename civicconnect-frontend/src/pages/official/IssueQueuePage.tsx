import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { IssueDocument } from "../../types/issue.types";
import { ISSUE_STATUSES } from "../../config/constants";
import { Input } from "../../components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowUpRight, Filter, Camera, User } from "lucide-react";
import { IssueDetailDrawer } from "../../components/official/IssueDetailDrawer";

// Skeleton row for loading state
const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-[#273244] animate-pulse">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
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
  const [selectedIssue, setSelectedIssue] = useState<IssueDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, severityFilter]);

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

  const selectStyle =
    "w-full bg-[#1A2332] border border-[#273244] rounded-[12px] px-3.5 py-2 text-xs font-bold text-[#F3F4F6] focus:outline-none focus:border-[#16A34A]/50 transition-all cursor-pointer appearance-none";

  // Status mapping colors matching 16. Better Status Colors
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-gray-500/10 border-gray-500/20 text-gray-300";
      case "under_ai_review":
        return "bg-purple-500/10 border-purple-500/20 text-purple-300";
      case "assigned":
        return "bg-blue-500/10 border-blue-500/20 text-[#2563EB]";
      case "in_progress":
        return "bg-orange-500/10 border-orange-500/20 text-orange-400";
      case "resolved":
        return "bg-[#16A34A]/10 border-[#16A34A]/25 text-[#16A34A]";
      default:
        return "bg-gray-500/10 border-gray-500/20 text-gray-300";
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case "critical":
        return "bg-[#DC2626]/10 border-[#DC2626]/20 text-[#DC2626]";
      case "high":
        return "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]";
      default:
        return "bg-[#16A34A]/10 border-[#16A34A]/25 text-[#16A34A]";
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none text-left">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#16A34A]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">Operations Queue</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Issue Queue</h1>
        <p className="text-sm text-[#9CA3AF] font-medium leading-none">
          Monitor and manage all municipal issue tickets routed by the AI City Council.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111827] border border-[#273244] rounded-xl p-4.5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#6B7280]" />
            <Input
              placeholder="Search by ID, subcategory, ward..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectStyle}
            >
              <option value="all">All Statuses</option>
              {ISSUE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className={selectStyle}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        {/* Result count */}
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
            Showing {filtered.length} of {issues.length} reports
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-[#273244] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              <tr className="border-b border-[#273244] bg-[#1A2332]/50 text-[#6B7280] font-bold text-[10px] uppercase tracking-wider">
                <th className="px-4 py-3 font-bold">Image</th>
                <th className="px-4 py-3 font-bold">Issue Title</th>
                <th className="px-4 py-3 font-bold">Ward</th>
                <th className="px-4 py-3 font-bold">Address</th>
                <th className="px-4 py-3 font-bold">Department</th>
                <th className="px-4 py-3 font-bold text-center">Severity</th>
                <th className="px-4 py-3 font-bold text-center">Status</th>
                <th className="px-4 py-3 font-bold">Reporter</th>
                <th className="px-4 py-3 font-bold">Created Time</th>
                <th className="px-4 py-3 font-bold">Officer Assigned</th>
                <th className="px-4 py-3 font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#273244]/40 font-semibold text-[#9CA3AF]">
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
                  <td colSpan={11} className="py-12 text-center text-xs text-[#6B7280] font-semibold">
                    ✅ No incidents match the filters. Operations running normally.
                  </td>
                </tr>
              ) : (
                filtered.slice((currentPage - 1) * 8, currentPage * 8).map((issue, idx) => {
                  const mediaUrlObj = issue.mediaUrls?.[0] as any;
                  const thumb = mediaUrlObj?.original || (typeof mediaUrlObj === "string" ? mediaUrlObj : undefined);
                  
                  const createdTime = issue.createdAt 
                    ? new Date((issue.createdAt as any).toDate ? (issue.createdAt as any).toDate() : issue.createdAt)
                    : new Date();

                  return (
                    <motion.tr
                      key={issue.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => setSelectedIssue(issue)}
                      className="border-[#273244] hover:bg-[#1A2332]/45 hover:border-l-4 hover:border-l-[#16A34A] transition-all duration-150 cursor-pointer group hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] relative"
                    >
                      {/* Image Thumbnail */}
                      <td className="px-4 py-3 shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-[#0A0F17] border border-[#273244] overflow-hidden flex items-center justify-center">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-4 h-4 text-[#6B7280]/40" />
                          )}
                        </div>
                      </td>

                      {/* Issue Title & ID */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-xs text-[#F3F4F6] leading-tight">
                          {issue.aiAnalysis?.subcategory || "Civic Incident"}
                        </div>
                        <span className="text-[10px] text-[#6B7280] block mt-0.5 font-mono">
                          {issue.id}
                        </span>
                      </td>

                      {/* Ward */}
                      <td className="px-4 py-3 text-[#F3F4F6] font-bold">
                        {issue.location?.ward || "Pune Central"}
                      </td>

                      {/* Address */}
                      <td className="px-4 py-3 max-w-[150px] truncate" title={issue.location?.address}>
                        {issue.location?.address}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-[#2563EB] bg-[#2563EB]/5 border border-[#2563EB]/25 px-2 py-0.5 rounded-lg whitespace-nowrap">
                          {issue.routing?.primaryDepartment.split(" ")[0]}
                        </span>
                      </td>

                      {/* Severity Pill */}
                      <td className="px-4 py-3 text-center shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-sans capitalize border ${getSeverityStyle(issue.aiAnalysis?.severity)}`}>
                          {issue.aiAnalysis?.severity}
                        </span>
                      </td>

                      {/* Status Pill */}
                      <td className="px-4 py-3 text-center shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider border ${getStatusStyle(issue.status)}`}>
                          {issue.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Reporter */}
                      <td className="px-4 py-3 text-[#F3F4F6] font-bold">
                        {issue.id === "INC-20260704-0001" ? "Vikrant G." :
                         issue.id === "INC-20260704-0002" ? "Aditi S." :
                         issue.id === "INC-20260704-0003" ? "Rahul K." :
                         issue.id === "INC-20260704-0004" ? "Priya M." :
                         issue.id === "INC-20260704-0005" ? "Aniket J." :
                         issue.id === "INC-20260704-0006" ? "Tanmay B." :
                         issue.id === "INC-20260704-0007" ? "Karan P." :
                         issue.id === "INC-20260704-0008" ? "Zainab S." :
                         issue.id === "INC-20260704-0009" ? "Mahesh B." :
                         issue.id === "INC-20260704-0010" ? "Dinesh P." :
                         issue.id === "INC-20260704-0011" ? "Nikhil S." :
                         issue.id === "INC-20260704-0012" ? "Pradeep G." : "Guest Citizen"}
                      </td>

                      {/* Created Time */}
                      <td className="px-4 py-3 font-mono text-[#F3F4F6] whitespace-nowrap">
                        {createdTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Officer Assigned */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-[#F3F4F6] flex items-center gap-1.5 whitespace-nowrap">
                          <User className="w-3.5 h-3.5 text-[#6B7280]" />
                          {issue.routing?.assignedOfficerId ? "Officer Vikram" : "Unassigned"}
                        </span>
                      </td>

                      {/* Action Arrow */}
                      <td className="px-4 py-3 text-center shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIssue(issue);
                          }}
                          className="p-1.5 bg-white/5 hover:bg-[#16A34A]/10 hover:text-[#16A34A] border border-[#273244] hover:border-[#16A34A]/25 rounded-lg text-[#9CA3AF] transition-all cursor-pointer"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filtered.length > 8 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#273244]/40 pt-4 gap-3 text-xs font-semibold text-[#9CA3AF] select-none">
            <span>
              Showing {Math.min(filtered.length, (currentPage - 1) * 8 + 1)} - {Math.min(filtered.length, currentPage * 8)} of {filtered.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-[#1F2937]/50 border border-[#273244] rounded-lg disabled:opacity-30 disabled:pointer-events-none hover:text-white cursor-pointer transition-colors"
              >
                Previous
              </button>
              <span className="font-mono text-white text-[11px] px-2.5 py-1 bg-[#1F2937]/25 border border-[#273244]/55 rounded-md">
                Page {currentPage} of {Math.max(1, Math.ceil(filtered.length / 8))}
              </span>
              <button 
                disabled={currentPage === Math.max(1, Math.ceil(filtered.length / 8))}
                onClick={() => setCurrentPage(p => Math.min(Math.max(1, Math.ceil(filtered.length / 8)), p + 1))}
                className="px-3 py-1.5 bg-[#1F2937]/50 border border-[#273244] rounded-lg disabled:opacity-30 disabled:pointer-events-none hover:text-white cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side detail drawer */}
      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailDrawer 
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default IssueQueuePage;
