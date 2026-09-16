"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

import {
  Activity,
  Clock3,
  IndianRupee,
  TrendingDown,
  Bus,
  MapPin,
  Navigation,
} from "lucide-react";

import Header from "@/components/dashboard/Header";
import StatCard from "@/components/dashboard/StatCard";
import RouteSearch from "@/components/dashboard/RouteSearch";


import {
  searchBackendRoutes,
  type BackendRoute,
  type BackendRouteResponse,
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


const LiveTransport = dynamic(
  () => import("@/components/dashboard/LiveTransport"),
  {
    ssr: false,

    loading: () => (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />

          <p className="text-sm font-semibold text-slate-700">
            Loading live transport...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Preparing vehicle information
          </p>
        </div>
      </div>
    ),
  }
);

/* ========================================================= */
/* HELPERS */
/* ========================================================= */

function getRouteScore(
  route: BackendRoute
): number {
  /*
   * Lower backend score = faster route.
   *
   * Convert it into a 0–100 presentation score.
   */
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 - route.score
      )
    )
  );
}

function formatTime(
  value: string
): string {
  if (!value) {
    return "--";
  }

  const parts = value.split(":");

  if (parts.length < 2) {
    return value;
  }

  const hour = Number(parts[0]);
  const minute = parts[1];

  const suffix =
    hour >= 12 ? "PM" : "AM";

  const displayHour =
    hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}

type RouteLeg = {
  trip_id?: string;
  route_id?: string;
  route_number: string;
  from_stop: string;
  to_stop: string;
  departure_time: string;
  arrival_time: string;
};

type TransferRouteData = BackendRoute & {
  type?: "direct" | "transfer";
  transfers?: number;
  transfer_stop?: {
    stop_id: string;
    stop_name: string;
    latitude: number;
    longitude: number;
  };
  legs?: RouteLeg[];
};

function getTransferData(route: BackendRoute): TransferRouteData {
  return route as TransferRouteData;
}

function getRouteLabel(route: BackendRoute): string {
  const data = getTransferData(route);

  if (data.legs && data.legs.length > 1) {
    return data.legs.map((leg) => leg.route_number).filter(Boolean).join(" → ");
  }

  return route.route_number;
}

/* ========================================================= */
/* DASHBOARD */
/* ========================================================= */

