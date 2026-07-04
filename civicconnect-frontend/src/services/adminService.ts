import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, limit, orderBy, runTransaction, Timestamp, addDoc
} from "firebase/firestore";
import { db } from "../config/firebase";
import { UserDocument, UserRole } from "../types/user.types";

export interface Department {
  id: string;
  name: string;
  description: string;
  headOfficial: string;
  officialIds: string[];
  isActive: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  enabled: boolean;
  createdBy: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface AuditLog {
  id?: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  targetId: string;
  targetType: string;
  details: Record<string, any>;
  previousRole?: UserRole;
  newRole?: UserRole;
  timestamp: Timestamp | Date;
}

export interface SystemSettings {
  appName: string;
  maintenanceMode: boolean;
  enableAIClassification: boolean;
  enableDuplicateDetection: boolean;
  enableNotifications: boolean;
  defaultCitizenRole: string;
}

export const adminService = {
  // Log helper
  logAdminAction: async (log: Omit<AuditLog, "timestamp">) => {
    try {
      await addDoc(collection(db, "auditLogs"), {
        ...log,
        timestamp: Timestamp.now()
      });
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  },

  // User Management
  getAllUsers: async (): Promise<UserDocument[]> => {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => d.data() as UserDocument);
  },

  updateUserRole: async (
    targetUid: string,
    newRole: UserRole,
    changedById: string,
    changedByRole: UserRole
  ): Promise<void> => {
    const userRef = doc(db, "users", targetUid);

    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error("User does not exist!");
      }

      const userData = userSnap.data() as UserDocument;
      const prevRole = userData.role;

      if (prevRole === newRole) return;

      const historyEntry = {
        previousRole: prevRole,
        newRole: newRole,
        changedBy: changedById,
        timestamp: Timestamp.now().toDate().toISOString()
      };

      // Add to array history or initialize it
      const currentHistory = (userData as any).roleHistory || [];
      const updatedHistory = [...currentHistory, historyEntry];

      transaction.update(userRef, {
        role: newRole,
        roleHistory: updatedHistory,
        updatedAt: Timestamp.now()
      });
    });

    // Write audit log
    await adminService.logAdminAction({
      actorId: changedById,
      actorRole: changedByRole,
      action: "role_change",
      targetId: targetUid,
      targetType: "user",
      details: { newRole }
    });
  },

  suspendUser: async (
    targetUid: string,
    isSuspended: boolean,
    adminId: string,
    adminRole: UserRole
  ): Promise<void> => {
    const userRef = doc(db, "users", targetUid);
    await updateDoc(userRef, { isSuspended, updatedAt: Timestamp.now() });

    await adminService.logAdminAction({
      actorId: adminId,
      actorRole: adminRole,
      action: isSuspended ? "user_suspended" : "user_reactivated",
      targetId: targetUid,
      targetType: "user",
      details: { isSuspended }
    });
  },

  deleteUser: async (
    targetUid: string,
    adminId: string,
    adminRole: UserRole
  ): Promise<void> => {
    if (targetUid === adminId) {
      throw new Error("You cannot delete your own account!");
    }
    const userRef = doc(db, "users", targetUid);
    await deleteDoc(userRef);

    await adminService.logAdminAction({
      actorId: adminId,
      actorRole: adminRole,
      action: "user_deleted",
      targetId: targetUid,
      targetType: "user",
      details: {}
    });
  },

  getSystemStats: async () => {
    const [usersSnap, issuesSnap, discussionsSnap, eventsSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "issues")),
      getDocs(collection(db, "discussions")),
      getDocs(collection(db, "events"))
    ]);

    const users = usersSnap.docs.map((d) => d.data() as UserDocument);
    const issues = issuesSnap.docs.map((d) => d.data());

    return {
      totalUsers: users.length,
      citizens: users.filter((u) => u.role === "citizen").length,
      officials: users.filter((u) => u.role === "official").length,
      moderators: users.filter((u) => u.role === "moderator").length,
      totalIssues: issues.length,
      activeIssues: issues.filter((i) => !["resolved", "closed", "rejected"].includes(i.status)).length,
      resolvedIssues: issues.filter((i) => i.status === "resolved" || i.status === "closed").length,
      discussions: discussionsSnap.size,
      events: eventsSnap.size
    };
  },

  // Department Management
  getDepartments: async (): Promise<Department[]> => {
    const snap = await getDocs(collection(db, "departments"));
    return snap.docs.map((d) => d.data() as Department);
  },

  createDepartment: async (
    id: string,
    name: string,
    description: string,
    headOfficial: string,
    adminId: string,
    adminRole: UserRole
  ): Promise<void> => {
    const deptRef = doc(db, "departments", id);
    const newDept: Department = {
      id,
      name,
      description,
      headOfficial,
      officialIds: [],
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    await setDoc(deptRef, newDept);

    await adminService.logAdminAction({
      actorId: adminId,
      actorRole: adminRole,
      action: "department_created",
      targetId: id,
      targetType: "department",
      details: { name }
    });
  },

  updateDepartment: async (
    id: string,
    fields: Partial<Omit<Department, "id" | "createdAt">>,
    adminId: string,
    adminRole: UserRole
  ): Promise<void> => {
    const deptRef = doc(db, "departments", id);
    await updateDoc(deptRef, {
      ...fields,
      updatedAt: Timestamp.now()
    });

    await adminService.logAdminAction({
      actorId: adminId,
      actorRole: adminRole,
      action: "department_updated",
      targetId: id,
      targetType: "department",
      details: fields
    });
  },

  assignOfficial: async (
    deptId: string,
    officialId: string,
    adminId: string,
    adminRole: UserRole
  ): Promise<void> => {
    const deptRef = doc(db, "departments", deptId);
    const userRef = doc(db, "users", officialId);

    await runTransaction(db, async (transaction) => {
      const deptSnap = await transaction.get(deptRef);
      if (!deptSnap.exists()) throw new Error("Department not found");

      const deptData = deptSnap.data() as Department;
      const currentOfficials = deptData.officialIds || [];

      if (!currentOfficials.includes(officialId)) {
        const updated = [...currentOfficials, officialId];
        transaction.update(deptRef, { officialIds: updated, updatedAt: Timestamp.now() });
      }

      // Update the official's department property
      transaction.update(userRef, { department: deptData.name, updatedAt: Timestamp.now() });
    });

    await adminService.logAdminAction({
      actorId: adminId,
      actorRole: adminRole,
      action: "official_assigned_to_dept",
      targetId: officialId,
      targetType: "user",
      details: { departmentId: deptId }
    });
  },

  removeOfficial: async (
    deptId: string,
    officialId: string,
    adminId: string,
    adminRole: UserRole
  ): Promise<void> => {
    const deptRef = doc(db, "departments", deptId);
    const userRef = doc(db, "users", officialId);

    await runTransaction(db, async (transaction) => {
      const deptSnap = await transaction.get(deptRef);
      if (!deptSnap.exists()) throw new Error("Department not found");

      const deptData = deptSnap.data() as Department;
      const updated = (deptData.officialIds || []).filter((id) => id !== officialId);
      transaction.update(deptRef, { officialIds: updated, updatedAt: Timestamp.now() });

      // Remove the official's department assignment
      transaction.update(userRef, { department: null, updatedAt: Timestamp.now() });
    });

    await adminService.logAdminAction({
      actorId: adminId,
      actorRole: adminRole,
      action: "official_removed_from_dept",
      targetId: officialId,
      targetType: "user",
      details: { departmentId: deptId }
    });
  },

  // Category Management
  getCategories: async (): Promise<Category[]> => {
    const snap = await getDocs(collection(db, "categories"));
    return snap.docs.map((d) => d.data() as Category);
  },

  createCategory: async (
    id: string,
    name: string,
    icon: string,
    color: string,
    order: number,
    adminId: string,
    adminRole: UserRole
  ): Promise<void> => {
    const catRef = doc(db, "categories", id);
    const newCategory: Category = {
      id,
      name,
      icon,
      color,
      order,
      enabled: true,
      createdBy: adminId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    await setDoc(catRef, newCategory);

    await adminService.logAdminAction({
      actorId: adminId,
      actorRole: adminRole,
      action: "category_created",
      targetId: id,
      targetType: "category",
      details: { name }
    });
  },

  updateCategory: async (
    id: string,
    fields: Partial<Omit<Category, "id" | "createdAt">>,
    adminId: string,
    adminRole: UserRole
  ): Promise<void> => {
    const catRef = doc(db, "categories", id);
    await updateDoc(catRef, {
      ...fields,
      updatedAt: Timestamp.now()
    });

    await adminService.logAdminAction({
      actorId: adminId,
      actorRole: adminRole,
      action: "category_updated",
      targetId: id,
      targetType: "category",
      details: fields
    });
  },

  reorderCategories: async (
    reordered: { id: string; order: number }[],
    adminId: string,
    adminRole: UserRole
  ): Promise<void> => {
    await runTransaction(db, async (transaction) => {
      for (const item of reordered) {
        const catRef = doc(db, "categories", item.id);
        transaction.update(catRef, { order: item.order, updatedAt: Timestamp.now() });
      }
    });

    await adminService.logAdminAction({
      actorId: adminId,
      actorRole: adminRole,
      action: "categories_reordered",
      targetId: "all",
      targetType: "category",
      details: { count: reordered.length }
    });
  },

  // System Settings Management
  getSystemSettings: async (): Promise<SystemSettings> => {
    const configRef = doc(db, "systemSettings", "config");
    try {
      const snap = await getDocs(collection(db, "systemSettings"));
      const docSnap = snap.docs.find((d) => d.id === "config");
      if (docSnap) {
        return docSnap.data() as SystemSettings;
      }
    } catch {}
    
    // Seed default settings if doc is missing
    const defaultSettings: SystemSettings = {
      appName: "CivicConnect AI",
      maintenanceMode: false,
      enableAIClassification: true,
      enableDuplicateDetection: true,
      enableNotifications: true,
      defaultCitizenRole: "citizen"
    };
    await setDoc(configRef, defaultSettings);
    return defaultSettings;
  },

  updateSystemSettings: async (
    settings: SystemSettings,
    adminId: string,
    adminRole: UserRole
  ): Promise<void> => {
    const configRef = doc(db, "systemSettings", "config");
    await setDoc(configRef, settings);

    await adminService.logAdminAction({
      actorId: adminId,
      actorRole: adminRole,
      action: "system_settings_updated",
      targetId: "config",
      targetType: "systemSettings",
      details: settings
    });
  },

  // Audit Logs
  getAuditLogs: async (maxLimit = 50): Promise<AuditLog[]> => {
    const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(maxLimit));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AuditLog);
  }
};
