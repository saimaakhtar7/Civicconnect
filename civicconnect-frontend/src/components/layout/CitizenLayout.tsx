import React from "react";
import { Outlet, Link } from "react-router-dom";
import Header from "./Header";
import MobileNav from "./MobileNav";
import { ToastContainer } from "../ui/ToastContainer";
import { Plus } from "lucide-react";

export const CitizenLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#081220] text-[#F5F7FA] pb-16 sm:pb-0 relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 grid-pattern pointer-events-none opacity-25 z-0" />

      <Header />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10 relative">
        <Outlet />
      </main>

      {/* Floating Action Button (FAB) for reporting */}
      <Link
        to="/report"
        className="fixed bottom-24 right-6 sm:bottom-8 sm:right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/45 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
        aria-label="Report issue"
      >
        <Plus className="h-6 w-6" />
      </Link>

      {/* Toast Notifications */}
      <ToastContainer />

      <MobileNav />
    </div>
  );
};
export default CitizenLayout;
