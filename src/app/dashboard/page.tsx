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

import {
  searchBackendRoutes,
  type BackendRoute,
} from "@/lib/backend-route";

/* ========================================================= */
/* MAP */
/* ========================================================= */

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

/* ========================================================= */
/* DASHBOARD */
/* ========================================================= */

export default function DashboardPage() {
  /* ======================================================= */
  /* ROUTE STATE */
  /* ======================================================= */

  const [route, setRoute] = useState({
    from: "Mehdipatnam",
    to: "Lords Institute of Engineering",
  });

  const [selectedMode, setSelectedMode] =
    useState<TransportMode | null>(null);

  const [searchVersion, setSearchVersion] =
    useState(0);

  /* ======================================================= */
  /* BACKEND ROUTE STATE */
  /* ======================================================= */

  const [backendRoutes, setBackendRoutes] =
    useState<BackendRoute[]>([]);

  const [routeLoading, setRouteLoading] =
    useState(false);

  const [routeError, setRouteError] =
    useState<string | null>(null);

  /* ======================================================= */
  /* LOCAL ROUTES */
  /* ======================================================= */

  /*
   * Keep the existing local route engine as a
   * fallback for the dashboard UI.
   */
  const localRoutes = generateRoutes(
    route.from,
    route.to
  );

  /*
   * Once the backend returns real TGSRTC routes,
   * use the backend data for the main route metrics.
   *
   * Otherwise fall back to the existing route engine.
   */

  const backendBestRoute =
    backendRoutes.length > 0
      ? backendRoutes[0]
      : null;

  /* ======================================================= */
  /* SEARCH */
  /* ======================================================= */

  const handleRouteSearch = async (
    from: string,
    to: string
  ) => {
    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    if (!cleanFrom || !cleanTo) {
      return;
    }

    /* Update displayed journey */

    setRoute({
      from: cleanFrom,
      to: cleanTo,
    });

    /* Reset transport selection */

    setSelectedMode(null);

    /* Clear previous search state */

    setRouteError(null);
    setBackendRoutes([]);

    setRouteLoading(true);

    /*
     * Force map refresh.
     */

    setSearchVersion(
      (previous) => previous + 1
    );

    try {
      /*
       * Search the deployed FastAPI backend.
       */

      const response =
        await searchBackendRoutes(
          cleanFrom,
          cleanTo
        );

      setBackendRoutes(
        response.routes || []
      );

      if (
        !response.routes ||
        response.routes.length === 0
      ) {
        setRouteError(
          "No upcoming TGSRTC routes were found for this journey."
        );
      }
    } catch (error) {
      console.error(
        "SmartCommute route search failed:",
        error
      );

      setBackendRoutes([]);

      setRouteError(
        error instanceof Error
          ? error.message
          : "Unable to find routes right now."
      );
    } finally {
      setRouteLoading(false);
    }
  };

  /* ======================================================= */
  /* TRANSPORT SELECTION */
  /* ======================================================= */

  const handleTransportSelect = (
    mode: TransportMode
  ) => {
    setSelectedMode(mode);
  };

  /* ======================================================= */
  /* LOCAL RECOMMENDED ROUTE */
  /* ======================================================= */

  const recommendedLocalRoute =
    selectedMode
      ? localRoutes.find(
          (item) =>
            item.mode === selectedMode
        ) ?? localRoutes[0]
      : localRoutes[0];

  /* ======================================================= */
  /* DISPLAY METRICS */
  /* ======================================================= */

  /*
   * The current route-engine structure expects:
   *
   * eta
   * cost
   * score
   * reliability
   * traffic
   * crowd
   * delayRisk
   *
   * The GTFS backend currently provides:
   *
   * wait_minutes
   * journey_minutes
   * walking_minutes
   * total_minutes
   * score
   *
   * Therefore we use real GTFS values where available
   * and retain the existing dashboard intelligence
   * values for fields not currently provided by GTFS.
   */

  const displayEta =
    backendBestRoute
      ? backendBestRoute.total_minutes
      : recommendedLocalRoute.eta;

  const displayCost =
    backendBestRoute
      ? 20
      : recommendedLocalRoute.cost;

  const displayScore =
    backendBestRoute
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              100 -
                backendBestRoute.total_minutes
            )
          )
        )
      : recommendedLocalRoute.score;

  const displayReliability =
    recommendedLocalRoute.reliability;

  const displayTraffic =
    recommendedLocalRoute.traffic;

  const displayCrowd =
    recommendedLocalRoute.crowd;

  const displayDelayRisk =
    recommendedLocalRoute.delayRisk;

  /* ======================================================= */
  /* MAIN UI */
  /* ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =================================================== */}
      {/* HEADER */}
      {/* =================================================== */}

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

          {/* ================================================= */}
          {/* CURRENT JOURNEY */}
          {/* ================================================= */}

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
          {/* LOADING */}
          {/* ================================================= */}

          {routeLoading && (
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">

              <div className="flex items-center gap-3">

                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

                <div>

                  <p className="text-sm font-bold text-blue-900">
                    Finding TGSRTC routes...
                  </p>

                  <p className="text-xs text-blue-700">
                    Checking GTFS schedules and upcoming buses.
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* ================================================= */}
          {/* ERROR / NOTICE */}
          {/* ================================================= */}

          {routeError && !routeLoading && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Activity size={16} />
                </div>

                <div>

                  <p className="text-sm font-bold text-amber-900">
                    Route search notice
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    {routeError}
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* ================================================= */}
          {/* REAL GTFS RESULTS */}
          {/* ================================================= */}

          {backendRoutes.length > 0 && (
            <section className="mt-6">

              <div className="mb-4 flex items-end justify-between">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Live TGSRTC Route Options
                  </h2>

                  <p className="text-sm text-slate-500">
                    Upcoming buses found from the deployed GTFS backend.
                  </p>

                </div>

                <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 sm:block">
                  {backendRoutes.length} routes found
                </span>

              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                {backendRoutes
                  .slice(0, 6)
                  .map(
                    (item, index) => (
                      <div
                        key={`${item.trip_id}-${index}`}
                        className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                          index === 0
                            ? "border-blue-300 ring-1 ring-blue-100"
                            : "border-slate-200"
                        }`}
                      >

                        {/* HEADER */}

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Bus Route
                            </p>

                            <h3 className="mt-1 text-xl font-black text-slate-900">
                              {item.route_number}
                            </h3>

                          </div>

                          {index === 0 && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                              BEST MATCH
                            </span>
                          )}

                        </div>

                        {/* ROUTE */}

                        <div className="mt-4 space-y-2">

                          <div className="flex items-start justify-between gap-4 text-xs">

                            <span className="text-slate-500">
                              Boarding
                            </span>

                            <span className="text-right font-semibold text-slate-800">
                              {item.origin.stop_name}
                            </span>

                          </div>

                          <div className="flex items-start justify-between gap-4 text-xs">

                            <span className="text-slate-500">
                              Destination
                            </span>

                            <span className="text-right font-semibold text-slate-800">
                              {item.destination.stop_name}
                            </span>

                          </div>

                          <div className="flex items-center justify-between text-xs">

                            <span className="text-slate-500">
                              Departure
                            </span>

                            <span className="font-semibold text-slate-800">
                              {item.departure_time}
                            </span>

                          </div>

                          <div className="flex items-center justify-between text-xs">

                            <span className="text-slate-500">
                              Arrival
                            </span>

                            <span className="font-semibold text-slate-800">
                              {item.arrival_time}
                            </span>

                          </div>

                        </div>

                        {/* METRICS */}

                        <div className="mt-4 grid grid-cols-3 gap-2">

                          <div className="rounded-xl bg-slate-50 p-3 text-center">

                            <p className="text-[10px] font-semibold text-slate-400">
                              WAIT
                            </p>

                            <p className="mt-1 text-sm font-black text-slate-900">
                              {item.wait_minutes}m
                            </p>

                          </div>

                          <div className="rounded-xl bg-slate-50 p-3 text-center">

                            <p className="text-[10px] font-semibold text-slate-400">
                              JOURNEY
                            </p>

                            <p className="mt-1 text-sm font-black text-slate-900">
                              {item.journey_minutes}m
                            </p>

                          </div>

                          <div className="rounded-xl bg-blue-50 p-3 text-center">

                            <p className="text-[10px] font-semibold text-blue-500">
                              TOTAL
                            </p>

                            <p className="mt-1 text-sm font-black text-blue-700">
                              {item.total_minutes}m
                            </p>

                          </div>

                        </div>

                      </div>
                    )
                  )}

              </div>

            </section>
          )}

          {/* ================================================= */}
          {/* STATS */}
          {/* ================================================= */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Average ETA"
              value={`${displayEta} min`}
              subtitle={
                backendBestRoute
                  ? "GTFS-based route estimate"
                  : "AI estimated journey time"
              }
              icon={Clock3}
            />

            <StatCard
              title="Estimated Cost"
              value={
                displayCost === 0
                  ? "Free"
                  : `₹${displayCost}`
              }
              subtitle={
                backendBestRoute
                  ? "Prototype TGSRTC estimate"
                  : "Based on selected route"
              }
              icon={IndianRupee}
            />

            <StatCard
              title="AI Score"
              value={`${displayScore}/100`}
              subtitle={
                backendBestRoute
                  ? "GTFS route optimization score"
                  : "Multi-factor route score"
              }
              icon={Activity}
            />

            <StatCard
              title="Reliability"
              value={`${displayReliability}%`}
              subtitle={`${displayDelayRisk} delay risk`}
              icon={TrendingDown}
            />

          </div>

          {/* ================================================= */}
          {/* RECOMMENDATION + MAP */}
          {/* ================================================= */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">

            {/* ================================================= */}
            {/* AI RECOMMENDATION */}
            {/* ================================================= */}

            <section>

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedMode
                      ? "Selected Route"
                      : "Best Route For You"}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {backendBestRoute
                      ? `TGSRTC route ${backendBestRoute.route_number} is currently available.`
                      : selectedMode
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
                route={recommendedLocalRoute}
              />

            </section>

            {/* ================================================= */}
            {/* MAP */}
            {/* ================================================= */}

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
                {backendRoutes.length > 0
                  ? `${backendRoutes.length} TGSRTC routes analyzed`
                  : `${localRoutes.length} options analyzed`}
              </span>

            </div>

            <div className="grid gap-4 md:grid-cols-3">

              {localRoutes.map(
                (item, index) => (
                  <TransportCard
                    key={item.mode}
                    type={item.mode}
                    title={
                      index === 0 &&
                      backendBestRoute
                        ? `TGSRTC ${backendBestRoute.route_number}`
                        : item.title
                    }
                    eta={
                      index === 0 &&
                      backendBestRoute
                        ? `${backendBestRoute.total_minutes} min`
                        : `${item.eta} min`
                    }
                    cost={
                      index === 0 &&
                      backendBestRoute
                        ? "₹20"
                        : item.cost === 0
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
                      recommendedLocalRoute.mode ===
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

          {/* ================================================= */}
          {/* LIVE TRANSPORT */}
          {/* ================================================= */}

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
                    {displayTraffic}%
                  </span>

                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{
                      width: `${displayTraffic}%`,
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
                    {displayCrowd}%
                  </span>

                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{
                      width: `${displayCrowd}%`,
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
                    {displayReliability}%
                  </span>

                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${displayReliability}%`,
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
                    {displayScore}/100
                  </span>

                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">

                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{
                      width: `${displayScore}%`,
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

                    {backendBestRoute ? (
                      <>
                        The next available TGSRTC route is{" "}
                        <strong>
                          {backendBestRoute.route_number}
                        </strong>
                        . It departs from{" "}
                        <strong>
                          {backendBestRoute.origin.stop_name}
                        </strong>{" "}
                        at{" "}
                        <strong>
                          {backendBestRoute.departure_time}
                        </strong>{" "}
                        and reaches{" "}
                        <strong>
                          {backendBestRoute.destination.stop_name}
                        </strong>{" "}
                        at{" "}
                        <strong>
                          {backendBestRoute.arrival_time}
                        </strong>
                        .
                      </>
                    ) : selectedMode ? (
                      <>
                        You selected{" "}
                        <strong>
                          {recommendedLocalRoute.title}
                        </strong>
                        . SmartCommute is now showing
                        the analysis for this transport
                        option.
                      </>
                    ) : (
                      <>
                        SmartCommute recommends{" "}
                        <strong>
                          {recommendedLocalRoute.title}
                        </strong>{" "}
                        with an overall score of{" "}
                        <strong>
                          {recommendedLocalRoute.score}/100
                        </strong>
                        .
                      </>
                    )}

                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">

                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-emerald-700">
                      {backendBestRoute
                        ? `${backendBestRoute.total_minutes} min total`
                        : `${recommendedLocalRoute.eta} min ETA`}
                    </span>

                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-emerald-700">
                      {displayCost === 0
                        ? "Free"
                        : `₹${displayCost}`}
                    </span>

                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-emerald-700">
                      {displayDelayRisk} delay risk
                    </span>

                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-emerald-700">
                      {displayReliability}% reliable
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

                    {displayTraffic > 70
                      ? "Heavy traffic detected on the selected route. Consider checking alternative transport options."
                      : displayTraffic > 50
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