"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  Clock3,
  IndianRupee,
  TrendingDown,
} from "lucide-react";

import Header from "@/components/dashboard/Header";
import StatCard from "@/components/dashboard/StatCard";
import RouteSearch from "@/components/dashboard/RouteSearch";
import AIRecommendation from "@/components/dashboard/AIRecommendation";
import TransportCard from "@/components/dashboard/TransportCard";
import LiveTransport from "@/components/dashboard/LiveTransport";

import {
  generateRoutes,
  type TransportMode,
} from "@/lib/route-engine";

const RouteMap = dynamic(
  () => import("@/components/map/RouteMap"),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />

          <p className="text-sm font-semibold text-slate-700">
            Loading map...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Preparing route visualization
          </p>
        </div>
      </div>
    ),
  }
);

export default function DashboardPage() {
  /* ===================================================== */
  /* ROUTE STATE */
  /* ===================================================== */

  const [route, setRoute] = useState({
    from: "Mehdipatnam",
    to: "Lords Institute of Engineering",
  });

  const [selectedMode, setSelectedMode] =
    useState<TransportMode | null>(null);

  const [searchVersion, setSearchVersion] =
    useState(0);

  /* ===================================================== */
  /* GENERATE ROUTES */
  /* ===================================================== */

  const routes = generateRoutes(
    route.from,
    route.to
  );

  /*
   * If user selected a transport option,
   * show that option.
   *
   * Otherwise show AI's highest-scoring option.
   */

  const recommendedRoute =
    selectedMode
      ? routes.find(
          (item) => item.mode === selectedMode
        ) ?? routes[0]
      : routes[0];

  /* ===================================================== */
  /* SEARCH */
  /* ===================================================== */

  const handleRouteSearch = (
    from: string,
    to: string
  ) => {
    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    if (!cleanFrom || !cleanTo) {
      return;
    }

    setRoute({
      from: cleanFrom,
      to: cleanTo,
    });

    /*
     * Reset selected transport when
     * a completely new journey is searched.
     */

    setSelectedMode(null);

    setSearchVersion(
      (previous) => previous + 1
    );
  };

  /* ===================================================== */
  /* TRANSPORT SELECTION */
  /* ===================================================== */

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

          {/* ================================================= */}
          {/* PAGE HEADER */}
          {/* ================================================= */}

          <div className="mb-7">

            <p className="text-sm font-medium text-blue-600">
              SmartCommute AI
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Smart Route Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Let AI analyze the best way to reach your destination.
            </p>

          </div>

          {/* ================================================= */}
          {/* ROUTE SEARCH */}
          {/* ================================================= */}

          <RouteSearch
            onSearch={handleRouteSearch}
          />

          {/* Current journey */}

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">

            <span className="font-medium">
              Current journey:
            </span>

            <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
              {route.from}
            </span>

            <span className="text-slate-400">
              →
            </span>

            <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
              {route.to}
            </span>

          </div>

          {/* ================================================= */}
          {/* STATS */}
          {/* ================================================= */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Average ETA"
              value={`${recommendedRoute.eta} min`}
              subtitle="AI estimated journey time"
              icon={Clock3}
            />

            <StatCard
              title="Estimated Cost"
              value={
                recommendedRoute.cost === 0
                  ? "Free"
                  : `₹${recommendedRoute.cost}`
              }
              subtitle="Based on selected route"
              icon={IndianRupee}
            />

            <StatCard
              title="AI Score"
              value={`${recommendedRoute.score}/100`}
              subtitle="Multi-factor route score"
              icon={Activity}
            />

            <StatCard
              title="Reliability"
              value={`${recommendedRoute.reliability}%`}
              subtitle={`${recommendedRoute.delayRisk} delay risk`}
              icon={TrendingDown}
            />

          </div>

          {/* ================================================= */}
          {/* RECOMMENDATION + MAP */}
          {/* ================================================= */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">

            {/* AI */}

            <section>

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedMode
                      ? "Selected Route"
                      : "Best Route For You"}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {selectedMode
                      ? "Dashboard updated for your selected transport option"
                      : "Selected using SmartCommute's route scoring engine"}
                  </p>

                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">

                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  AI Online

                </div>

              </div>

              <AIRecommendation
                route={recommendedRoute}
              />

            </section>

            {/* MAP */}

            <section>

              <div className="mb-4">

                <h2 className="text-lg font-bold text-slate-900">
                  Live Commute
                </h2>

                <p className="text-sm text-slate-500">
                  Real road route between your locations
                </p>

              </div>

              <RouteMap
                key={searchVersion}
                from={route.from}
                to={route.to}
              />

            </section>

          </div>

          {/* ================================================= */}
          {/* TRANSPORT OPTIONS */}
          {/* ================================================= */}

          <section className="mt-8">

            <div className="mb-4 flex items-end justify-between">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  Transport Options
                </h2>

                <p className="text-sm text-slate-500">
                  Click an option to analyze that journey
                </p>

              </div>

              <span className="hidden text-xs font-semibold text-slate-400 sm:block">
                {routes.length} options analyzed
              </span>

            </div>

            <div className="grid gap-4 md:grid-cols-3">

              {routes.map(
                (item, index) => (
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
                    crowd={
                      item.crowd === 0
                        ? "None"
                        : item.crowd < 40
                          ? "Low"
                          : item.crowd < 70
                            ? "Moderate"
                            : "High"
                    }
                    recommended={
                      index === 0
                    }
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
                )
              )}

            </div>

          </section>

          <LiveTransport
  from={route.from}
  to={route.to}
/>

          {/* ================================================= */}
          {/* ROUTE INTELLIGENCE */}
          {/* ================================================= */}

          <section className="mt-8">

            <div className="mb-4">

              <h2 className="text-lg font-bold text-slate-900">
                Route Intelligence
              </h2>

              <p className="text-sm text-slate-500">
                Factors considered by SmartCommute AI
              </p>

            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* TRAFFIC */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5">

                <div className="flex items-center justify-between">

                  <p className="text-xs font-semibold text-slate-500">
                    Traffic
                  </p>

                  <span className="text-xs font-bold text-slate-700">
                    {recommendedRoute.traffic}%
                  </span>

                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{
                      width: `${recommendedRoute.traffic}%`,
                    }}
                  />

                </div>

                <p className="mt-2 text-[11px] text-slate-400">
                  Current traffic impact
                </p>

              </div>

              {/* CROWD */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5">

                <div className="flex items-center justify-between">

                  <p className="text-xs font-semibold text-slate-500">
                    Crowd Level
                  </p>

                  <span className="text-xs font-bold text-slate-700">
                    {recommendedRoute.crowd}%
                  </span>

                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{
                      width: `${recommendedRoute.crowd}%`,
                    }}
                  />

                </div>

                <p className="mt-2 text-[11px] text-slate-400">
                  Predicted passenger density
                </p>

              </div>

              {/* RELIABILITY */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5">

                <div className="flex items-center justify-between">

                  <p className="text-xs font-semibold text-slate-500">
                    Reliability
                  </p>

                  <span className="text-xs font-bold text-slate-700">
                    {recommendedRoute.reliability}%
                  </span>

                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${recommendedRoute.reliability}%`,
                    }}
                  />

                </div>

                <p className="mt-2 text-[11px] text-slate-400">
                  Expected journey reliability
                </p>

              </div>

              {/* AI SCORE */}

              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">

                <div className="flex items-center justify-between">

                  <p className="text-xs font-semibold text-blue-600">
                    AI Score
                  </p>

                  <span className="text-xs font-black text-blue-700">
                    {recommendedRoute.score}/100
                  </span>

                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">

                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{
                      width: `${recommendedRoute.score}%`,
                    }}
                  />

                </div>

                <p className="mt-2 text-[11px] text-blue-600/70">
                  Combined route optimization score
                </p>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* SMART RECOMMENDATION */}
          {/* ================================================= */}

          <section className="mt-8">

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Activity size={19} />
                </div>

                <div className="flex-1">

                  <p className="text-sm font-bold text-emerald-900">
                    SmartCommute AI Recommendation
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-800/80">

                    {selectedMode ? (
                      <>
                        You selected{" "}
                        <strong>
                          {recommendedRoute.title}
                        </strong>
                        . SmartCommute is now showing
                        the analysis for this transport
                        option.
                      </>
                    ) : (
                      <>
                        SmartCommute recommends{" "}
                        <strong>
                          {recommendedRoute.title}
                        </strong>{" "}
                        with an overall score of{" "}
                        <strong>
                          {recommendedRoute.score}/100
                        </strong>
                        .
                      </>
                    )}

                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">

                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-emerald-700">
                      {recommendedRoute.eta} min ETA
                    </span>

                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-emerald-700">
                      {recommendedRoute.cost === 0
                        ? "Free"
                        : `₹${recommendedRoute.cost}`}
                    </span>

                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-emerald-700">
                      {recommendedRoute.delayRisk} delay risk
                    </span>

                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-emerald-700">
                      {recommendedRoute.reliability}% reliable
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* COMMUTE ALERT */}
          {/* ================================================= */}

          <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Activity size={19} />
                </div>

                <div>

                  <p className="text-sm font-bold text-amber-900">
                    Commute Alert
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-800/80">

                    {recommendedRoute.traffic > 70
                      ? "Heavy traffic detected on the selected route. Consider checking alternative transport options."
                      : recommendedRoute.traffic > 50
                        ? "Moderate traffic is affecting the current journey. SmartCommute has considered this in the route score."
                        : "Traffic conditions are currently favorable for the selected route."}

                  </p>

                </div>

              </div>

              <button
                type="button"
                className="whitespace-nowrap rounded-lg bg-white px-4 py-2 text-xs font-bold text-amber-700 shadow-sm ring-1 ring-amber-200 transition hover:bg-amber-100"
              >
                View Alternative
              </button>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}