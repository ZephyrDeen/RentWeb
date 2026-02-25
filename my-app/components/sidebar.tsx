"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { HomeIcon, ExitIcon, PersonIcon } from "@radix-ui/react-icons";
import { ComponentType } from "react";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
}

interface NavItemConfig {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href?: string;
}

interface SidebarProps {
  user: User;
  navItems: NavItemConfig[];
  actionItems?: NavItemConfig[];
  portalName: string;
  portalColor: "emerald" | "blue";
}

export function Sidebar({ user, navItems, actionItems, portalName, portalColor }: SidebarProps) {
  const pathname = usePathname();

  const colorClasses = {
    emerald: {
      badge: "text-emerald-600",
      avatar: "bg-emerald-100 text-emerald-600",
      active: "bg-emerald-50 text-emerald-600",
    },
    blue: {
      badge: "text-blue-600",
      avatar: "bg-blue-100 text-blue-600",
      active: "bg-blue-50 text-blue-600",
    },
  };

  const colors = colorClasses[portalColor];

  return (
    <nav className="w-72 bg-white h-full flex flex-col shadow-lg">
      {/* Logo */}
      <div className="flex items-center px-6 py-6 border-b border-gray-200">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
          <HomeIcon className="h-5 w-5 text-white" />
        </div>
        <div className="ml-3">
          <p className="text-lg font-bold text-gray-800">RentWeb</p>
          <span className={`text-xs font-medium ${colors.badge}`}>{portalName}</span>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.avatar}`}>
            <PersonIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">Menu</p>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={item.href === pathname || (item.href !== "/dashboard" && pathname.startsWith(item.href || ""))}
              activeClass={colors.active}
            />
          ))}
        </ul>

        {actionItems && actionItems.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-8 mb-4 px-3">Actions</p>
            <ul className="space-y-1">
              {actionItems.map((item) => (
                <NavItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  activeClass={colors.active}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Logout */}
      <div className="px-4 pb-6">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <ExitIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}

function NavItem({
  icon: Icon,
  label,
  href = "#",
  active,
  activeClass,
}: {
  icon: ComponentType<{ className?: string }>; // 直接接收组件
  label: string;
  href?: string;
  active?: boolean;
  activeClass: string;
}) {
  return (
    <li>
      <a
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active
          ? activeClass
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium text-sm">{label}</span>
      </a>
    </li>
  );
}
