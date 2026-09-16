"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  BusFront,
  CarFront,
  Clock3,
  IndianRupee,
  MapPin,
  Navigation,
  ShieldCheck,
  Users,
} from "lucide-react";

import Header from "@/components/dashboard/Header";
import { generateRoutes } from "@/lib/route-engine";

export default function RoutesPage() {
  const [from, setFrom] = useState("Mehdipatnam");
  const [to, setTo] = useState(
    "Lords Institute of Engineering"
  );

  const [searched, setSearched] = useState(true);

  const routes = useMemo(() => {
    if (!searched) return [];

    return generateRoutes(from, to);
  }, [from, to, searched]);

  const recommended = routes[0];

  const getIcon = (mode: string) => {
    if (mode === "bus") return BusFront;
    if (mode === "auto") return CarFront;

    return Navigation;
  };

  const handleSearch = () => {
    if (!from.trim() || !to.trim()) return;

    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              AI Route Intelligence
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Smart Routes
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Compare routes using travel time, traffic,
              crowd and cost.
            </p>
          </div>

          {/* Search */}
          <div className="rounded-2xl bg-slate-900 p-5 shadow-xl">
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  From
                </label>

                <div className="flex items-center gap-2">
                  <MapPin
                    size={17}
                    className="text-blue-400"
                  />

                  <input
                    value={from}
                    onChange={(e) =>
                      setFrom(e.target.value)
                    }
                    className="w-full bg-transparent text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Destination
                </label>

                <div className="flex items-center gap-2">
                  <Navigation
                    size={17}
                    className="text-emerald-400"
                  />

                  <input
                    value={to}
                    onChange={(e) =>
                      setTo(e.target.value)
                    }
                    className="w-full bg-transparent text-sm text-white outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSearch}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                Find Routes
                <ArrowRight size={17} />
              </button>
            </div>
          </div>

          {/* Recommendation */}
          {recommended && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">

              <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <BrainCircuit size={24} />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      AI Recommendation
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {recommended.title}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Best balance of time, cost,
                      traffic and crowd.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50 px-6 py-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                    AI Score
                  </p>

                  <p className="text-3xl font-black text-blue-700">
                    {recommended.score}
                  </p>
                </div>
              </div>

              <div className="grid border-t border-slate-100 sm:grid-cols-4">

                <div className="p-5">
                  <p className="text-xs text-slate-400">
                    ETA
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {recommended.eta} min
                  </p>
                </div>

                <div className="border-t border-slate-100 p-5 sm:border-l sm:border-t-0">
                  <p className="text-xs text-slate-400">
                    Cost
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {recommended.cost === 0
                      ? "Free"
                      : `₹${recommended.cost}`}
                  </p>
                </div>

                <div className="border-t border-slate-100 p-5 sm:border-l sm:border-t-0">
                  <p className="text-xs text-slate-400">
                    Crowd
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {recommended.crowd === 0
                      ? "None"
                      : `${recommended.crowd}%`}
                  </p>
                </div>

                <div className="border-t border-slate-100 p-5 sm:border-l sm:border-t-0">
                  <p className="text-xs text-slate-400">
                    Reliability
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {recommended.reliability}%
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* Route comparison */}
          <div className="mt-8">

            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Compare Routes
              </h2>

              <p className="text-sm text-slate-500">
                AI evaluated {routes.length} available
                transport options.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">

              {routes.map((route, index) => {
                const Icon = getIcon(route.mode);

                return (
                  <div
                    key={route.mode}
                    className={`rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
                      index === 0
                        ? "border-blue-200 ring-1 ring-blue-100"
                        : "border-slate-200"
                    }`}
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex items-center gap-3">

                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                            index === 0
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Icon size={21} />
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-900">
                            {route.title}
                          </h3>

                          {index === 0 && (
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                              Recommended
                            </p>
                          )}
                        </div>

                      </div>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {route.score}
                      </span>

                    </div>

                    <div className="mt-6 space-y-4">

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock3 size={15} />
                          <span className="text-xs">
                            Travel time
                          </span>
                        </div>

                        <span className="text-sm font-bold text-slate-900">
                          {route.eta} min
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500">
                          <IndianRupee size={15} />
                          <span className="text-xs">
                            Estimated cost
                          </span>
                        </div>

                        <span className="text-sm font-bold text-slate-900">
                          {route.cost === 0
                            ? "Free"
                            : `₹${route.cost}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Users size={15} />
                          <span className="text-xs">
                            Crowd
                          </span>
                        </div>

                        <span className="text-sm font-bold text-slate-900">
                          {route.crowd === 0
                            ? "None"
                            : `${route.crowd}%`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500">
                          <ShieldCheck size={15} />
                          <span className="text-xs">
                            Reliability
                          </span>
                        </div>

                        <span className="text-sm font-bold text-slate-900">
                          {route.reliability}%
                        </span>
                      </div>

                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4">

                      <div className="mb-2 flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>Traffic</span>
                        <span>{route.traffic}%</span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${route.traffic}%`,
                          }}
                        />
                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          </div>

          {/* AI Explanation */}
          {recommended && (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <BrainCircuit size={19} />
                </div>

                <div>
                  <p className="text-sm font-bold text-emerald-900">
                    Why SmartCommute selected{" "}
                    {recommended.title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-800/80">
                    The route achieved the highest combined
                    score after considering estimated travel
                    time, transportation cost, crowd level,
                    traffic conditions and reliability.
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}