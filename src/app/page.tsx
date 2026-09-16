"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BusFront,
  Truck,
  Sparkles,
  MapPin,
  Target,
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 shadow-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>

            <div className="text-left">
              <h1 className="text-lg font-bold tracking-tight">
                SmartCommute
              </h1>

              <p className="text-xs text-slate-500">
                AI Mobility Platform
              </p>
            </div>
          </button>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm sm:flex">
            <Sparkles className="h-4 w-4" />
            Intelligent mobility
          </div>
        </header>

        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center py-12 text-center sm:py-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <Sparkles className="h-4 w-4" />
            One platform. Two mobility experiences.
          </div>

          <h2 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Smarter movement for{" "}
            <span className="text-blue-600">people</span> and{" "}
            <span className="text-emerald-600">goods.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
            Choose how you want to use SmartCommute. Plan your daily
            commute or explore intelligent logistics and goods
            transportation.
          </p>

          {/* Mission Statement */}
          <div className="mt-8 w-full max-w-2xl rounded-2xl border border-emerald-100 bg-emerald-50/70 px-6 py-5 shadow-sm">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Target className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                  Our Mission
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600 sm:text-base">
                  Making cities move smarter by reducing congestion,
                  delays, and pressure on transport and logistics
                  networks.
                </p>
              </div>
            </div>
          </div>

          {/* Mode Cards */}
          <div className="mt-10 grid w-full max-w-5xl gap-6 md:grid-cols-2">
            {/* Commuter */}
            <button
              onClick={() => router.push("/dashboard")}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl md:p-10"
            >
              <div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full bg-blue-50 transition-transform duration-500 group-hover:scale-150" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <BusFront className="h-8 w-8" />
                  </div>

                  <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    Existing platform
                  </div>
                </div>

                <h3 className="mt-8 text-2xl font-bold text-slate-950">
                  For Commuters
                </h3>

                <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-500 sm:text-base">
                  Find smarter public transport routes, compare
                  journeys, check scheduled buses and get intelligent
                  commute recommendations.
                </p>

                <div className="mt-8 flex items-center gap-2 font-semibold text-blue-600">
                  Continue as Commuter

                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </button>

            {/* Logistics */}
            <button
              onClick={() => router.push("/logistics")}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl md:p-10"
            >
              <div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full bg-emerald-50 transition-transform duration-500 group-hover:scale-150" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Truck className="h-8 w-8" />
                  </div>

                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    Logistics
                  </div>
                </div>

                <h3 className="mt-8 text-2xl font-bold text-slate-950">
                  For Logistics
                </h3>

                <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-500 sm:text-base">
                  Plan goods transportation, explore freight routes and
                  optimize logistics operations for efficient movement.
                </p>

                <div className="mt-8 flex items-center gap-2 font-semibold text-emerald-600">
                  Enter Logistics

                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="pb-4 text-center text-xs text-slate-400">
          SmartCommute AI • Intelligent mobility for people and goods
        </footer>
      </div>
    </main>
  );
}