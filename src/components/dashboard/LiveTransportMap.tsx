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
// LEAFLET ICON
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
// CONSTANTS
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const DEFAULT_CENTER: [number, number] = [
  17.3946,
  78.4347,
];

// ============================================================
// COMPONENT
// ============================================================

export default function LiveTransportMap() {
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [route, setRoute] =
    useState<TripRouteResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);

  // ----------------------------------------------------------
  // Fetch live vehicles
  // ----------------------------------------------------------

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
          `API error: ${response.status}`
        );
      }

      const data: LiveVehicleResponse =
        await response.json();

      setVehicles(data.vehicles);

      setLastUpdated(
        data.timestamp
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

  // ----------------------------------------------------------
  // Fetch trip route
  // ----------------------------------------------------------

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
          `Route API error: ${response.status}`
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

  // ----------------------------------------------------------
  // Initial load + polling
  // ----------------------------------------------------------

  useEffect(() => {

    fetchLiveVehicles();
    fetchTripRoute();

    const interval =
      setInterval(() => {
        fetchLiveVehicles();
      }, 3000);

    return () => {
      clearInterval(interval);
    };

  }, []);

  // ----------------------------------------------------------
  // Route coordinates
  // ----------------------------------------------------------

  const routeCoordinates =
    useMemo(() => {

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

  // ----------------------------------------------------------
  // Center map on active vehicle
  // ----------------------------------------------------------

  const mapCenter: [number, number] =
    vehicles.length > 0
      ? [
          vehicles[0].latitude,
          vehicles[0].longitude,
        ]
      : DEFAULT_CENTER;

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">

      {/* ---------------------------------------------------- */}
      {/* STATUS BAR */}
      {/* ---------------------------------------------------- */}

      <div className="absolute left-4 right-4 top-4 z-[1000] flex items-center justify-between">

        <div className="rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">

          <div className="flex items-center gap-2">

            <div
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
            {vehicles.length !== 1
              ? "s"
              : ""}
          </p>

        </div>

        <div className="rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">

          <div className="flex items-center gap-2">

            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

            <span className="text-xs font-semibold text-slate-700">
              UPDATING
            </span>

          </div>

          <p className="mt-1 text-[11px] text-slate-400">
            Every 3 seconds
          </p>

        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* MAP */}
      {/* ---------------------------------------------------- */}

      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* -------------------------------------------------- */}
        {/* ACTUAL GTFS ROUTE */}
        {/* -------------------------------------------------- */}

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

        {/* -------------------------------------------------- */}
        {/* LIVE VEHICLES */}
        {/* -------------------------------------------------- */}

        {vehicles.map((vehicle) => (

          <Marker
            key={vehicle.vehicle_id}
            position={[
              vehicle.latitude,
              vehicle.longitude,
            ]}
            icon={busIcon}
          >

            <Popup>

              <div className="min-w-[210px]">

                <div className="mb-2 flex items-center justify-between">

                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Route
                    </p>

                    <p className="text-lg font-bold text-slate-900">
                      {vehicle.route_number}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      vehicle.status ===
                      "On Time"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {vehicle.status}
                  </span>

                </div>

                <div className="space-y-2">

                  <div>
                    <p className="text-xs text-slate-400">
                      Vehicle
                    </p>

                    <p className="text-sm font-medium text-slate-700">
                      {vehicle.vehicle_id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Current stop
                    </p>

                    <p className="text-sm font-medium text-slate-700">
                      {vehicle.current_stop}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Next stop
                    </p>

                    <p className="text-sm font-medium text-slate-700">
                      {vehicle.next_stop ??
                        "Final stop"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Route progress
                    </p>

                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">

                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${vehicle.progress}%`,
                        }}
                      />

                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {vehicle.progress}%
                    </p>

                  </div>

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

              </div>

            </Popup>

          </Marker>

        ))}

      </MapContainer>

      {/* ---------------------------------------------------- */}
      {/* LOADING */}
      {/* ---------------------------------------------------- */}

      {loading && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-white/95 px-4 py-3 text-sm text-slate-600 shadow-lg">
          Loading live transport...
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* ERROR */}
      {/* ---------------------------------------------------- */}

      {error && !loading && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
          {error}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SOURCE */}
      {/* ---------------------------------------------------- */}

      <div className="absolute bottom-4 right-4 z-[1000] rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">

        <p className="text-[10px] uppercase tracking-wider text-slate-400">
          Data source
        </p>

        <p className="text-xs font-medium text-slate-700">
          GTFS Schedule Simulation
        </p>

        {lastUpdated && (
          <p className="mt-1 text-[10px] text-slate-400">
            Updated{" "}
            {new Date(
              lastUpdated
            ).toLocaleTimeString()}
          </p>
        )}

      </div>

    </div>
  );
}