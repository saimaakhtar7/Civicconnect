import React, { useState, useEffect } from "react";
import { 
  Users, Search, Ban, 
  Trash2, Sliders, Clock, Filter, AlertTriangle, RefreshCw
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { adminService } from "../../services/adminService";
import { UserDocument, UserRole } from "../../types/user.types";
import { Button } from "../../components/ui/button";
import { useNotificationStore } from "../../stores/notificationStore";

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("displayName");

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: "role" | "suspend" | "delete";
    targetUser: UserDocument | null;
    nextRole?: UserRole;
    suspendState?: boolean;
  }>({
    show: false,
    type: "role",
    targetUser: null
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      addNotification({
        type: "error",
        title: "Load Users Failed",
        message: "Could not fetch user accounts list from database."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter & Sort Logic
  const filteredUsers = users
    .filter((u) => {
      const matchSearch = 
        u.displayName.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "All" || u.role === roleFilter;
      
      const isSuspended = (u as any).isSuspended || false;
      const statusFilter = "All";
      const matchStatus = 
        statusFilter === "All" || 
        (statusFilter === "Suspended" && isSuspended) || 
        (statusFilter === "Active" && !isSuspended);

      return matchSearch && matchRole && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "reputation") return (b.reputation || 0) - (a.reputation || 0);
      if (sortBy === "volunteerHours") return (b.volunteerHours || 0) - (a.volunteerHours || 0);
      return a.displayName.localeCompare(b.displayName);
    });

  // Action execution
  const executeAction = async () => {
    const { type, targetUser, nextRole, suspendState } = confirmModal;
    if (!targetUser || !currentUser) return;

    try {
      if (type === "role" && nextRole) {
        // Optimistic UI update
        setUsers((prev) =>
          prev.map((u) => (u.uid === targetUser.uid ? { ...u, role: nextRole } : u))
        );
        await adminService.updateUserRole(targetUser.uid, nextRole, currentUser.uid, currentUser.role);
        addNotification({
          type: "success",
          title: "Role Updated",
          message: `${targetUser.displayName} promoted/demoted to ${nextRole} successfully.`
        });
      } else if (type === "suspend" && suspendState !== undefined) {
        // Optimistic UI update
        setUsers((prev) =>
          prev.map((u) => (u.uid === targetUser.uid ? { ...u, isSuspended: suspendState } as any : u))
        );
        await adminService.suspendUser(targetUser.uid, suspendState, currentUser.uid, currentUser.role);
        addNotification({
          type: "success",
          title: suspendState ? "Account Suspended" : "Account Reactivated",
          message: `${targetUser.displayName}'s account status has been updated.`
        });
      } else if (type === "delete") {
        if (targetUser.uid === currentUser.uid) {
          throw new Error("You cannot delete your own account!");
        }
        // Optimistic UI update
        setUsers((prev) => prev.filter((u) => u.uid !== targetUser.uid));
        await adminService.deleteUser(targetUser.uid, currentUser.uid, currentUser.role);
        addNotification({
          type: "warning",
          title: "Account Deleted",
          message: `Permanently removed account for ${targetUser.displayName}.`
        });
      }
    } catch (err: any) {
      console.error(err);
      addNotification({
        type: "error",
        title: "Action Failed",
        message: err.message || "Failed to commit Firestore transaction write."
      });
      fetchUsers(); // Rollback / sync state on failure
    } finally {
      setConfirmModal({ show: false, type: "role", targetUser: null });
    }
  };

  return (
    <div className="space-y-6 pb-28 text-left relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Security Access Controls</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">User Management</h1>
          <p className="text-xs text-[#9AA3B8]">
            Configure roles, audit user reputation, issue warnings, and manage account suspensions.
          </p>
        </div>
        <Button onClick={fetchUsers} className="bg-white/5 border border-white/5 text-xs font-bold text-white hover:bg-white/10 shrink-0 self-start sm:self-center">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reload Directory
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1E293B] border border-white/5 p-4 rounded-2xl shadow-md flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#9AA3B8]" />
          <input
            type="text"
            placeholder="Search citizens by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0F172A] border border-white/5 text-xs text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-sans font-medium"
          />
        </div>

        <div className="flex gap-2 flex-wrap w-full md:w-auto shrink-0 justify-end">
          <div className="flex items-center gap-2 bg-[#0F172A] border border-white/5 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer uppercase"
            >
              <option value="All">All Roles</option>
              <option value="citizen">Citizen</option>
              <option value="official">Official</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#0F172A] border border-white/5 px-3 py-1.5 rounded-xl text-xs">
            <Sliders className="w-3.5 h-3.5 text-[#6B7280]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer uppercase"
            >
              <option value="displayName">Sort: Alphabetical</option>
              <option value="reputation">Sort: Reputation</option>
              <option value="volunteerHours">Sort: Vol. Hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-12 text-center text-xs text-[#9AA3B8] font-bold">
          <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-[#16A34A]" /> Querying user accounts directory...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-12 text-center text-xs text-[#9AA3B8] font-bold">
          No users matching the filters were found.
        </div>
      ) : (
        <div className="bg-[#1E293B] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role Badge</th>
                <th className="p-4">Reputation</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-[#9AA3B8]">
              {filteredUsers.map((usr) => {
                const isSuspended = (usr as any).isSuspended || false;
                const isSelf = usr.uid === currentUser?.uid;

                return (
                  <tr key={usr.uid} className="hover:bg-white/[0.01]">
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs uppercase">
                        {usr.displayName ? usr.displayName[0] : "?"}
                      </div>
                      <span>{usr.displayName} {isSelf && "(You)"}</span>
                    </td>
                    <td className="p-4 font-mono font-medium">{usr.email}</td>
                    <td className="p-4">
                      <select
                        value={usr.role}
                        disabled={isSelf}
                        onChange={(e) => setConfirmModal({
                          show: true,
                          type: "role",
                          targetUser: usr,
                          nextRole: e.target.value as UserRole
                        })}
                        className="bg-[#0F172A] border border-white/5 text-[10px] font-bold text-white px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer uppercase tracking-wider"
                      >
                        <option value="citizen">Citizen</option>
                        <option value="official">Official</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="p-4 font-black font-mono text-emerald-400">+{usr.reputation || 0} REP</td>
                    <td className="p-4 font-bold">
                      {isSuspended ? (
                        <span className="text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded uppercase">Suspended</span>
                      ) : (
                        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">Active</span>
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        disabled={isSelf}
                        onClick={() => setConfirmModal({
                          show: true,
                          type: "suspend",
                          targetUser: usr,
                          suspendState: !isSuspended
                        })}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          isSelf ? "border-white/5 text-white/20 cursor-not-allowed" :
                          isSuspended ? "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white" :
                          "border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white"
                        }`}
                      >
                        <Ban className="w-3 h-3 inline mr-1" /> {isSuspended ? "Reactivate" : "Suspend"}
                      </button>

                      <button
                        disabled={isSelf}
                        onClick={() => setConfirmModal({
                          show: true,
                          type: "delete",
                          targetUser: usr
                        })}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          isSelf ? "border-white/5 text-white/20 cursor-not-allowed" :
                          "border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog Modal overlay */}
      {confirmModal.show && confirmModal.targetUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111827] border border-white/5 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">Confirm Database Update</h3>
              <p className="text-xs text-[#9AA3B8] leading-relaxed">
                {confirmModal.type === "role" && `Are you sure you want to promote/demote ${confirmModal.targetUser.displayName} to ${confirmModal.nextRole}?`}
                {confirmModal.type === "suspend" && `Are you sure you want to ${confirmModal.suspendState ? "suspend" : "reactivate"} ${confirmModal.targetUser.displayName}'s account?`}
                {confirmModal.type === "delete" && `Are you sure you want to permanently delete the account of ${confirmModal.targetUser.displayName}? This action is irreversible!`}
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                onClick={() => setConfirmModal({ show: false, type: "role", targetUser: null })}
                className="flex-1 bg-white/5 border border-white/5 text-white text-xs font-bold py-2 rounded-xl hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={executeAction}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl"
              >
                Confirm Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
