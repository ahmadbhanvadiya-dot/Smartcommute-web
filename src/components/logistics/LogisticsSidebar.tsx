"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Box,
  ChevronRight,
  Gauge,
  LayoutDashboard,
  Map,
  Menu,
  Package,
  Settings,
  Truck,
  X,
  Zap,
} from "lucide-react";

const navigation = [
  {
    title: "LOGISTICS",
    items: [
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
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      {
        label: "Fleet",
        href: "/logistics/fleet",
        icon: Truck,
      },
      {
        label: "Vehicles",
        href: "/logistics/vehicles",
        icon: Box,
      },
      {
        label: "Delivery Planning",
        href: "/logistics/delivery-planning",
        icon: Gauge,
      },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      {
        label: "Route Optimizer",
        href: "/logistics/routes",
        icon: Zap,
        special: true,
      },
      {
        label: "Analytics",
        href: "/logistics/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "Settings",
        href: "/logistics/settings",
        icon: Settings,
      },
    ],
  },
];

export default function LogisticsSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/logistics") {
      return pathname === "/logistics";
    }

    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ===================================================== */}
      {/* MOBILE HEADER                                         */}
      {/* ===================================================== */}

      <header className="fixed inset-x-0 top-0 z-[1000] flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
          aria-label="Open logistics menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href="/logistics"
          className="flex items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Truck className="h-5 w-5" />
          </div>

          <div className="text-left">
            <p className="text-sm font-bold leading-none text-slate-900">
              SmartCommute
            </p>

            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Logistics
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-semibold text-emerald-700">
            Online
          </span>
        </div>
      </header>

      {/* ===================================================== */}
      {/* MOBILE BACKDROP                                        */}
      {/* ===================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[1090] bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* ===================================================== */}
      {/* SIDEBAR                                                */}
      {/* ===================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-[1100] flex w-64 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out lg:translate-x-0 lg:shadow-none ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <Link
            href="/logistics"
            className="flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Truck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">
                SmartCommute
              </p>

              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.25em] text-emerald-600">
                Logistics
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close logistics menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-6">
            {navigation.map((section) => (
              <div key={section.title}>
                <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.2em] text-slate-400">
                  {section.title}
                </p>

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    if (item.special) {
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() =>
                            setMobileOpen(false)
                          }
                          className="group block rounded-xl border border-emerald-100 bg-emerald-50 p-3 transition hover:border-emerald-200 hover:bg-emerald-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                              <Icon className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-xs font-bold text-emerald-900">
                                  {item.label}
                                </p>

                                <ChevronRight className="h-3.5 w-3.5 text-emerald-500 transition group-hover:translate-x-0.5" />
                              </div>

                              <p className="mt-0.5 text-[10px] font-medium text-emerald-600">
                                Active
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-1.5 text-[9px] font-medium text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Logistics intelligence online
                          </div>
                        </Link>
                      );
                    }

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() =>
                          setMobileOpen(false)
                        }
                        className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          active
                            ? "bg-emerald-50 font-semibold text-emerald-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 shrink-0 ${
                            active
                              ? "text-emerald-600"
                              : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        />

                        <span className="truncate">
                          {item.label}
                        </span>

                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom profile/status */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
              <Truck className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800">
                Logistics
              </p>

              <p className="text-[9px] uppercase tracking-wider text-slate-400">
                Operations
              </p>
            </div>

            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
        </div>
      </aside>
    </>
  );
}