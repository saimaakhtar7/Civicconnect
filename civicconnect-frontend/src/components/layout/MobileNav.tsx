import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Map, Trophy, User } from "lucide-react";

export const MobileNav: React.FC = () => {
  const navItems = [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/map", label: "Map", icon: Map },
    { to: "/community", label: "Community", icon: Trophy },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-[#0F172A]/90 backdrop-blur-md px-2 py-1 shadow-lg sm:hidden">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold tracking-wide uppercase transition-colors ${
                  isActive ? "text-[#22C55E]" : "text-[#9AA3B8] hover:text-white"
                }`
              }
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
export default MobileNav;
