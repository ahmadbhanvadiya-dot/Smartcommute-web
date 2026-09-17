"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Construction,
  Home,
  Sparkles,
} from "lucide-react";

export default function NotFound() {
  const pathname = usePathname();

  // Decide which dashboard the user should return to
  // based on the section they came from.
  const isLogisticsSection = pathname?.startsWith("/logistics");

  const dashboardHref = isLogisticsSection
    ? "/logistics"
    : "/dashboard";

  const dashboardLabel = isLogisticsSection
    ? "Logistics Dashboard"
    : "Commuter Dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <div className="w-full max-w-2xl text-center">

        {/* Icon */}
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 shadow-lg">
          <Construction className="h-9 w-9 text-white" />
        </div>

        {/* 404 */}
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
          404
        </p>

        {/* Heading */}
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          This page is still being built
        </h1>

        {/* Description */}
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">
          This SmartCommute AI module is part of the roadmap and will be
          available in a future version.
        </p>

        {/* Info Card */}
        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <Sparkles className="h-5 w-5 text-slate-700" />
            </div>

            <div>
              <p className="font-semibold text-slate-900">
                SmartCommute AI
              </p>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                We&apos;re continuously expanding the logistics and
                transportation intelligence platform.
              </p>
            </div>

          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

          {/* Back to onboarding */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back Home
          </Link>

          {/* Section-specific dashboard */}
          <Link
            href={dashboardHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Home className="h-4 w-4" />
            {dashboardLabel}
          </Link>

        </div>

        {/* Footer */}
        <p className="mt-10 text-xs text-slate-400">
          SmartCommute AI • Intelligent Transportation Platform
        </p>

      </div>
    </main>
  );
}