"use client";

import {
  Bell,
  Menu,
  Search,
  X,
} from "lucide-react";

interface HeaderProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Header({
  mobileOpen = false,
  onClose,
}: HeaderProps) {
  return (
   <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:ml-64 lg:px-8">

      {/* ==================================================== */}
      {/* LEFT */}
      {/* ==================================================== */}

      <div className="flex min-w-0 items-center gap-3">

        {/* Mobile menu / close button */}

        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          aria-label={
            mobileOpen
              ? "Close menu"
              : "Open menu"
          }
        >
          {mobileOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>

        {/* Page heading */}

        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
            SmartCommute AI
          </h1>

          <p className="hidden truncate text-xs text-slate-500 sm:block">
            Intelligent transportation for students
          </p>
        </div>

      </div>

      {/* ==================================================== */}
      {/* RIGHT */}
      {/* ==================================================== */}

      <div className="flex items-center gap-2 sm:gap-4">

        {/* Search */}

        <div className="hidden items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">

          <Search
            size={17}
            className="mr-2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search routes..."
            className="w-40 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 lg:w-56"
          />

          <span className="ml-3 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
            /
          </span>

        </div>

        {/* Mobile search */}

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 md:hidden"
          aria-label="Search"
        >
          <Search size={19} />
        </button>

        {/* Notifications */}

        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
          aria-label="Notifications"
        >

          <Bell size={19} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />

        </button>

        {/* User */}

        <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            SC
          </div>

          <div className="hidden lg:block">

            <p className="text-sm font-semibold text-slate-800">
              Student
            </p>

            <p className="text-xs text-slate-400">
              SmartCommute User
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}