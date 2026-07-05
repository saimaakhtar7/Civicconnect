import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, getDocs, limit } from "firebase/firestore";
import { db } from "../../config/firebase";
import { IssueDocument } from "../../types/issue.types";
import { 
  Search, X, Loader2, MapPin, Building, ArrowUpRight, 
  Shield, MessageSquare, Calendar, User, Clock, Trash2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Loaded database snapshots for search indexing
  const [issues, setIssues] = useState<IssueDocument[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [results, setResults] = useState<{
    issues: IssueDocument[];
    departments: { name: string; count: number }[];
    locations: string[];
    discussions: any[];
    events: any[];
    users: any[];
  }>({ issues: [], departments: [], locations: [], discussions: [], events: [], users: [] });

  // Load datasets and recent searches
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    // Load recent searches from localStorage
    const saved = localStorage.getItem("civic_recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        setRecentSearches([]);
      }
    }

    const loadAll = async () => {
      try {
        // Query issues
        const snapIssues = await getDocs(query(collection(db, "issues"), limit(60)));
        const listIssues = snapIssues.docs.map((d) => ({ id: d.id, ...d.data() })) as IssueDocument[];
        setIssues(listIssues);

        // Query discussions
        const snapDisc = await getDocs(query(collection(db, "discussions"), limit(30)));
        const listDisc = snapDisc.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDiscussions(listDisc);

        // Query events
        const snapEv = await getDocs(query(collection(db, "events"), limit(30)));
        const listEv = snapEv.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvents(listEv);

        // Query users
        const snapUsr = await getDocs(query(collection(db, "users"), limit(40)));
        const listUsr = snapUsr.docs.map((d) => ({ uid: d.id, ...d.data() }));
        setUsersList(listUsr);
      } catch (err) {
        console.error("Fuzzy Search pre-load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [isOpen]);

  // Fuzzy Search filter mapping
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults({ issues: [], departments: [], locations: [], discussions: [], events: [], users: [] });
      return;
    }

    const term = searchTerm.toLowerCase();

    // 1. Filter Issues
    const matchedIssues = issues.filter((issue) => {
      return (
        issue.aiAnalysis?.subcategory?.toLowerCase().includes(term) ||
        issue.userDescription?.toLowerCase().includes(term) ||
        issue.location?.address?.toLowerCase().includes(term) ||
        issue.aiAnalysis?.category?.toLowerCase().includes(term) ||
        issue.id.toLowerCase().includes(term)
      );
    });

    // 2. Filter Departments
    const deptMap = new Map<string, number>();
    issues.forEach((issue) => {
      const dept = issue.routing?.primaryDepartment;
      if (dept && dept.toLowerCase().includes(term)) {
        deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
      }
    });
    const matchedDepts = Array.from(deptMap.entries()).map(([name, count]) => ({ name, count }));

    // 3. Filter Locations
    const wardSet = new Set<string>();
    issues.forEach((issue) => {
      const ward = issue.location?.ward;
      if (ward && ward.toLowerCase().includes(term)) {
        wardSet.add(ward);
      }
    });

    // 4. Filter Discussions
    const matchedDiscussions = discussions.filter((disc) => {
      return (
        disc.title?.toLowerCase().includes(term) ||
        disc.content?.toLowerCase().includes(term) ||
        disc.authorName?.toLowerCase().includes(term) ||
        disc.tags?.some((t: string) => t.toLowerCase().includes(term))
      );
    });

    // 5. Filter Events
    const matchedEvents = events.filter((ev) => {
      return (
        ev.title?.toLowerCase().includes(term) ||
        ev.description?.toLowerCase().includes(term) ||
        ev.locationName?.toLowerCase().includes(term)
      );
    });

    // 6. Filter Users (officials/citizens)
    const matchedUsers = usersList.filter((u) => {
      return (
        u.displayName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.locality?.toLowerCase().includes(term) ||
        u.role?.toLowerCase().includes(term)
      );
    });

    setResults({
      issues: matchedIssues.slice(0, 4),
      departments: matchedDepts.slice(0, 3),
      locations: Array.from(wardSet).slice(0, 3),
      discussions: matchedDiscussions.slice(0, 3),
      events: matchedEvents.slice(0, 3),
      users: matchedUsers.slice(0, 3)
    });
  }, [searchTerm, issues, discussions, events, usersList]);

  // Save selection search to recent
  const saveRecentSearch = (term: string) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s !== clean)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("civic_recent_searches", JSON.stringify(updated));
  };

  const handleSelectIssue = (id: string) => {
    saveRecentSearch(searchTerm || id);
    onClose();
    navigate(`/app/issues/${id}`);
  };

  const handleSelectDiscussion = () => {
    saveRecentSearch(searchTerm);
    onClose();
    navigate("/app/community");
  };

  const handleSelectEvent = () => {
    saveRecentSearch(searchTerm);
    onClose();
    navigate("/app/events");
  };

  const handleClearRecent = (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    localStorage.setItem("civic_recent_searches", JSON.stringify(updated));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center pt-[10vh] px-4 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-[#1E293B] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-left"
            >
              {/* Search Bar Input */}
              <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-[#172030]">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search issues, events, departments, users, discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none ring-0 text-sm font-semibold text-white placeholder-gray-400"
                />
                {loading ? (
                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />
                ) : (
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results Lists */}
              <div className="flex-1 max-h-[60vh] overflow-y-auto p-4 space-y-4 text-xs text-[#9AA3B8] font-medium">
                {/* Recent Searches */}
                {!searchTerm.trim() && (
                  <div className="space-y-3">
                    {recentSearches.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider block">Recent Search Terms</span>
                        <div className="space-y-1">
                          {recentSearches.map((term) => (
                            <div key={term} className="flex items-center justify-between p-2 bg-[#0F172A] hover:bg-white/[0.02] border border-white/5 rounded-xl">
                              <button
                                onClick={() => setSearchTerm(term)}
                                className="flex items-center gap-2 text-white font-bold flex-1 text-left cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                                {term}
                              </button>
                              <button onClick={() => handleClearRecent(term)} className="text-[#6B7280] hover:text-white p-0.5">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-center py-6">
                      <Shield className="w-7 h-7 text-[#6B7280]/20 mx-auto mb-2" />
                      <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider">Fuzzy Search Index</p>
                      <p className="text-[11px] mt-0.5">Fuzzy autocomplete is live. Type key terms above.</p>
                    </div>
                  </div>
                )}

                {searchTerm.trim() &&
                  results.issues.length === 0 &&
                  results.departments.length === 0 &&
                  results.locations.length === 0 &&
                  results.discussions.length === 0 &&
                  results.events.length === 0 &&
                  results.users.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-xs font-semibold">No records match your query.</p>
                    </div>
                  )}

                {searchTerm.trim() && (
                  <>
                    {/* Wards/Locations */}
                    {results.locations.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider block">Locations / Wards</span>
                        <div className="flex flex-wrap gap-1.5">
                          {results.locations.map((ward) => (
                            <button
                              key={ward}
                              onClick={() => {
                                saveRecentSearch(ward);
                                onClose();
                                navigate("/app/map");
                              }}
                              className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-white/[0.02] border border-white/5 rounded-xl px-2.5 py-1 text-xs text-white cursor-pointer font-bold"
                            >
                              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                              {ward}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Departments */}
                    {results.departments.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider block">Departments</span>
                        <div className="space-y-1">
                          {results.departments.map((dept) => (
                            <div
                              key={dept.name}
                              className="flex items-center justify-between bg-blue-500/5 border border-blue-500/10 rounded-xl px-3 py-2 text-xs font-semibold text-white"
                            >
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-blue-400" />
                                <span>{dept.name}</span>
                              </div>
                              <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {dept.count} incident{dept.count !== 1 ? "s" : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Events */}
                    {results.events.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider block">Civic Events</span>
                        <div className="space-y-1">
                          {results.events.map((ev) => (
                            <button
                              key={ev.id}
                              onClick={handleSelectEvent}
                              className="w-full flex items-center justify-between p-2.5 bg-[#0F172A] border border-white/5 rounded-xl hover:bg-white/[0.02] text-left cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-white block leading-tight">{ev.title}</span>
                                <span className="text-[10px] text-[#6B7280] mt-0.5 block">{ev.locationName}</span>
                              </div>
                              <Calendar className="w-4 h-4 text-emerald-400 shrink-0 ml-3" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Discussions */}
                    {results.discussions.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider block">Community Discussions</span>
                        <div className="space-y-1">
                          {results.discussions.map((disc) => (
                            <button
                              key={disc.id}
                              onClick={handleSelectDiscussion}
                              className="w-full flex items-center justify-between p-2.5 bg-[#0F172A] border border-white/5 rounded-xl hover:bg-white/[0.02] text-left cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-white block leading-tight">{disc.title}</span>
                                <span className="text-[10px] text-[#6B7280] mt-0.5 block">Author: {disc.authorName}</span>
                              </div>
                              <MessageSquare className="w-4 h-4 text-purple-400 shrink-0 ml-3" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Users (Officials / Citizens) */}
                    {results.users.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider block">Members &amp; Officials</span>
                        <div className="space-y-1">
                          {results.users.map((usr) => (
                            <div
                              key={usr.uid}
                              className="flex items-center justify-between p-2 bg-[#0F172A] border border-white/5 rounded-xl"
                            >
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-400 shrink-0" />
                                <div>
                                  <span className="text-xs font-bold text-white block">{usr.displayName}</span>
                                  <span className="text-[10px] text-[#6B7280] mt-0.5 block">{usr.email}</span>
                                </div>
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                usr.role === "admin" || usr.role === "official" ? "bg-emerald-500/10 text-emerald-400" : "bg-purple-500/10 text-purple-400"
                              }`}>
                                {usr.role || "citizen"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Incidents (Issues) */}
                    {results.issues.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider block">Incidents</span>
                        <div className="space-y-1">
                          {results.issues.map((issue) => (
                            <button
                              key={issue.id}
                              onClick={() => handleSelectIssue(issue.id)}
                              className="w-full flex items-center justify-between p-2.5 bg-[#0F172A] border border-white/5 rounded-xl hover:bg-white/[0.02] text-left cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-white block leading-tight">
                                  {issue.aiAnalysis?.subcategory || "Civic Incident"}
                                </span>
                                <span className="text-[10px] text-[#6B7280] mt-0.5 block truncate">
                                  {issue.location?.address}
                                </span>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0 ml-3" />
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
