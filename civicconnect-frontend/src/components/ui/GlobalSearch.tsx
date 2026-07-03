import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, getDocs, limit } from "firebase/firestore";
import { db } from "../../config/firebase";
import { IssueDocument } from "../../types/issue.types";
import { Search, X, Loader2, MapPin, Building, ArrowUpRight, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<IssueDocument[]>([]);
  const [results, setResults] = useState<{
    issues: IssueDocument[];
    departments: { name: string; count: number }[];
    locations: string[];
  }>({ issues: [], departments: [], locations: [] });
  const navigate = useNavigate();

  // Load all issues initially for local searching
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const issuesRef = collection(db, "issues");
    getDocs(query(issuesRef, limit(100)))
      .then((snap) => {
        const list: IssueDocument[] = [];
        snap.forEach((doc) => list.push(doc.data() as IssueDocument));
        setIssues(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Search fetch failed:", err);
        setLoading(false);
      });
  }, [isOpen]);

  // Handle local filtering
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults({ issues: [], departments: [], locations: [] });
      return;
    }

    const term = searchTerm.toLowerCase();

    // Match issues
    const matchedIssues = issues.filter((issue) => {
      return (
        issue.aiAnalysis?.subcategory?.toLowerCase().includes(term) ||
        issue.userDescription?.toLowerCase().includes(term) ||
        issue.location?.address?.toLowerCase().includes(term) ||
        issue.aiAnalysis?.category?.toLowerCase().includes(term) ||
        issue.routing?.primaryDepartment?.toLowerCase().includes(term) ||
        issue.id.toLowerCase().includes(term)
      );
    });

    // Match departments
    const deptMap = new Map<string, number>();
    issues.forEach((issue) => {
      const dept = issue.routing?.primaryDepartment;
      if (dept && dept.toLowerCase().includes(term)) {
        deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
      }
    });
    const matchedDepts = Array.from(deptMap.entries()).map(([name, count]) => ({ name, count }));

    // Match locations (wards)
    const wardSet = new Set<string>();
    issues.forEach((issue) => {
      const ward = issue.location?.ward;
      if (ward && ward.toLowerCase().includes(term)) {
        wardSet.add(ward);
      }
    });

    setResults({
      issues: matchedIssues.slice(0, 5),
      departments: matchedDepts,
      locations: Array.from(wardSet).slice(0, 3),
    });
  }, [searchTerm, issues]);

  const handleSelectIssue = (id: string) => {
    onClose();
    navigate(`/issues/${id}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs" onClick={onClose} />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center pt-[10vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
            >
              {/* Input Bar */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search issues, departments, locations, AI logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-0 ring-0 text-sm font-medium text-gray-900 placeholder-gray-400"
                />
                {loading ? (
                  <Loader2 className="w-4 h-4 text-civic-blue animate-spin" />
                ) : (
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="flex-1 max-h-[60vh] overflow-y-auto p-4 space-y-4">
                {!searchTerm.trim() ? (
                  <div className="text-center py-8 text-gray-400">
                    <Shield className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-500">Global Civic Directory</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Type to search records, departments, and logs.</p>
                  </div>
                ) : results.issues.length === 0 &&
                  results.departments.length === 0 &&
                  results.locations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-xs font-semibold">No records match your query.</p>
                  </div>
                ) : (
                  <>
                    {/* Wards/Locations */}
                    {results.locations.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Locations / Wards</h4>
                        <div className="flex flex-wrap gap-2">
                          {results.locations.map((ward) => (
                            <button
                              key={ward}
                              onClick={() => {
                                onClose();
                                navigate("/map"); // Can pan/filter maps on this ward
                              }}
                              className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors"
                            >
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              {ward}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Departments */}
                    {results.departments.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Departments</h4>
                        <div className="space-y-1">
                          {results.departments.map((dept) => (
                            <div
                              key={dept.name}
                              className="flex items-center justify-between bg-blue-50/30 border border-blue-100 rounded-xl px-3 py-2 text-xs font-semibold text-blue-900"
                            >
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-blue-500" />
                                <span>{dept.name}</span>
                              </div>
                              <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full">
                                {dept.count} report{dept.count !== 1 ? "s" : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Issues */}
                    {results.issues.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Issues & Deliberations</h4>
                        <div className="space-y-1">
                          {results.issues.map((issue) => (
                            <button
                              key={issue.id}
                              onClick={() => handleSelectIssue(issue.id)}
                              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 text-left transition-all"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {issue.aiAnalysis?.subcategory || "Civic Issue"}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                  {issue.location?.address}
                                </p>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-gray-300 shrink-0 ml-3" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;
