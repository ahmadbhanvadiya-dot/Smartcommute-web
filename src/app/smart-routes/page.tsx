"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BusFront,
  CarFront,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  Navigation,
  Sparkles,
  Users,
  Footprints,
} from "lucide-react";

import Header from "@/components/dashboard/Header";
import RouteSearch from "@/components/dashboard/RouteSearch";
import TransportCard from "@/components/dashboard/TransportCard";
import AIRecommendation from "@/components/dashboard/AIRecommendation";

import {
  generateRoutes,
  RouteOption,
  TransportMode,
} from "@/lib/route-engine";

export default function SmartRoutesPage() {
  const [route, setRoute] = useState({
    from: "Mehdipatnam",
    to: "Lords Institute of Engineering",
  });

  const [selectedMode, setSelectedMode] =
    useState<TransportMode | null>(null);

  const routes = useMemo(() => {
    return generateRoutes(
      route.from,
      route.to
    );
  }, [route]);

  const recommendedRoute =
    selectedMode
      ? routes.find(
          (item) =>
            item.mode === selectedMode
        ) ?? routes[0]
      : routes[0];

  const handleSearch = (
    from: string,
    to: string
  ) => {
    setRoute({
      from,
      to,
    });

    setSelectedMode(null);
  };

  const handleTransportSelect = (
    mode: TransportMode
  ) => {
    setSelectedMode(mode);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">

          {/* Page Header */}
          <div className="mb-7">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-blue-600">
                SmartCommute AI
              </p>

              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-blue-600">
                <Sparkles size={10} />
                AI Powered
              </span>
            </div>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Smart Routes
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Compare available transport options using
              travel time, cost, traffic, crowd levels
              and route reliability.
            </p>
          </div>

          {/* Route Planner */}
          <RouteSearch
            onSearch={handleSearch}
          />

          {/* Route Summary */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Starting Point
                  </p>

                  <p className="mt-1 truncate text-sm font-bold text-slate-900">
                    {route.from}
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden items-center justify-center sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                <ArrowRight size={18} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Navigation size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Destination
                  </p>

                  <p className="mt-1 truncate text-sm font-bold text-slate-900">
                    {route.to}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="mt-6">
            <AIRecommendation
              route={recommendedRoute}
            />
          </div>

          {/* Transport Options */}
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Available Transport
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Choose a transport option to update
                  the recommendation.
                </p>
              </div>

              <div className="hidden items-center gap-2 text-[10px] font-semibold text-slate-400 sm:flex">
                <CheckCircle2
                  size={13}
                  className="text-emerald-500"
                />
                AI evaluated
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {routes.map((item, index) => (
                <TransportCard
                  key={item.mode}
                  type={item.mode}
                  title={item.title}
                  eta={`${item.eta} min`}
                  cost={
                    item.cost === 0
                      ? "Free"
                      : `₹${item.cost}`
                  }
                  crowd={`${item.crowd}%`}
                  recommended={index === 0}
                  selected={
                    recommendedRoute.mode ===
                    item.mode
                  }
                  onClick={() =>
                    handleTransportSelect(
                      item.mode
                    )
                  }
                />
              ))}
            </div>
          </section>

          {/* Route Intelligence */}
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Route Intelligence
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Factors used by SmartCommute AI to
                evaluate your journey.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* ETA */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Clock3 size={19} />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Estimated Time
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-900">
                      {recommendedRoute.eta}
                      <span className="ml-1 text-xs font-medium text-slate-400">
                        min
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <IndianRupee size={19} />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Estimated Cost
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-900">
                      {recommendedRoute.cost === 0
                        ? "Free"
                        : `₹${recommendedRoute.cost}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Crowd */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Users size={19} />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Crowd Level
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-900">
                      {recommendedRoute.crowd}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Reliability */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <CheckCircle2 size={19} />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Reliability
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-900">
                      {recommendedRoute.reliability}%
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Current Recommendation */}
          <section className="mt-8 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-blue-50/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles
                  size={17}
                  className="text-blue-600"
                />

                <h2 className="text-sm font-bold text-slate-900">
                  Why AI selected this route
                </h2>
              </div>
            </div>

            <div className="p-5">
              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Selected Transport
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      {recommendedRoute.mode ===
                      "bus" ? (
                        <BusFront size={21} />
                      ) : recommendedRoute.mode ===
                        "auto" ? (
                        <CarFront size={21} />
                      ) : (
                        <Footprints size={21} />
                      )}
                    </div>

                    <div>
                      <p className="text-base font-bold text-slate-900">
                        {recommendedRoute.title}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        AI score:{" "}
                        <span className="font-bold text-blue-600">
                          {recommendedRoute.score}/100
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Route Assessment
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {recommendedRoute.description}
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* Footer info */}
          <div className="mt-8 flex items-center justify-center gap-2 pb-4 text-[10px] font-semibold text-slate-400">
            <Sparkles size={12} />
            SmartCommute AI continuously evaluates
            available transport factors.
          </div>

        </div>
      </main>
    </div>
  );
}