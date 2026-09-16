"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Boxes,
  LayoutDashboard,
  Map,
  Package,
  Settings,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    href: "/logistics",
    icon: LayoutDashboard,
  },
  {
    label: "Freight Routes",
    href: "/logistics/routes",
    icon: Map,
  },
  {
    label: "Shipments",
    href: "/logistics/shipments",
    icon: Package,
  },
];

const operations = [
  {
    label: "Fleet",
    href: "/logistics/fleet",
    icon: Truck,
  },
  {
    label: "Vehicles",
    href: "/logistics/vehicles",
    icon: Boxes,
  },
  {
    label: "Delivery Planning",
    href: "/logistics/delivery-planning",
    icon: Activity,
  },
];

const analytics = [
  {
    label: "Analytics",
    href: "/logistics/analytics",
    icon: BarChart3,
  },
];

const bottomNavigation = [
  {
    label: "Settings",
    href: "/logistics/settings",
    icon: Settings,
  },
];

export default function LogisticsSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/logistics") {
      return pathname === "/logistics";
    }

    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-slate-100 px-6">
        <Link
          href="/logistics"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <Truck size={21} />
          </div>

          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900">
              SmartCommute
            </h1>

            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-600">
              Logistics
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Main */}
        <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
          Logistics
        </p>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={<Icon size={19} />}
                active={active}
              />
            );
          })}
        </nav>

        {/* Operations */}
        <div className="mt-8">
          <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
            Operations
          </p>

          <nav className="space-y-1">
            {operations.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={<Icon size={19} />}
                  active={active}
                />
              );
            })}
          </nav>
        </div>

        {/* Intelligence */}
        <div className="mt-8">
          <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
            Intelligence
          </p>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Sparkles size={15} />
              </div>

              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Route Optimizer
                </p>

                <p className="text-[9px] text-emerald-700/60">
                  Active
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              <span className="text-[9px] font-semibold text-emerald-800/70">
                Logistics intelligence online
              </span>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="mt-8">
          <nav className="space-y-1">
            {analytics.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={<Icon size={19} />}
                  active={active}
                />
              );
            })}
          </nav>
        </div>

        {/* System */}
        <div className="mt-8">
          <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
            System
          </p>

          <nav className="space-y-1">
            {bottomNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={<Icon size={19} />}
                  active={active}
                />
              );
            })}
          </nav>
        </div>
      </div>

      {/* Profile */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
            <Users size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">
              Logistics
            </p>

            <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
              Operations
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

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
        active
          ? "bg-emerald-50 text-emerald-600"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span
        className={
          active
            ? "text-emerald-600"
            : "text-slate-400 group-hover:text-slate-600"
        }
      >
        {icon}
      </span>

      <span>{label}</span>
    </Link>
  );
}