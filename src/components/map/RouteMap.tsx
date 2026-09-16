"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { BackendRoute } from "@/lib/backend-route";

interface LocationPoint {
  lat: number;
  lon: number;
  displayName: string;
}

interface RouteMapProps {
  from: string;
  to: string;

  fromCoordinates?: {
    latitude: number;
    longitude: number;
  };

  toCoordinates?: {
    latitude: number;
    longitude: number;
  };

  /**
   * Selected route returned by the SmartCommute backend.
   * When available, the map also shows the nearest GTFS
   * boarding and destination stops.
   */
  selectedRoute?: BackendRoute | null;
}

interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

/*
|--------------------------------------------------------------------------
| Hyderabad fallback locations
|--------------------------------------------------------------------------
*/

const FALLBACK_LOCATIONS: Record<
  string,
  LocationPoint
> = {
  mehdipatnam: {
    lat: 17.3946,
    lon: 78.4347,
    displayName: "Mehdipatnam, Hyderabad",
  },

  "lords institute of engineering": {
    lat: 17.34217,
    lon: 78.36760,
    displayName:
      "Lords Institute of Engineering & Technology, Himayath Sagar, Hyderabad",
  },

  "lords institute of engineering and technology": {
    lat: 17.34217,
    lon: 78.36760,
    displayName:
      "Lords Institute of Engineering & Technology, Himayath Sagar, Hyderabad",
  },

  lords: {
    lat: 17.34217,
    lon: 78.36760,
    displayName:
      "Lords Institute of Engineering & Technology, Hyderabad",
  },

  "charminar": {
    lat: 17.3616,
    lon: 78.4747,
    displayName: "Charminar, Hyderabad",
  },

  "hitech city": {
    lat: 17.4483,
    lon: 78.3915,
    displayName: "HITEC City, Hyderabad",
  },

  "gachibowli": {
    lat: 17.4401,
    lon: 78.3489,
    displayName: "Gachibowli, Hyderabad",
  },

  "secunderabad": {
    lat: 17.4399,
    lon: 78.4983,
    displayName: "Secunderabad, Hyderabad",
  },

  "banjara hills": {
    lat: 17.4156,
    lon: 78.4347,
    displayName: "Banjara Hills, Hyderabad",
  },

  "jubilee hills": {
    lat: 17.4319,
    lon: 78.4076,
    displayName: "Jubilee Hills, Hyderabad",
  },

  "kukatpally": {
    lat: 17.4849,
    lon: 78.4138,
    displayName: "Kukatpally, Hyderabad",
  },

  "lb nagar": {
    lat: 17.3457,
    lon: 78.5522,
    displayName: "LB Nagar, Hyderabad",
  },

  "dilsukhnagar": {
    lat: 17.3688,
    lon: 78.5247,
    displayName: "Dilsukhnagar, Hyderabad",
  },

  "uppal": {
    lat: 17.4065,
    lon: 78.5591,
    displayName: "Uppal, Hyderabad",
  },
};

/*
|--------------------------------------------------------------------------
| Leaflet marker icon
|--------------------------------------------------------------------------
*/

const startIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const boardingStopIcon = L.divIcon({
  className: "smartcommute-map-marker",
  html: `
    <div style="
      width: 36px;
      height: 36px;
      border-radius: 9999px;
      background: #16a34a;
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,.28);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    ">🚌</div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const destinationStopIcon = L.divIcon({
  className: "smartcommute-map-marker",
  html: `
    <div style="
      width: 36px;
      height: 36px;
      border-radius: 9999px;
      background: #f59e0b;
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,.28);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    ">🚌</div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

/*
|--------------------------------------------------------------------------
| Map controller
|--------------------------------------------------------------------------
*/

function MapController({
  points,
}: {
  points: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) {
      return;
    }

    const bounds = L.latLngBounds(points);

    map.fitBounds(bounds, {
      padding: [45, 45],
    });
  }, [points, map]);

  return null;
}

/*
|--------------------------------------------------------------------------
| Normalize location text
|--------------------------------------------------------------------------
*/

