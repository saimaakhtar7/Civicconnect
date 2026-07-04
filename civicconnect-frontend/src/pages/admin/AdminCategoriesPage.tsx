import React, { useState, useEffect } from "react";
import { 
  FolderOpen, Plus, Sliders, CheckCircle2, ChevronUp, ChevronDown, 
  Trash2, ShieldCheck, Clock, RefreshCw, X
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { adminService, Category } from "../../services/adminService";
import { Button } from "../../components/ui/button";
import { useNotificationStore } from "../../stores/notificationStore";

export const AdminCategoriesPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [newCat, setNewCat] = useState({
    id: "",
    name: "",
    icon: "AlertTriangle",
    color: "#E11D48",
    order: 0
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminService.getCategories();
      // Sort locally by order ranking ASC
      const sorted = data.sort((a, b) => a.order - b.order);
      setCategories(sorted);
    } catch (err) {
      console.error(err);
      addNotification({
        type: "error",
        title: "Load Failed",
        message: "Failed to read issue categories list."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newCat.id || !newCat.name) {
      addNotification({
        type: "warning",
        title: "Missing Fields",
        message: "ID and Name are mandatory."
      });
      return;
    }

    try {
      const nextOrder = categories.length;
      await adminService.createCategory(
        newCat.id.toLowerCase(),
        newCat.name,
        newCat.icon,
        newCat.color,
        nextOrder,
        currentUser.uid,
        currentUser.role
      );
      addNotification({
        type: "success",
        title: "Category Created",
        message: `Category ${newCat.name} is now enabled for citizen reports.`
      });
      setShowForm(false);
      setNewCat({ id: "", name: "", icon: "AlertTriangle", color: "#E11D48", order: 0 });
      fetchCategories();
    } catch (err) {
      console.error(err);
      addNotification({
        type: "error",
        title: "Create Failed",
        message: "Failed to write category to database."
      });
    }
  };

  const handleToggleEnabled = async (id: string, currentEnabled: boolean) => {
    if (!currentUser) return;
    try {
      // Optimistic update
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, enabled: !currentEnabled } : c))
      );
      await adminService.updateCategory(id, { enabled: !currentEnabled }, currentUser.uid, currentUser.role);
      addNotification({
        type: "success",
        title: "Status Updated",
        message: `Category status updated successfully.`
      });
    } catch (err) {
      console.error(err);
      fetchCategories();
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    if (!currentUser) return;
    const items = [...categories];
    const targetIdx = direction === "up" ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= items.length) return;

    // Swap ordering ranking
    const temp = items[index].order;
    items[index].order = items[targetIdx].order;
    items[targetIdx].order = temp;

    // Sort array locally
    const reordered = items.map((item) => ({ id: item.id, order: item.order }));
    
    try {
      setCategories(items.sort((a, b) => a.order - b.order));
      await adminService.reorderCategories(reordered, currentUser.uid, currentUser.role);
      addNotification({
        type: "success",
        title: "Ordering Saved",
        message: "Categories rank list reordered."
      });
    } catch (err) {
      console.error(err);
      fetchCategories();
    }
  };

  return (
    <div className="space-y-6 pb-28 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <FolderOpen className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">System Taxonomy</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Category Admin</h1>
          <p className="text-xs text-[#9AA3B8]">
            Configure and rank issue categories. Enabled items are displayed in the citizen reporting wizard.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(!showForm)} className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Category
          </Button>
          <Button onClick={fetchCategories} className="bg-white/5 border border-white/5 text-xs font-bold text-white hover:bg-white/10 shrink-0">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAddCategory} className="bg-[#1E293B] border border-white/5 p-5 rounded-2xl shadow-lg space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-white">Create Issue Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#6B7280]">Category ID (lowercase key)</label>
              <input
                type="text"
                required
                placeholder="e.g. road_damage, public_safety"
                value={newCat.id}
                onChange={(e) => setNewCat({ ...newCat, id: e.target.value })}
                className="w-full bg-[#0F172A] border border-white/5 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#6B7280]">Display Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Road Damage / Potholes"
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                className="w-full bg-[#0F172A] border border-white/5 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#6B7280]">Color Code Hex</label>
              <input
                type="color"
                value={newCat.color}
                onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
                className="w-full bg-[#0F172A] border border-white/5 h-10 p-1 rounded-xl focus:outline-none cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#6B7280]">Lucide Icon Reference</label>
              <select
                value={newCat.icon}
                onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
                className="w-full bg-[#0F172A] border border-white/5 text-xs text-white p-2.5 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="AlertTriangle">AlertTriangle</option>
                <option value="Droplets">Droplets</option>
                <option value="Zap">Zap</option>
                <option value="Trash2">Trash2</option>
                <option value="ShieldAlert">ShieldAlert</option>
                <option value="Trees">Trees</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" onClick={() => setShowForm(false)} className="bg-transparent border border-white/5 text-white hover:bg-white/5 text-xs font-bold">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold">
              Save Category
            </Button>
          </div>
        </form>
      )}

      {/* Categories table list */}
      {loading ? (
        <div className="text-center py-12 text-[#9AA3B8] font-bold">
          <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-[#16A34A]" /> Querying taxonomies data...
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-12 text-center text-[#9AA3B8]">
          No issue categories configured.
        </div>
      ) : (
        <div className="bg-[#1E293B] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                <th className="p-4">Rank Order</th>
                <th className="p-4">Category Key</th>
                <th className="p-4">Display Name</th>
                <th className="p-4">Color Tag</th>
                <th className="p-4">State</th>
                <th className="p-4 text-right">Reorder Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-[#9AA3B8]">
              {categories.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-white/[0.01]">
                  <td className="p-4 font-mono font-bold text-white">#{cat.order + 1}</td>
                  <td className="p-4 font-mono text-emerald-400">{cat.id}</td>
                  <td className="p-4 font-bold text-white">{cat.name}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg text-white border border-white/5" style={{ backgroundColor: cat.color + "25", color: cat.color }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.color}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleEnabled(cat.id, cat.enabled)}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        cat.enabled ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white" :
                        "border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white"
                      }`}
                    >
                      {cat.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-1.5">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, "up")}
                      className={`p-1.5 rounded-lg border border-white/5 text-white transition-all cursor-pointer ${
                        idx === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5"
                      }`}
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === categories.length - 1}
                      onClick={() => handleMoveOrder(idx, "down")}
                      className={`p-1.5 rounded-lg border border-white/5 text-white transition-all cursor-pointer ${
                        idx === categories.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5"
                      }`}
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
