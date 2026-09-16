"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  BusFront,
  ChartNoAxesCombined,
  History,
  LayoutDashboard,
  Map,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Smart Routes",
    href: "/smart-routes",
    icon: Map,
  },
  {
    label: "Live Transport",
    href: "/live-transport",
    icon: BusFront,
  },
  {
    label: "Alerts",
    href: "/alerts",
    icon: Bell,
    badge: 2,
  },
  {
    label: "History & Analytics",
    href: "/history",
    icon: ChartNoAxesCombined,
  },
];

const bottomNavigation = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-slate-100 px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <BusFront size={21} />
          </div>

          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900">
              SmartCommute
            </h1>

            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">
              AI Mobility
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
          Main Menu
        </p>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  size={19}
                  className={
                    active
                      ? "text-blue-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }
                />

                <span className="flex-1">
                  {item.label}
                </span>

                {item.badge && (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-black ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* AI Section */}
        <div className="mt-8">
          <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
            Intelligence
          </p>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Sparkles size={15} />
              </div>

              <div>
                <p className="text-xs font-bold text-blue-900">
                  AI Route Engine
                </p>

                <p className="text-[9px] text-blue-700/60">
                  Active
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              <span className="text-[9px] font-semibold text-blue-800/70">
                Route intelligence online
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-8">
          <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
            System
          </p>

          <nav className="space-y-1">
            {bottomNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    size={19}
                    className={
                      active
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }
                  />

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Profile */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
            <UserRound size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">
              Ahmad
            </p>

            <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
              Student
            </p>
          </div>

          <Activity
            size={15}
            className="text-emerald-500"
          />
        </div>
      </div>
    </aside>
  );
}