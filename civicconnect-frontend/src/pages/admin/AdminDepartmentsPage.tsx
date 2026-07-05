import React, { useState, useEffect } from "react";
import { 
  Building, Plus, UserMinus, Clock, RefreshCw
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { adminService, Department } from "../../services/adminService";
import { UserDocument } from "../../types/user.types";
import { Button } from "../../components/ui/button";
import { useNotificationStore } from "../../stores/notificationStore";

export const AdminDepartmentsPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { addNotification } = useNotificationStore();
  
  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [officials, setOfficials] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDept, setNewDept] = useState({
    id: "",
    name: "",
    description: "",
    headOfficial: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptsData, usersData] = await Promise.all([
        adminService.getDepartments(),
        adminService.getAllUsers()
      ]);
      setDepartments(deptsData);
      setOfficials(usersData.filter((u) => u.role === "official"));
    } catch (err) {
      console.error(err);
      addNotification({
        type: "error",
        title: "Load Data Failed",
        message: "Could not fetch departments or officials registry."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newDept.id || !newDept.name || !newDept.headOfficial) {
      addNotification({
        type: "warning",
        title: "Missing Fields",
        message: "Please populate ID, Name, and choose a Department Head."
      });
      return;
    }

    try {
      await adminService.createDepartment(
        newDept.id.toLowerCase(),
        newDept.name,
        newDept.description,
        newDept.headOfficial,
        currentUser.uid,
        currentUser.role
      );
      addNotification({
        type: "success",
        title: "Department Created",
        message: `Successfully created ${newDept.name} Department.`
      });
      setShowAddForm(false);
      setNewDept({ id: "", name: "", description: "", headOfficial: "" });
      fetchData();
    } catch (err) {
      console.error(err);
      addNotification({
        type: "error",
        title: "Create Failed",
        message: "Failed to write department to database."
      });
    }
  };

  const handleAssignOfficial = async (deptId: string, officialId: string) => {
    if (!currentUser) return;
    try {
      await adminService.assignOfficial(deptId, officialId, currentUser.uid, currentUser.role);
      addNotification({
        type: "success",
        title: "Official Assigned",
        message: "Municipal officer assigned to department successfully."
      });
      fetchData();
    } catch (err) {
      console.error(err);
      addNotification({
        type: "error",
        title: "Assignment Failed",
        message: "Transaction failed. Please try again."
      });
    }
  };

  const handleRemoveOfficial = async (deptId: string, officialId: string) => {
    if (!currentUser) return;
    try {
      await adminService.removeOfficial(deptId, officialId, currentUser.uid, currentUser.role);
      addNotification({
        type: "warning",
        title: "Official Removed",
        message: "Municipal officer unassigned from department."
      });
      fetchData();
    } catch (err) {
      console.error(err);
      addNotification({
        type: "error",
        title: "Removal Failed",
        message: "Transaction failed. Please try again."
      });
    }
  };

  const getHeadName = (headId: string) => {
    const found = officials.find((o) => o.uid === headId);
    return found ? found.displayName : "Unassigned";
  };

  return (
    <div className="space-y-6 pb-28 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Building className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Infrastructure Divisions</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Departments Admin</h1>
          <p className="text-xs text-[#9AA3B8]">
            Configure municipal task force departments and map officials to issue queues.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Department
          </Button>
          <Button onClick={fetchData} className="bg-white/5 border border-white/5 text-xs font-bold text-white hover:bg-white/10 shrink-0">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Add Department Form */}
      {showAddForm && (
        <form onSubmit={handleAddDept} className="bg-[#1E293B] border border-white/5 p-5 rounded-2xl shadow-lg space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-white">Create Municipal Department</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#6B7280]">Dept ID (lowercase key)</label>
              <input
                type="text"
                required
                placeholder="e.g. roads, water, sewage"
                value={newDept.id}
                onChange={(e) => setNewDept({ ...newDept, id: e.target.value })}
                className="w-full bg-[#0F172A] border border-white/5 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#6B7280]">Department Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Roads Department"
                value={newDept.name}
                onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                className="w-full bg-[#0F172A] border border-white/5 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[#6B7280]">Description</label>
            <textarea
              placeholder="Operational responsibilities and scope..."
              value={newDept.description}
              onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
              className="w-full bg-[#0F172A] border border-white/5 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-emerald-500 h-20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[#6B7280]">Department Head</label>
            <select
              value={newDept.headOfficial}
              required
              onChange={(e) => setNewDept({ ...newDept, headOfficial: e.target.value })}
              className="w-full bg-[#0F172A] border border-white/5 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Select official...</option>
              {officials.map((o) => (
                <option key={o.uid} value={o.uid}>{o.displayName}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" onClick={() => setShowAddForm(false)} className="bg-transparent border border-white/5 text-white hover:bg-white/5 text-xs font-bold">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold">
              Save Department
            </Button>
          </div>
        </form>
      )}

      {/* Departments Grid */}
      {loading ? (
        <div className="text-center py-12 text-[#9AA3B8] font-bold">
          <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-[#16A34A]" /> Querying departments configuration...
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-12 text-center text-[#9AA3B8]">
          No municipal departments configured. Click "New Department" to initialize.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departments.map((dept) => {
            const assignedStaff = officials.filter((o) => dept.officialIds?.includes(o.uid));
            const unassignedOfficials = officials.filter((o) => !dept.officialIds?.includes(o.uid));

            return (
              <div key={dept.id} className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Title and ID */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-black">
                        ID: {dept.id}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5">{dept.name}</h3>
                    </div>
                    <Building className="w-5 h-5 text-emerald-400 opacity-60" />
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#9AA3B8] leading-relaxed">{dept.description}</p>

                  <div className="border-t border-white/5 pt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6B7280] font-bold">Department Head:</span>
                      <span className="text-white font-bold">{getHeadName(dept.headOfficial)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6B7280] font-bold">Total Staff:</span>
                      <span className="text-emerald-400 font-bold font-mono">{dept.officialIds?.length || 0} Officers</span>
                    </div>
                  </div>

                  {/* Staff List */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider block">Assigned Staff</span>
                    {assignedStaff.length === 0 ? (
                      <span className="text-[10px] text-[#6B7280] italic block">No officers assigned.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedStaff.map((staff) => (
                          <div key={staff.uid} className="flex items-center gap-1 bg-[#0F172A] border border-white/5 text-[10px] font-bold text-white pl-2 pr-1 py-0.5 rounded-lg">
                            <span>{staff.displayName}</span>
                            <button
                              onClick={() => handleRemoveOfficial(dept.id, staff.uid)}
                              className="text-red-400 hover:text-red-500 hover:bg-white/5 p-0.5 rounded cursor-pointer"
                              title="Unassign official"
                            >
                              <UserMinus className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Staff Assignment Input */}
                <div className="border-t border-white/5 pt-4 flex gap-2">
                  <select
                    className="flex-1 bg-[#0F172A] border border-white/5 text-xs text-white p-2 rounded-xl focus:outline-none cursor-pointer"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignOfficial(dept.id, e.target.value);
                        e.target.value = ""; // Reset selector
                      }
                    }}
                  >
                    <option value="">Assign staff official...</option>
                    {unassignedOfficials.map((o) => (
                      <option key={o.uid} value={o.uid}>{o.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDepartmentsPage;
