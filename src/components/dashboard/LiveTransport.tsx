
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import {
  Activity,
  Bus,
  Clock3,
  MapPin,
  RefreshCw,
  Route as RouteIcon,
} from "lucide-react";

import "leaflet/dist/leaflet.css";

/* ============================================================
   TYPES
============================================================ */

interface LiveVehicle {
  vehicle_id: string;
  trip_id: string;
  route_number: string;
  status: string;

  latitude: number;
  longitude: number;

  current_stop: string;
  next_stop: string | null;

  progress: number;

  scheduled_next_arrival?: string;
  updated_at?: string;
}

interface LiveVehicleResponse {
  timestamp: string;
  source: string;
  vehicles: LiveVehicle[];
}

/* ============================================================
   PROPS
============================================================ */

interface LiveTransportProps {
  selectedBus?: string | null;
  onSelectBus?: (busId: string | null) => void;
}

/* ============================================================
   API
============================================================ */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "";

/* ============================================================
   DEFAULT MAP LOCATION
============================================================ */

const DEFAULT_CENTER: [number, number] = [
  17.3946,
  78.4347,
];

/* ============================================================
   BUS ICON
============================================================ */

const busIcon = L.divIcon({
  className: "",
  html: `
    <div
      style="
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: #2563eb;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 21px;
      "
    >
      🚌
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -21],
});

/* ============================================================
   HELPERS
============================================================ */

function getStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("delay") ||
    normalized.includes("late")
  ) {
    return {
      badge: "bg-amber-100 text-amber-700",
      dot: "bg-amber-500",
      label: "Delayed",
    };
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("offline")
  ) {
    return {
      badge: "bg-red-100 text-red-700",
      dot: "bg-red-500",
      label: "Unavailable",
    };
  }

  return {
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    label:
      status && status !== "Unknown"
        ? status
        : "On Schedule",
  };
}

function formatTime(value?: string) {
  if (!value) return "--";

  const parts = value.split(":");

  if (parts.length < 2) {
    return value;
  }

  const hour = Number(parts[0]);
  const minute = parts[1];

  if (Number.isNaN(hour)) {
    return value;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function LiveTransport({
  selectedBus = null,
  onSelectBus,
}: LiveTransportProps) {
  const [vehicles, setVehicles] = useState<
    LiveVehicle[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);

  const [source, setSource] =
    useState<string>("GTFS Schedule Simulation");

  /* ==========================================================
     FETCH VEHICLES
  ========================================================== */

  const fetchVehicles = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/vehicles/live`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Vehicle API returned ${response.status}`
          );
        }

        const data: LiveVehicleResponse =
          await response.json();

        setVehicles(data.vehicles || []);

        setLastUpdated(
          data.timestamp || null
        );

        setSource(
          data.source ||
            "GTFS Schedule Simulation"
        );

        setError(null);
      } catch (err) {
        console.error(
          "Live vehicle API error:",
          err
        );

        setError(
          "Unable to connect to the transport service."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* ==========================================================
     INITIAL LOAD + AUTO REFRESH
  ========================================================== */

  useEffect(() => {
    fetchVehicles();

    const interval = setInterval(() => {
      fetchVehicles();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchVehicles]);

  /* ==========================================================
     SELECTED VEHICLE
  ========================================================== */

  const selectedVehicle =
    vehicles.find(
      (vehicle) =>
        vehicle.vehicle_id === selectedBus
    ) || null;

  /* ==========================================================
     MAP CENTER
  ========================================================== */

  const mapCenter: [number, number] =
    selectedVehicle
      ? [
          selectedVehicle.latitude,
          selectedVehicle.longitude,
        ]
      : vehicles.length > 0
        ? [
            vehicles[0].latitude,
            vehicles[0].longitude,
          ]
        : DEFAULT_CENTER;

  /* ==========================================================
     STATS
  ========================================================== */

  const stats = useMemo(() => {
    const active = vehicles.length;

    const delayed = vehicles.filter(
      (vehicle) =>
        getStatusClasses(vehicle.status)
          .label === "Delayed"
    ).length;

    const onSchedule = vehicles.filter(
      (vehicle) =>
        getStatusClasses(vehicle.status)
          .label === "On Schedule"
    ).length;

    return {
      active,
      delayed,
      onSchedule,
    };
  }, [vehicles]);

  /* ==========================================================
     UPDATED TIME
  ========================================================== */

  const formattedUpdatedTime =
    lastUpdated
      ? new Date(
          lastUpdated
        ).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        })
      : "--";

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <section className="space-y-5">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
              Schedule tracking
            </span>
          </div>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Transport Status
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Monitor scheduled buses, route progress,
            current stops and upcoming arrivals across
            the Hyderabad network.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchVehicles(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={15}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh status"}
        </button>
      </div>

      {/* ======================================================
          DATA SOURCE NOTICE
      ====================================================== */}

      <div className="flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Activity size={15} />

          <span>
            <strong>{source}</strong>
            {" — "}
            this demo uses GTFS schedule data rather
            than real-time GPS telemetry.
          </span>
        </div>

        <span className="whitespace-nowrap text-blue-600">
          Updated {formattedUpdatedTime}
        </span>
      </div>

      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active buses
              </p>

              <p className="mt-1 text-2xl font-black text-slate-900">
                {stats.active}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Bus size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                On schedule
              </p>

              <p className="mt-1 text-2xl font-black text-slate-900">
                {stats.onSchedule}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Clock3 size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Delayed
              </p>

              <p className="mt-1 text-2xl font-black text-slate-900">
                {stats.delayed}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Activity size={20} />
            </div>
          </div>
        </div>

      </div>

      {/* ======================================================
          MAP
      ====================================================== */}

      <div className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">

        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={true}
          className="h-full w-full"
        >

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ================================================
              VEHICLES
          ================================================= */}

          {vehicles.map((vehicle) => {
            const isSelected =
              selectedBus ===
              vehicle.vehicle_id;

            const status =
              getStatusClasses(
                vehicle.status
              );

            return (
              <Marker
                key={vehicle.vehicle_id}
                position={[
                  vehicle.latitude,
                  vehicle.longitude,
                ]}
                icon={busIcon}
                eventHandlers={{
                  click: () => {
                    onSelectBus?.(
                      vehicle.vehicle_id
                    );
                  },
                }}
              >
                <Popup>

                  <div className="min-w-[235px]">

                    {/* ROUTE */}

                    <div className="mb-4 flex items-start justify-between gap-3">

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Route
                        </p>

                        <p className="text-xl font-black text-slate-900">
                          {vehicle.route_number}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${status.badge}`}
                      >
                        {status.label}
                      </span>

                    </div>

                    {/* DETAILS */}

                    <div className="space-y-3">

                      <div className="flex gap-3">
                        <MapPin
                          size={16}
                          className="mt-0.5 text-blue-600"
                        />

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Current stop
                          </p>

                          <p className="text-sm font-semibold text-slate-800">
                            {vehicle.current_stop ||
                              "Unknown"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <RouteIcon
                          size={16}
                          className="mt-0.5 text-emerald-600"
                        />

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Next stop
                          </p>

                          <p className="text-sm font-semibold text-slate-800">
                            {vehicle.next_stop ||
                              "Final stop"}
                          </p>
                        </div>
                      </div>

                      {vehicle.scheduled_next_arrival && (
                        <div className="flex gap-3">
                          <Clock3
                            size={16}
                            className="mt-0.5 text-violet-600"
                          />

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Scheduled arrival
                            </p>

                            <p className="text-sm font-semibold text-slate-800">
                              {formatTime(
                                vehicle.scheduled_next_arrival
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* PROGRESS */}

                    <div className="mt-4">

                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Route progress
                        </span>

                        <span className="text-xs font-bold text-slate-700">
                          {Math.round(
                            Math.min(
                              Math.max(
                                vehicle.progress || 0,
                                0
                              ),
                              100
                            )
                          )}
                          %
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                vehicle.progress || 0,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />
                      </div>

                    </div>

                    {/* VEHICLE ID */}

                    <p className="mt-3 text-[10px] text-slate-400">
                      Vehicle {vehicle.vehicle_id}
                    </p>

                    {/* SELECT */}

                    {onSelectBus && (
                      <button
                        type="button"
                        onClick={() =>
                          onSelectBus(
                            vehicle.vehicle_id
                          )
                        }
                        className="mt-4 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                      >
                        {isSelected
                          ? "Selected"
                          : "Select vehicle"}
                      </button>
                    )}

                  </div>

                </Popup>
              </Marker>
            );
          })}

        </MapContainer>

        {/* MAP STATUS */}

        <div className="absolute left-4 right-4 top-4 z-[1000] flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

          <div className="rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">

            <div className="flex items-center gap-2">

              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  error
                    ? "bg-red-500"
                    : "bg-emerald-500"
                }`}
              />

              <span className="text-sm font-bold text-slate-800">
                {error
                  ? "Connection issue"
                  : "Transport network"}
              </span>

            </div>

            <p className="mt-1 text-xs text-slate-500">
              {vehicles.length} scheduled vehicle
              {vehicles.length === 1
                ? ""
                : "s"} available
            </p>

          </div>

          <div className="rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />

              <span className="text-xs font-bold text-slate-700">
                AUTO REFRESH
              </span>

            </div>

            <p className="mt-1 text-[11px] text-slate-400">
              Every 10 seconds
            </p>

          </div>

        </div>

        {/* LOADING */}

        {loading && (
          <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 rounded-xl bg-white/95 px-4 py-3 text-sm font-semibold text-slate-600 shadow-lg">
            <RefreshCw
              size={15}
              className="animate-spin"
            />
            Loading transport data...
          </div>
        )}

        {/* ERROR */}

        {error && !loading && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-lg">
            {error}
          </div>
        )}

        {/* SELECTED VEHICLE */}

        {selectedVehicle && !error && (
          <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-lg">
                🚌
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Selected vehicle
                </p>

                <p className="text-sm font-black text-slate-800">
                  Route{" "}
                  {selectedVehicle.route_number}
                </p>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ======================================================
          BUS LIST
      ====================================================== */}

      {!loading && vehicles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

          {vehicles.map((vehicle) => {
            const status =
              getStatusClasses(
                vehicle.status
              );

            const isSelected =
              selectedBus ===
              vehicle.vehicle_id;

            return (
              <button
                key={vehicle.vehicle_id}
                type="button"
                onClick={() =>
                  onSelectBus?.(
                    vehicle.vehicle_id
                  )
                }
                className={`text-left rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-slate-200"
                }`}
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                      🚌
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Route
                      </p>

                      <p className="text-lg font-black text-slate-900">
                        {vehicle.route_number}
                      </p>
                    </div>

                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status.badge}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                      />

                      {status.label}
                    </span>
                  </span>

                </div>

                <div className="mt-5 space-y-3">

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Current stop
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {vehicle.current_stop ||
                        "Unknown"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Next stop
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {vehicle.next_stop ||
                        "Final stop"}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Progress
                      </p>

                      <p className="text-xs font-bold text-slate-700">
                        {Math.round(
                          Math.min(
                            Math.max(
                              vehicle.progress || 0,
                              0
                            ),
                            100
                          )
                        )}
                        %
                      </p>
                    </div>

                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              vehicle.progress || 0,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {vehicle.scheduled_next_arrival && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">

                      <span className="text-xs text-slate-400">
                        Next scheduled arrival
                      </span>

                      <span className="text-xs font-bold text-slate-700">
                        {formatTime(
                          vehicle.scheduled_next_arrival
                        )}
                      </span>

                    </div>
                  )}

                </div>

              </button>
            );
          })}

        </div>
      )}

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {!loading &&
        !error &&
        vehicles.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <Bus
                size={22}
                className="text-slate-500"
              />
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-900">
              No scheduled vehicles found
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Try refreshing the transport data.
            </p>

          </div>
        )}

    </section>
  );
}
