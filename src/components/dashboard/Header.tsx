"use client";

import { useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import Sidebar from "./Sidebar";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:ml-64 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div className="hidden md:flex md:items-center md:gap-2">
            <Search size={18} className="text-slate-400" />

            <input
              placeholder="Search routes, buses..."
              className="w-64 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="md:hidden">
            <p className="text-sm font-bold text-slate-900">
              SmartCommute AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100">
            <Bell size={20} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <div className="hidden h-8 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              A
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">
                Ahmad
              </p>

              <p className="text-xs text-slate-400">
                Student
              </p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}