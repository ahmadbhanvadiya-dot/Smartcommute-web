"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Polyline,
} from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

// ============================================================
// TYPES
// ============================================================

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

interface RouteStop {
  stop_sequence: number;
  stop_id: string;
  stop_name: string;
  latitude: number;
  longitude: number;
  arrival_time: string;
  departure_time: string;
}

interface TripRouteResponse {
  trip_id: string;
  route_id: string;
  route_number: string;
  trip_name: string;
  service_id: string;
  direction_id: number;
  stop_count: number;
  stops: RouteStop[];
}

// ============================================================
// PROPS
// ============================================================

interface LiveTransportMapProps {
  selectedBus?: string | null;
  onSelectBus?: (busId: string | null) => void;
}

// ============================================================
// API
// ============================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "";

// ============================================================
// MAP DEFAULTS
// ============================================================

const DEFAULT_CENTER: [number, number] = [
  17.3946,
  78.4347,
];

// ============================================================
// BUS ICON
// ============================================================

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

// ============================================================
// COMPONENT
// ============================================================

export default function LiveTransportMap({
  selectedBus = null,
  onSelectBus,
}: LiveTransportMapProps) {
  const [vehicles, setVehicles] = useState<
    LiveVehicle[]
  >([]);

  const [route, setRoute] =
    useState<TripRouteResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);

  // ==========================================================
  // FETCH LIVE VEHICLES
  // ==========================================================

  const fetchLiveVehicles = async () => {
    try {
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

      setError(null);
    } catch (err) {
      console.error(
        "Live vehicle API error:",
        err
      );

      setError(
        "Unable to connect to live transport service."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // FETCH TRIP ROUTE
  // ==========================================================

  const fetchTripRoute = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/trips/41828307/route`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Route API returned ${response.status}`
        );
      }

      const data: TripRouteResponse =
        await response.json();

      setRoute(data);
    } catch (err) {
      console.error(
        "Trip route API error:",
        err
      );
    }
  };

  // ==========================================================
  // INITIAL LOAD + POLLING
  // ==========================================================

  useEffect(() => {
    fetchLiveVehicles();
    fetchTripRoute();

    const interval = setInterval(() => {
      fetchLiveVehicles();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ==========================================================
  // ROUTE COORDINATES
  // ==========================================================

  const routeCoordinates = useMemo(() => {
    if (!route) {
      return [];
    }

    return route.stops.map(
      (stop) =>
        [
          stop.latitude,
          stop.longitude,
        ] as [number, number]
    );
  }, [route]);

  // ==========================================================
  // MAP CENTER
  // ==========================================================

  const mapCenter: [number, number] =
    vehicles.length > 0
      ? [
          vehicles[0].latitude,
          vehicles[0].longitude,
        ]
      : DEFAULT_CENTER;

  // ==========================================================
  // SELECTED VEHICLE
  // ==========================================================

  const selectedVehicle =
    vehicles.find(
      (vehicle) =>
        vehicle.vehicle_id === selectedBus
    ) || null;

  // ==========================================================
  // FORMAT UPDATED TIME
  // ==========================================================

  const formattedUpdatedTime =
    lastUpdated
      ? new Date(
          lastUpdated
        ).toLocaleTimeString()
      : null;

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">

      {/* ==================================================== */}
      {/* TOP LEFT STATUS */}
      {/* ==================================================== */}

      <div className="absolute left-4 right-4 top-4 z-[1000] flex items-start justify-between gap-3">

        <div className="rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">

          <div className="flex items-center gap-2">

            <span
              className={`h-2.5 w-2.5 rounded-full ${
                error
                  ? "bg-red-500"
                  : "bg-green-500"
              }`}
            />

            <span className="text-sm font-semibold text-slate-800">
              {error
                ? "Connection Error"
                : "Live Transport"}
            </span>

          </div>

          <p className="mt-1 text-xs text-slate-500">
            {vehicles.length} active vehicle
            {vehicles.length === 1
              ? ""
              : "s"}
          </p>

        </div>

        {/* ================================================== */}
        {/* LIVE INDICATOR */}
        {/* ================================================== */}

        <div className="rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">

          <div className="flex items-center gap-2">

            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

            <span className="text-xs font-semibold text-slate-700">
              LIVE
            </span>

          </div>

          <p className="mt-1 text-[11px] text-slate-400">
            Updates every 3 seconds
          </p>

        </div>

      </div>

      {/* ==================================================== */}
      {/* MAP */}
      {/* ==================================================== */}

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

        {/* ================================================== */}
        {/* ACTUAL GTFS ROUTE */}
        {/* ================================================== */}

        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: "#2563eb",
              weight: 5,
              opacity: 0.65,
            }}
          />
        )}

        {/* ================================================== */}
        {/* LIVE VEHICLES */}
        {/* ================================================== */}

        {vehicles.map((vehicle) => {
          const isSelected =
            selectedBus ===
            vehicle.vehicle_id;

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

                <div className="min-w-[220px]">

                  {/* -------------------------------------- */}
                  {/* ROUTE */}
                  {/* -------------------------------------- */}

                  <div className="mb-3 flex items-start justify-between gap-3">

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Route
                      </p>

                      <p className="text-xl font-bold text-slate-900">
                        {vehicle.route_number}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        vehicle.status ===
                        "On Time"
                          ? "bg-green-100 text-green-700"
                          : vehicle.status ===
                              "Delayed"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {vehicle.status}
                    </span>

                  </div>

                  {/* -------------------------------------- */}
                  {/* VEHICLE */}
                  {/* -------------------------------------- */}

                  <div className="space-y-3">

                    <div>
                      <p className="text-xs text-slate-400">
                        Vehicle
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {vehicle.vehicle_id}
                      </p>
                    </div>

                    {/* ------------------------------------ */}
                    {/* CURRENT STOP */}
                    {/* ------------------------------------ */}

                    <div>
                      <p className="text-xs text-slate-400">
                        Current stop
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {vehicle.current_stop}
                      </p>
                    </div>

                    {/* ------------------------------------ */}
                    {/* NEXT STOP */}
                    {/* ------------------------------------ */}

                    <div>
                      <p className="text-xs text-slate-400">
                        Next stop
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {vehicle.next_stop ||
                          "Final stop"}
                      </p>
                    </div>

                    {/* ------------------------------------ */}
                    {/* PROGRESS */}
                    {/* ------------------------------------ */}

                    <div>

                      <div className="flex items-center justify-between">

                        <p className="text-xs text-slate-400">
                          Route progress
                        </p>

                        <p className="text-xs font-semibold text-slate-600">
                          {vehicle.progress}%
                        </p>

                      </div>

                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">

                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                vehicle.progress,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* ------------------------------------ */}
                    {/* SCHEDULE */}
                    {/* ------------------------------------ */}

                    {vehicle.scheduled_next_arrival && (
                      <div>
                        <p className="text-xs text-slate-400">
                          Scheduled arrival
                        </p>

                        <p className="text-sm font-medium text-slate-700">
                          {
                            vehicle.scheduled_next_arrival
                          }
                        </p>
                      </div>
                    )}

                  </div>

                  {/* -------------------------------------- */}
                  {/* SELECT BUTTON */}
                  {/* -------------------------------------- */}

                  {onSelectBus && (
                    <button
                      type="button"
                      onClick={() =>
                        onSelectBus(
                          vehicle.vehicle_id
                        )
                      }
                      className="mt-4 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                    >
                      {isSelected
                        ? "Selected"
                        : "Select Vehicle"}
                    </button>
                  )}

                </div>

              </Popup>

            </Marker>
          );
        })}

      </MapContainer>

      {/* ==================================================== */}
      {/* LOADING */}
      {/* ==================================================== */}

      {loading && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-white/95 px-4 py-3 text-sm text-slate-600 shadow-lg">
          Loading live transport...
        </div>
      )}

      {/* ==================================================== */}
      {/* ERROR */}
      {/* ==================================================== */}

      {error && !loading && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
          {error}
        </div>
      )}

      {/* ==================================================== */}
      {/* SELECTED VEHICLE */}
      {/* ==================================================== */}

      {selectedVehicle && !error && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">

          <div className="flex items-center gap-2">

            <span className="text-lg">
              🚌
            </span>

            <div>
              <p className="text-xs text-slate-400">
                Selected vehicle
              </p>

              <p className="text-sm font-bold text-slate-800">
                Route{" "}
                {selectedVehicle.route_number}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* DATA SOURCE */}
      {/* ==================================================== */}

      <div className="absolute bottom-4 right-4 z-[1000] rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">

        <p className="text-[10px] uppercase tracking-wider text-slate-400">
          Data source
        </p>

        <p className="text-xs font-medium text-slate-700">
          GTFS Schedule Simulation
        </p>

        {formattedUpdatedTime && (
          <p className="mt-1 text-[10px] text-slate-400">
            Updated {formattedUpdatedTime}
          </p>
        )}

      </div>

    </div>
  );
}