function normalizeLocation(
  location: string
): string {
  return location
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/*
|--------------------------------------------------------------------------
| Try known Hyderabad locations first
|--------------------------------------------------------------------------
*/

function getFallbackLocation(
  location: string
): LocationPoint | null {
  const normalized =
    normalizeLocation(location);

  if (FALLBACK_LOCATIONS[normalized]) {
    return FALLBACK_LOCATIONS[normalized];
  }

  /*
   * Handle variations such as:
   * "Lords Institute of Engineering & Technology"
   * "Lords Institute of Engineering and Technology"
   * "Lords College"
   */

  if (
    normalized.includes("lords institute") ||
    normalized === "lords" ||
    normalized.includes("lords college")
  ) {
    return FALLBACK_LOCATIONS[
      "lords institute of engineering and technology"
    ];
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Nominatim geocoding
|--------------------------------------------------------------------------
*/

async function searchNominatim(
  query: string
): Promise<LocationPoint | null> {
  try {
    const url =
      "https://nominatim.openstreetmap.org/search" +
      `?format=jsonv2` +
      `&limit=1` +
      `&countrycodes=in` +
      `&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const result = data[0];

    return {
      lat: Number(result.lat),
      lon: Number(result.lon),
      displayName:
        result.display_name ?? query,
    };
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Robust geocoder
|--------------------------------------------------------------------------
*/

async function geocodeLocation(
  location: string
): Promise<LocationPoint | null> {
  const cleanLocation = location.trim();

  if (!cleanLocation) {
    return null;
  }

  /*
   * 1. Use known Hyderabad fallback.
   * This makes the demo reliable for common locations.
   */

  const fallback =
    getFallbackLocation(cleanLocation);

  if (fallback) {
    return fallback;
  }

  /*
   * 2. Try exact user query.
   */

  const exactResult =
    await searchNominatim(cleanLocation);

  if (exactResult) {
    return exactResult;
  }

  /*
   * 3. Try Hyderabad-specific query.
   */

  const hyderabadResult =
    await searchNominatim(
      `${cleanLocation}, Hyderabad, Telangana, India`
    );

  if (hyderabadResult) {
    return hyderabadResult;
  }

  /*
   * 4. Try a broader Hyderabad query.
   */

  const broaderResult =
    await searchNominatim(
      `${cleanLocation}, Hyderabad, India`
    );

  if (broaderResult) {
    return broaderResult;
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| OSRM route calculation
|--------------------------------------------------------------------------
*/

async function getRoute(
  start: LocationPoint,
  end: LocationPoint
): Promise<RouteData | null> {
  try {
    const url =
      "https://router.project-osrm.org/route/v1/driving/" +
      `${start.lon},${start.lat};${end.lon},${end.lat}` +
      "?overview=full&geometries=geojson";

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (
      data.code !== "Ok" ||
      !data.routes ||
      data.routes.length === 0
    ) {
      return null;
    }

    const route = data.routes[0];

    if (!route.geometry?.coordinates) {
      return null;
    }

    const coordinates =
      route.geometry.coordinates.map(
        (point: [number, number]) => [
          point[1],
          point[0],
        ]
      );

    return {
      coordinates,
      distance: route.distance,
      duration: route.duration,
    };
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Main component
|--------------------------------------------------------------------------
*/

export default function RouteMap({
  from,
  to,
  fromCoordinates,
  toCoordinates,
  selectedRoute,
}: RouteMapProps) {
  const [start, setStart] =
    useState<LocationPoint | null>(null);

  const [end, setEnd] =
    useState<LocationPoint | null>(null);

  const [route, setRoute] =
    useState<RouteData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      setLoading(true);
      setError(null);
      setRoute(null);
      setStart(null);
      setEnd(null);

      /*
       * Geocode both locations.
       */

      const [
        startLocation,
        endLocation,
      ] = await Promise.all([
        fromCoordinates
          ? Promise.resolve({
              lat: fromCoordinates.latitude,
              lon: fromCoordinates.longitude,
              displayName: from,
            })
          : geocodeLocation(from),

        toCoordinates
          ? Promise.resolve({
              lat: toCoordinates.latitude,
              lon: toCoordinates.longitude,
              displayName: to,
            })
          : geocodeLocation(to),
      ]);

      if (cancelled) {
        return;
      }

      /*
       * If either location cannot be found.
       */

      if (!startLocation || !endLocation) {
        setError(
          !startLocation && !endLocation
            ? "Could not find either location."
            : !startLocation
              ? `Could not find "${from}".`
              : `Could not find "${to}".`
        );

        setLoading(false);
        return;
      }

      setStart(startLocation);
      setEnd(endLocation);

      /*
       * Calculate road route.
       */

      const routeData =
        await getRoute(
          startLocation,
          endLocation
        );

      if (cancelled) {
        return;
      }

      if (!routeData) {
        setError(
          "Locations were found, but a road route could not be calculated."
        );

        setLoading(false);
        return;
      }

      setRoute(routeData);
      setLoading(false);
    }

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [
    from,
    to,
    fromCoordinates?.latitude,
    fromCoordinates?.longitude,
    toCoordinates?.latitude,
    toCoordinates?.longitude,
    selectedRoute?.trip_id,
    selectedRoute?.origin?.stop_id,
    selectedRoute?.destination?.stop_id,
  ]);

  /*
   * Default Hyderabad center.
   */

  const center: [number, number] =
    start
      ? [start.lat, start.lon]
      : [17.385, 78.4867];

  const routePoints =
    route?.coordinates ?? [];

  /*
   * SmartCommute transit stops.
   *
   * These come directly from the selected backend route and
   * represent the GTFS boarding and destination stops.
   */
  const boardingStop = selectedRoute?.origin
    ? {
        lat: Number(selectedRoute.origin.latitude),
        lon: Number(selectedRoute.origin.longitude),
        displayName: selectedRoute.origin.stop_name,
      }
    : null;

  const destinationStop = selectedRoute?.destination
    ? {
        lat: Number(selectedRoute.destination.latitude),
        lon: Number(selectedRoute.destination.longitude),
        displayName: selectedRoute.destination.stop_name,
      }
    : null;

  const actualStartPoint: [number, number] | null =
    start ? [start.lat, start.lon] : null;

  const actualEndPoint: [number, number] | null =
    end ? [end.lat, end.lon] : null;

  const boardingPoint: [number, number] | null =
    boardingStop
      ? [boardingStop.lat, boardingStop.lon]
      : null;

  const destinationStopPoint: [number, number] | null =
    destinationStop
      ? [destinationStop.lat, destinationStop.lon]
      : null;

  const mapFitPoints: [number, number][] = [
    ...(routePoints.length > 0 ? routePoints : []),
    ...(actualStartPoint ? [actualStartPoint] : []),
    ...(actualEndPoint ? [actualEndPoint] : []),
    ...(boardingPoint ? [boardingPoint] : []),
    ...(destinationStopPoint ? [destinationStopPoint] : []),
  ];

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">

      {/* ------------------------------------------------ */}
      {/* Loading */}
      {/* ------------------------------------------------ */}

      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="rounded-xl bg-white px-5 py-4 shadow-lg">
            <div className="flex items-center gap-3">

              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <div>
                <p className="text-sm font-bold text-slate-900">
                  Finding route...
                </p>

                <p className="text-xs text-slate-500">
                  Locating your destinations
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* Error */}
      {/* ------------------------------------------------ */}

      {error && !loading && (
        <div className="absolute left-4 right-4 top-4 z-[1000] rounded-xl border border-red-200 bg-white p-4 shadow-lg">

          <p className="text-sm font-bold text-red-700">
            Route unavailable
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {error}
          </p>

        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* Map */}
      {/* ------------------------------------------------ */}

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Starting point */}

        {start && (
          <Marker
            position={[
              start.lat,
              start.lon,
            ]}
            icon={startIcon}
          >
            <Popup>

              <strong>
                Starting point
              </strong>

              <br />

              {from}

            </Popup>
          </Marker>
        )}

        {/* Destination */}

        {end && (
          <Marker
            position={[
              end.lat,
              end.lon,
            ]}
            icon={startIcon}
          >
            <Popup>

              <strong>
                Actual destination
              </strong>

              <br />

              {to}

            </Popup>
          </Marker>
        )}

        {/* GTFS boarding stop */}

        {boardingStop && (
          <Marker
            position={[
              boardingStop.lat,
              boardingStop.lon,
            ]}
            icon={boardingStopIcon}
          >
            <Popup>
              <strong>
                🚌 Boarding stop
              </strong>

              <br />

              {boardingStop.displayName}

              <br />

              <span style={{ color: "#64748b" }}>
                Route {selectedRoute?.route_number}
              </span>
            </Popup>
          </Marker>
        )}

        {/* GTFS destination stop */}

        {destinationStop && (
          <Marker
            position={[
              destinationStop.lat,
              destinationStop.lon,
            ]}
            icon={destinationStopIcon}
          >
            <Popup>
              <strong>
                🚌 Destination stop
              </strong>

              <br />

              {destinationStop.displayName}

              <br />

              <span style={{ color: "#64748b" }}>
                Route {selectedRoute?.route_number}
              </span>
            </Popup>
          </Marker>
        )}

        {/* Walking leg: actual origin → boarding stop */}

        {actualStartPoint && boardingPoint && (
          <Polyline
            positions={[
              actualStartPoint,
              boardingPoint,
            ]}
            pathOptions={{
              color: "#16a34a",
              weight: 4,
              opacity: 0.9,
              dashArray: "8 8",
            }}
          />
        )}

        {/* Walking leg: destination stop → actual destination */}

        {destinationStopPoint && actualEndPoint && (
          <Polyline
            positions={[
              destinationStopPoint,
              actualEndPoint,
            ]}
            pathOptions={{
              color: "#f59e0b",
              weight: 4,
              opacity: 0.9,
              dashArray: "8 8",
            }}
          />
        )}

        {/* Road routing reference */}

        {routePoints.length > 0 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: "#2563eb",
              weight: 6,
              opacity: 0.72,
            }}
          />
        )}

        {/* Automatically fit the complete journey */}

        {mapFitPoints.length > 1 && (
          <MapController
            points={mapFitPoints}
          />
        )}

      </MapContainer>

      {/* ------------------------------------------------ */}
      {/* Route information */}
      {/* ------------------------------------------------ */}

      {route && !loading && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">

          <div className="flex flex-col gap-3 rounded-xl bg-white/95 p-4 shadow-xl backdrop-blur">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-xs font-semibold text-slate-400">
                  {selectedRoute
                    ? "SMARTCOMMUTE JOURNEY"
                    : "ROAD ROUTE"}
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {from} → {to}
                </p>

              </div>

              <div className="flex gap-5">

                <div>

                  <p className="text-[10px] text-slate-400">
                    ROAD DISTANCE
                  </p>

                  <p className="text-sm font-bold text-slate-900">
                    {(route.distance / 1000).toFixed(1)} km
                  </p>

                </div>

                <div>

                  <p className="text-[10px] text-slate-400">
                    ROAD ETA
                  </p>

                  <p className="text-sm font-bold text-slate-900">
                    {Math.round(
                      route.duration / 60
                    )}{" "}
                    min
                  </p>

                </div>

              </div>

            </div>

            {selectedRoute && (
              <div className="border-t border-slate-100 pt-3">

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">

                  <span className="font-bold text-slate-800">
                    🚌 Route {selectedRoute.route_number}
                  </span>

                  <span className="text-slate-500">
                    {selectedRoute.origin.stop_name}
                    {" → "}
                    {selectedRoute.destination.stop_name}
                  </span>

                  <span className="text-slate-500">
                    Departs {selectedRoute.departure_time}
                  </span>

                  <span className="font-semibold text-slate-700">
                    {selectedRoute.total_minutes} min total
                  </span>

                </div>

                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">

                  <span>
                    🚶 {selectedRoute.walking_minutes} min walking
                  </span>

                  <span>
                    ⏱ {selectedRoute.wait_minutes} min wait
                  </span>

                  <span>
                    🚌 {selectedRoute.journey_minutes} min bus journey
                  </span>

                </div>

                <p className="mt-2 text-[10px] text-slate-400">
                  Blue line = road routing reference •
                  Green/orange dashed lines = walking legs •
                  Bus stops are from the GTFS schedule
                </p>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}