import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { EmergencyAlerts } from "../ui/EmergencyAlerts";

export const OfficialLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0F17] flex flex-col">
      <Header />
      <EmergencyAlerts />
      <div className="flex flex-1 pt-0">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1700px] mx-auto w-full transition-all duration-300 ${
          collapsed ? "lg:pl-28" : "lg:pl-80"
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default OfficialLayout;