export default function DashboardPage() {
  /* ======================================================= */
  /* SEARCH */
  /* ======================================================= */

  const [route, setRoute] = useState({
    from: "",
    to: "",
  });

  const [backendRoutes, setBackendRoutes] =
    useState<BackendRoute[]>([]);

  const [backendResponse, setBackendResponse] =
    useState<BackendRouteResponse | null>(null);

  const [selectedRouteId, setSelectedRouteId] =
    useState<string | null>(null);

  const [routeLoading, setRouteLoading] =
    useState(false);

  const [routeError, setRouteError] =
    useState<string | null>(null);

  const [searchVersion, setSearchVersion] =
    useState(0);

  /* ======================================================= */
  /* SMART ROUTE RECOMMENDATION */
  /* ======================================================= */

  /*
   * The FastAPI backend already ranks routes using its
   * weighted optimization score, where lower is better.
   *
   * We keep that backend ranking as the source of truth
   * instead of inventing a fake AI prediction in the UI.
   */

  const recommendedRoute =
    useMemo(() => {
      if (backendRoutes.length === 0) {
        return null;
      }

      return [...backendRoutes].sort(
        (a, b) => a.score - b.score
      )[0];
    }, [backendRoutes]);

  const bestRoute = recommendedRoute;

  const selectedRoute =
    backendRoutes.find(
      (item) =>
        item.trip_id ===
        selectedRouteId
    ) ?? bestRoute;

  /*
   * Explain the recommendation using actual route data.
   */

  const recommendationReasons =
    useMemo(() => {
      if (!recommendedRoute) {
        return [];
      }

      const reasons: string[] = [];

      const fastest =
        backendRoutes.every(
          (route) =>
            route.total_minutes >=
            recommendedRoute.total_minutes
        );

      const leastWalking =
        backendRoutes.every(
          (route) =>
            route.walking_minutes >=
            recommendedRoute.walking_minutes
        );

      const leastWaiting =
        backendRoutes.every(
          (route) =>
            route.wait_minutes >=
            recommendedRoute.wait_minutes
        );

      const transferCount =
        recommendedRoute.transfers ?? 0;

      if (fastest) {
        reasons.push(
          "Shortest total scheduled journey"
        );
      } else if (
        recommendedRoute.total_minutes <=
        Math.min(
          ...backendRoutes.map(
            (route) => route.total_minutes
          )
        ) + 3
      ) {
        reasons.push(
          "Very low total travel time"
        );
      }

      if (leastWalking) {
        reasons.push(
          "Lowest walking time among available routes"
        );
      } else if (
        recommendedRoute.walking_minutes <= 10
      ) {
        reasons.push(
          "Low walking requirement"
        );
      }

      if (leastWaiting) {
        reasons.push(
          "Lowest initial waiting time"
        );
      } else if (
        recommendedRoute.wait_minutes <= 5
      ) {
        reasons.push(
          "Short initial wait"
        );
      }

      if (transferCount === 0) {
        reasons.push(
          "No bus transfer required"
        );
      } else {
        const transferWait =
          recommendedRoute.transfer_wait_minutes;

        if (
          typeof transferWait === "number" &&
          transferWait <= 5
        ) {
          reasons.push(
            "Short scheduled transfer wait"
          );
        } else {
          reasons.push(
            `${transferCount} bus transfer${transferCount > 1 ? "s" : ""}`
          );
        }
      }

      /*
       * Always provide at least one explanation.
       */
      if (reasons.length === 0) {
        reasons.push(
          "Lowest weighted optimization score"
        );
      }

      return reasons.slice(0, 4);
    }, [recommendedRoute, backendRoutes]);

  const isRecommendedSelection =
    selectedRoute?.trip_id ===
    recommendedRoute?.trip_id;

  /* ======================================================= */
  /* SEARCH HANDLER */
  /* ======================================================= */

  const handleRouteSearch = async (
    from: string,
    to: string
  ) => {
    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    if (
      !cleanFrom ||
      !cleanTo
    ) {
      return;
    }

    setRoute({
      from: cleanFrom,
      to: cleanTo,
    });

    setRouteLoading(true);
    setRouteError(null);
    setBackendRoutes([]);
    setBackendResponse(null);
    setSelectedRouteId(null);

    setSearchVersion(
      (value) => value + 1
    );

    try {
      const response =
        await searchBackendRoutes(
          cleanFrom,
          cleanTo
        );

      const routes =
        response.routes || [];

      setBackendResponse(response);
      setBackendRoutes(routes);

      // Make the latest searched journey available to Live Transport.
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "smartcommute:lastJourney",
          JSON.stringify({
            from: cleanFrom,
            to: cleanTo,
            fromCoordinates: response.requested_origin,
            toCoordinates: response.requested_destination,
          })
        );
      }

      if (routes.length === 0) {
        setRouteError(
          "No upcoming TGSRTC buses were found for this journey."
        );
      }
    } catch (error) {
      console.error(
        "SmartCommute route search error:",
        error
      );

      setRouteError(
        error instanceof Error
          ? error.message
          : "Unable to search routes."
      );

      setBackendRoutes([]);
      setBackendResponse(null);
    } finally {
      setRouteLoading(false);
    }
  };

  /* ======================================================= */
  /* METRICS */
  /* ======================================================= */

  const eta =
    selectedRoute?.total_minutes ??
    0;

  const wait =
    selectedRoute?.wait_minutes ??
    0;

  const journey =
    selectedRoute?.journey_minutes ??
    0;

  const walking =
    selectedRoute?.walking_minutes ??
    0;

  const optimizationScore =
    selectedRoute?.score ?? 0;

  const aiScore =
    selectedRoute
      ? getRouteScore(selectedRoute)
      : 0;

  /*
   * These are intentionally labeled as
   * prototype estimates because GTFS schedule
   * data does not contain live fare/crowd data.
   */
  const estimatedFare =
    selectedRoute
      ? 20
      : 0;

  const reliability =
    selectedRoute
      ? Math.max(
          60,
          Math.min(
            98,
            96 -
              Math.round(
                selectedRoute.wait_minutes *
                  0.7
              )
          )
        )
      : 0;

  const crowd =
    selectedRoute
      ? selectedRoute.wait_minutes <= 5
        ? "Low"
        : selectedRoute.wait_minutes <= 12
          ? "Moderate"
          : "High"
      : "Unknown";

  /* ======================================================= */
  /* UI */
  /* ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">

      <Header />

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">

        <div className="mx-auto max-w-7xl">

          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <div className="mb-7">

            <p className="text-sm font-medium text-blue-600">
              SmartCommute AI
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Smart Route Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Find upcoming TGSRTC buses using real GTFS schedule data.
            </p>

          </div>

          {/* ================================================= */}
          {/* SEARCH */}
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
                    Searching nearby stops and upcoming trips.
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* ================================================= */}
          {/* ERROR */}
          {/* ================================================= */}

          {routeError && !routeLoading && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Activity size={16} />
                </div>

                <div>

                  <p className="text-sm font-bold text-amber-900">
                    No route found
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    {routeError}
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* ================================================= */}
          {/* REAL TGSRTC RESULTS */}
          {/* ================================================= */}

          {backendRoutes.length > 0 && (
            <section className="mt-6">

              <div className="mb-4 flex items-end justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <h2 className="text-lg font-bold text-slate-900">
                      Upcoming TGSRTC Buses
                    </h2>

                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
  GTFS DATA
</span>

                  </div>

                  <p className="text-sm text-slate-500">
                    Real upcoming trips from the GTFS schedule.
                  </p>

                </div>

                <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 sm:block">
                  {backendRoutes.length} found
                </span>

              </div>

              {recommendedRoute && (
                <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                          <Activity size={16} />
                        </span>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            SmartCommute Recommendation
                          </p>

                          <p className="text-sm font-black text-slate-900">
                            {getRouteLabel(recommendedRoute)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-blue-800/80">
                        Lowest weighted route score among the returned upcoming trips.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:min-w-[270px]">
                      <div className="rounded-xl bg-white p-2.5 text-center">
                        <p className="text-[9px] font-bold text-slate-400">
                          TOTAL
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {recommendedRoute.total_minutes}m
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-2.5 text-center">
                        <p className="text-[9px] font-bold text-slate-400">
                          WALK
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {recommendedRoute.walking_minutes}m
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-2.5 text-center">
                        <p className="text-[9px] font-bold text-slate-400">
                          SCORE
                        </p>
                        <p className="mt-1 text-sm font-black text-blue-700">
                          {recommendedRoute.score.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                {backendRoutes
                  .slice(0, 6)
                  .map(
                    (
                      item,
                      index
                    ) => {

                      const selected =
                        selectedRoute?.trip_id ===
                        item.trip_id;

                      return (
                        <button
                          key={
                            item.trip_id
                          }
                          type="button"
                          onClick={() =>
                            setSelectedRouteId(
                              item.trip_id
                            )
                          }
                          className={`text-left rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                            selected
                              ? "border-blue-400 ring-2 ring-blue-100"
                              : "border-slate-200"
                          }`}
                        >

                          {/* TOP */}

                          <div className="flex items-start justify-between gap-3">

                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Bus size={21} />
                              </div>

                              <div>

                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  TGSRTC ROUTE
                                </p>

                                <h3 className="mt-0.5 text-xl font-black text-slate-900">
                                  {getRouteLabel(item)}
                                </h3>

                              </div>

                            </div>

                            {item.trip_id ===
                              recommendedRoute?.trip_id && (
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                                RECOMMENDED
                              </span>
                            )}

                          </div>

                          {/* JOURNEY BREAKDOWN */}
                          {(() => {
                            const data = getTransferData(item);
                            const isTransfer =
                              data.type === "transfer" ||
                              (data.transfers ?? 0) > 0 ||
                              (data.legs?.length ?? 0) > 1;

                            return (
                              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                                <div className="flex items-start gap-2">
                                  <MapPin
                                    size={15}
                                    className="mt-0.5 shrink-0 text-blue-500"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                                      Your start
                                    </p>
                                    <p className="truncate text-xs font-bold text-slate-800">
                                      {route.from}
                                    </p>
                                  </div>
                                </div>

                                <div className="ml-[7px] h-3 border-l border-dashed border-amber-300" />

                                <div className="flex items-start gap-2">
                                  <Bus
                                    size={15}
                                    className="mt-0.5 shrink-0 text-blue-600"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                                      Boarding stop
                                    </p>
                                    <p className="truncate text-xs font-bold text-slate-800">
                                      {item.origin.stop_name}
                                    </p>
                                  </div>
                                </div>

                                {isTransfer && data.legs && data.legs.length > 1 ? (
                                  <div className="mt-3 space-y-2">
                                    {data.legs.map((leg, legIndex) => (
                                      <div
                                        key={`${leg.trip_id ?? leg.route_id ?? leg.route_number}-${legIndex}`}
                                        className="rounded-lg border border-blue-100 bg-white px-3 py-2"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                                            Bus {legIndex + 1}
                                          </span>
                                          <span className="text-xs font-black text-slate-900">
                                            {leg.route_number}
                                          </span>
                                        </div>
                                        <p className="mt-1 text-[10px] text-slate-500">
                                          {leg.from_stop} → {leg.to_stop}
                                        </p>
                                        <p className="mt-1 text-[10px] font-semibold text-slate-600">
                                          {formatTime(leg.departure_time)} – {formatTime(leg.arrival_time)}
                                        </p>
                                      </div>
                                    ))}

                                    {data.transfer_stop && (
                                      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
                                        <span className="text-sm">🔄</span>
                                        <div>
                                          <p className="text-[10px] font-bold uppercase text-amber-600">
                                            Transfer
                                          </p>
                                          <p className="text-xs font-bold text-amber-900">
                                            {data.transfer_stop.stop_name}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mt-3 rounded-lg border border-blue-100 bg-white px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                                        Direct bus
                                      </span>
                                      <span className="text-xs font-black text-slate-900">
                                        {item.route_number}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-[10px] text-slate-500">
                                      {item.origin.stop_name} → {item.destination.stop_name}
                                    </p>
                                  </div>
                                )}

                                <div className="ml-[7px] h-3 border-l border-dashed border-amber-300" />

                                <div className="flex items-start gap-2">
                                  <Navigation
                                    size={15}
                                    className="mt-0.5 shrink-0 text-emerald-500"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                                      Destination stop
                                    </p>
                                    <p className="truncate text-xs font-bold text-slate-800">
                                      {item.destination.stop_name}
                                    </p>
                                  </div>
                                </div>

                                <div className="ml-[7px] h-3 border-l border-dashed border-amber-300" />

                                <div className="flex items-start gap-2">
                                  <Navigation
                                    size={15}
                                    className="mt-0.5 shrink-0 text-emerald-600"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                                      Your destination
                                    </p>
                                    <p className="truncate text-xs font-bold text-slate-800">
                                      {route.to}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* TIME */}

                          <div className="mt-4 grid grid-cols-2 gap-2">

                            <div className="rounded-xl bg-slate-50 p-3">

                              <p className="text-[10px] font-semibold text-slate-400">
                                DEPARTURE
                              </p>

                              <p className="mt-1 text-sm font-black text-slate-900">
                                {formatTime(
                                  item.departure_time
                                )}
                              </p>

                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">

                              <p className="text-[10px] font-semibold text-slate-400">
                                ARRIVAL
                              </p>

                              <p className="mt-1 text-sm font-black text-slate-900">
                                {formatTime(
                                  item.arrival_time
                                )}
                              </p>

                            </div>

                          </div>

                          {/* METRICS */}

                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">

                            <div className="rounded-xl bg-blue-50 p-2.5 text-center">

                              <p className="text-[9px] font-bold text-blue-500">
                                WAIT
                              </p>

                              <p className="mt-1 text-sm font-black text-blue-700">
                                {item.wait_minutes}m
                              </p>

                            </div>

                            <div className="rounded-xl bg-slate-50 p-2.5 text-center">

                              <p className="text-[9px] font-bold text-slate-400">
                                TRIP
                              </p>

                              <p className="mt-1 text-sm font-black text-slate-800">
                                {item.journey_minutes}m
                              </p>

                            </div>

                            <div className="rounded-xl bg-amber-50 p-2.5 text-center">

                              <p className="text-[9px] font-bold text-amber-500">
                                WALK
                              </p>

                              <p className="mt-1 text-sm font-black text-amber-700">
                                {item.walking_minutes ?? 0}m
                              </p>

                            </div>

                            <div className="rounded-xl bg-emerald-50 p-2.5 text-center">

                              <p className="text-[9px] font-bold text-emerald-500">
                                TOTAL
                              </p>

                              <p className="mt-1 text-sm font-black text-emerald-700">
                                {item.total_minutes}m
                              </p>

                            </div>

                          </div>

                          {/* STATUS */}

                          <div className="mt-3 flex items-center justify-between">

                            <span className="text-[10px] font-semibold text-slate-400">
                              {item.status}
                            </span>

                            <span className="text-[10px] font-bold text-blue-600">
                              Optimization {item.score.toFixed(1)}
                            </span>

                          </div>

                        </button>
                      );
                    }
                  )}

              </div>

            </section>
          )}

          {/* ================================================= */}
          {/* STATS */}
          {/* ================================================= */}

          {selectedRoute && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                title="Total ETA"
                value={`${eta} min`}
                subtitle="Wait + journey time"
                icon={Clock3}
              />

              <StatCard
                title="Estimated Fare"
                value={`₹${estimatedFare}`}
                subtitle="Prototype fare estimate"
                icon={IndianRupee}
              />

              <StatCard
                title="SMART ROUTE SCORE"
                value={`${aiScore}/100`}
                subtitle="Based on wait time and scheduled journey duration"
                icon={Activity}
              />

              <StatCard
                title="Schedule Reliability"
                value={`${reliability}%`}
                subtitle={`${crowd} crowd estimate`}
                icon={TrendingDown}
              />

            </div>
          )}

          {/* ================================================= */}
          {/* BEST ROUTE + MAP */}
          {/* ================================================= */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">

            {/* RECOMMENDATION */}

            <section>

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Best Route For You
                  </h2>

                  <p className="text-sm text-slate-500">
                    Ranked from the live route-search response using scheduled journey, wait, walking and transfer factors.
                  </p>

                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">

                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  GTFS Schedule

                </div>

              </div>

              {selectedRoute ? (
                <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-start gap-3">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <Bus size={23} />
                      </div>

                      <div>

                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                          AI RECOMMENDATION
                        </p>

                        <h3 className="mt-1 text-2xl font-black text-slate-900">
                          TGSRTC{" "}
                          {getRouteLabel(selectedRoute)}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {selectedRoute.trip_name}
                        </p>
                        {(() => {
                          const data = getTransferData(selectedRoute);
                          const isTransfer =
                            data.type === "transfer" ||
                            (data.transfers ?? 0) > 0 ||
                            (data.legs?.length ?? 0) > 1;

                          return (
                            <span
                              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                isTransfer
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {isTransfer
                                ? `${data.transfers ?? Math.max(1, (data.legs?.length ?? 2) - 1)} transfer${(data.transfers ?? 1) > 1 ? "s" : ""}`
                                : "Direct route"}
                            </span>
                          );
                        })()}

                      </div>

                    </div>

                    <div className="rounded-xl bg-blue-50 px-4 py-3 text-center">

                      <p className="text-[10px] font-bold text-blue-500">
                        SCORE
                      </p>

                      <p className="text-2xl font-black text-blue-700">
                        {aiScore}
                      </p>

                    </div>

                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-[10px] font-bold text-slate-400">
                        WAIT
                      </p>

                      <p className="mt-1 text-lg font-black text-slate-900">
                        {wait} min
                      </p>

                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-[10px] font-bold text-slate-400">
                        JOURNEY
                      </p>

                      <p className="mt-1 text-lg font-black text-slate-900">
                        {journey} min
                      </p>

                    </div>

                    <div className="rounded-xl bg-amber-50 p-4">

                      <p className="text-[10px] font-bold text-amber-500">
                        WALK
                      </p>

                      <p className="mt-1 text-lg font-black text-amber-700">
                        {walking} min
                      </p>

                    </div>

                    <div className="rounded-xl bg-emerald-50 p-4">

                      <p className="text-[10px] font-bold text-emerald-500">
                        TOTAL
                      </p>

                      <p className="mt-1 text-lg font-black text-emerald-700">
                        {eta} min
                      </p>

                    </div>

                  </div>

                  <div className="mt-4 rounded-xl bg-blue-50 p-4">

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-blue-900">
                        Why this route?
                      </p>

                      {isRecommendedSelection && (
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-blue-700">
                          LOWEST ROUTE SCORE
                        </span>
                      )}
                    </div>

                    <div className="mt-2 grid gap-1.5">
                      {recommendationReasons.map(
                        (reason, reasonIndex) => (
                          <p
                            key={`${reason}-${reasonIndex}`}
                            className="text-xs leading-5 text-blue-800/80"
                          >
                            ✓ {reason}
                          </p>
                        )
                      )}
                    </div>

                    <p className="mt-2 text-[10px] leading-4 text-blue-700/60">
                      Recommendation is based on the TGSRTC GTFS schedule and the backend weighted optimization score. It is not live GPS prediction.
                    </p>

                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">

                    <div className="rounded-xl border border-slate-100 p-3">

                      <p className="text-[10px] font-semibold text-slate-400">
                        DEPARTURE
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-800">
                        {formatTime(
                          selectedRoute.departure_time
                        )}
                      </p>

                    </div>

                    <div className="rounded-xl border border-slate-100 p-3">

                      <p className="text-[10px] font-semibold text-slate-400">
                        ARRIVAL
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-800">
                        {formatTime(
                          selectedRoute.arrival_time
                        )}
                      </p>

                    </div>

                  </div>

                </div>
              ) : (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">

                  <div className="text-center">

                    <Bus
                      size={35}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-bold text-slate-700">
                      Search for a route
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Upcoming TGSRTC recommendations will appear here.
                    </p>

                  </div>

                </div>
              )}

            </section>

            {/* MAP */}

            <section>

              <div className="mb-4">

                <h2 className="text-lg font-bold text-slate-900">
                  Live Commute
                </h2>

                <p className="text-sm text-slate-500">
                  Route between your selected locations.
                </p>

              </div>

              <RouteMap
                key={`${searchVersion}-${selectedRoute?.trip_id ?? "none"}`}
                from={route.from}
                to={route.to}
                fromCoordinates={
                  backendResponse?.requested_origin
                    ? {
                        latitude:
                          backendResponse.requested_origin.latitude,
                        longitude:
                          backendResponse.requested_origin.longitude,
                      }
                    : selectedRoute
                      ? {
                          latitude:
                            selectedRoute.origin.latitude,
                          longitude:
                            selectedRoute.origin.longitude,
                        }
                      : undefined
                }
                toCoordinates={
                  backendResponse?.requested_destination
                    ? {
                        latitude:
                          backendResponse.requested_destination.latitude,
                        longitude:
                          backendResponse.requested_destination.longitude,
                      }
                    : selectedRoute
                      ? {
                          latitude:
                            selectedRoute.destination.latitude,
                          longitude:
                            selectedRoute.destination.longitude,
                        }
                      : undefined
                }
              />

            </section>

          </div>

          {/* ================================================= */}
          {/* LIVE TRANSPORT */}
          {/* ================================================= */}

          <LiveTransport />

          {/* ================================================= */}
          {/* ROUTE INTELLIGENCE */}
          {/* ================================================= */}

          {selectedRoute && (
            <section className="mt-8">

              <div className="mb-4">

                <h2 className="text-lg font-bold text-slate-900">
                  Route Intelligence
                </h2>

                <p className="text-sm text-slate-500">
                  Current factors used for this recommendation.
                </p>

              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-2xl border border-slate-200 bg-white p-5">

                  <div className="flex items-center justify-between">

                    <p className="text-xs font-semibold text-slate-500">
                      Wait Time
                    </p>

                    <span className="text-xs font-bold text-slate-700">
                      {wait} min
                    </span>

                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">

                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min(
                          100,
                          wait * 5
                        )}%`,
                      }}
                    />

                  </div>

                  <p className="mt-2 text-[11px] text-slate-400">
                    Time until bus departure
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">

                  <div className="flex items-center justify-between">

                    <p className="text-xs font-semibold text-slate-500">
                      Journey
                    </p>

                    <span className="text-xs font-bold text-slate-700">
                      {journey} min
                    </span>

                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">

                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{
                        width: `${Math.min(
                          100,
                          journey * 3
                        )}%`,
                      }}
                    />

                  </div>

                  <p className="mt-2 text-[11px] text-slate-400">
                    Scheduled bus journey
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">

                  <div className="flex items-center justify-between">

                    <p className="text-xs font-semibold text-slate-500">
                      Reliability
                    </p>

                    <span className="text-xs font-bold text-slate-700">
                      {reliability}%
                    </span>

                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">

                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: `${reliability}%`,
                      }}
                    />

                  </div>

                  <p className="mt-2 text-[11px] text-slate-400">
                    Prototype schedule-based estimate
                  </p>

                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">

                  <div className="flex items-center justify-between">

                    <p className="text-xs font-semibold text-blue-600">
                      AI Score
                    </p>

                    <span className="text-xs font-black text-blue-700">
                      {aiScore}/100
                    </span>

                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">

                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${aiScore}%`,
                      }}
                    />

                  </div>

                  <p className="mt-2 text-[11px] text-blue-600/70">
                    Lower travel-time score converted to 0–100
                  </p>

                </div>

              </div>

            </section>
          )}

          {/* ================================================= */}
          {/* SMARTCOMMUTE NOTE */}
          {/* ================================================= */}

          <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Activity size={19} />
              </div>

              <div>

                <p className="text-sm font-bold text-emerald-900">
                  SmartCommute AI
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-2">
  <span>✓ GTFS schedules</span>
  <span>✓ Weighted route optimization</span>
  <span>✓ ETA estimation</span>
  <span>✓ Multi-route comparison</span>
</div>

              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}