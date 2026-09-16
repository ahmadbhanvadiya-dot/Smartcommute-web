"use client";

import { useEffect, useMemo, useState } from "react";

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

import type {
  BackendRoute,
  BackendRouteLeg,
} from "@/lib/backend-route";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface LocationPoint {
  lat: number;
  lon: number;
  displayName: string;
}

interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
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

  selectedRoute?: BackendRoute | null;
}

/*
|--------------------------------------------------------------------------
| Hyderabad fallback locations
|--------------------------------------------------------------------------
|
| These are only used if coordinates aren't supplied by the backend.
|
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
    lon: 78.3676,
    displayName:
      "Lords Institute of Engineering & Technology, Hyderabad",
  },

  "lords institute of engineering and technology": {
    lat: 17.34217,
    lon: 78.3676,
    displayName:
      "Lords Institute of Engineering & Technology, Hyderabad",
  },

  lords: {
    lat: 17.34217,
    lon: 78.3676,
    displayName:
      "Lords Institute of Engineering & Technology, Hyderabad",
  },

  charminar: {
    lat: 17.3616,
    lon: 78.4747,
    displayName: "Charminar, Hyderabad",
  },

  "hitech city": {
    lat: 17.4483,
    lon: 78.3915,
    displayName: "HITEC City, Hyderabad",
  },

  gachibowli: {
    lat: 17.4401,
    lon: 78.3489,
    displayName: "Gachibowli, Hyderabad",
  },

  secunderabad: {
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

  kukatpally: {
    lat: 17.4849,
    lon: 78.4138,
    displayName: "Kukatpally, Hyderabad",
  },

  "lb nagar": {
    lat: 17.3457,
    lon: 78.5522,
    displayName: "LB Nagar, Hyderabad",
  },

  dilsukhnagar: {
    lat: 17.3688,
    lon: 78.5247,
    displayName: "Dilsukhnagar, Hyderabad",
  },

  uppal: {
    lat: 17.4065,
    lon: 78.5591,
    displayName: "Uppal, Hyderabad",
  },
};

/*
|--------------------------------------------------------------------------
| Icons
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
      width:36px;
      height:36px;
      border-radius:9999px;
      background:#16a34a;
      border:3px solid white;
      box-shadow:0 3px 10px rgba(0,0,0,.28);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:18px;
    ">
      🚌
    </div>
  `,

  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const transferStopIcon = L.divIcon({
  className: "smartcommute-map-marker",

  html: `
    <div style="
      width:40px;
      height:40px;
      border-radius:9999px;
      background:#7c3aed;
      border:3px solid white;
      box-shadow:0 3px 12px rgba(0,0,0,.32);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:19px;
    ">
      🔄
    </div>
  `,

  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const destinationStopIcon = L.divIcon({
  className: "smartcommute-map-marker",

  html: `
    <div style="
      width:36px;
      height:36px;
      border-radius:9999px;
      background:#f59e0b;
      border:3px solid white;
      box-shadow:0 3px 10px rgba(0,0,0,.28);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:18px;
    ">
      🚌
    </div>
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
      padding: [55, 55],
    });
  }, [points, map]);

  return null;
}

/*
|--------------------------------------------------------------------------
| Location helpers
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

function getFallbackLocation(
  location: string
): LocationPoint | null {
  const normalized =
    normalizeLocation(location);

  if (FALLBACK_LOCATIONS[normalized]) {
    return FALLBACK_LOCATIONS[normalized];
  }

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
| Nominatim
|--------------------------------------------------------------------------
|
| Kept only as a fallback.
|
| Normal SmartCommute searches already receive coordinates
| from the FastAPI backend.
|
*/

async function searchNominatim(
  query: string
): Promise<LocationPoint | null> {
  try {
    const url =
      "https://nominatim.openstreetmap.org/search" +
      "?format=jsonv2" +
      "&limit=1" +
      "&countrycodes=in" +
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

    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {
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

async function geocodeLocation(
  location: string
): Promise<LocationPoint | null> {
  const cleanLocation =
    location.trim();

  if (!cleanLocation) {
    return null;
  }

  const fallback =
    getFallbackLocation(cleanLocation);

  if (fallback) {
    return fallback;
  }

  const exactResult =
    await searchNominatim(cleanLocation);

  if (exactResult) {
    return exactResult;
  }

  const hyderabadResult =
    await searchNominatim(
      `${cleanLocation}, Hyderabad, Telangana, India`
    );

  if (hyderabadResult) {
    return hyderabadResult;
  }

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
| OSRM road geometry
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

    const data =
      await response.json();

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

  const [roadRoute, setRoadRoute] =
    useState<RouteData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load actual locations
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      setLoading(true);
      setError(null);
      setRoadRoute(null);
      setStart(null);
      setEnd(null);

      const [
        startLocation,
        endLocation,
      ] = await Promise.all([
        fromCoordinates
          ? Promise.resolve({
              lat:
                fromCoordinates.latitude,
              lon:
                fromCoordinates.longitude,
              displayName: from,
            })
          : geocodeLocation(from),

        toCoordinates
          ? Promise.resolve({
              lat:
                toCoordinates.latitude,
              lon:
                toCoordinates.longitude,
              displayName: to,
            })
          : geocodeLocation(to),
      ]);

      if (cancelled) {
        return;
      }

      if (
        !startLocation ||
        !endLocation
      ) {
        setError(
          !startLocation &&
          !endLocation
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
       * OSRM is used only to provide useful road geometry
       * between the actual requested locations.
       */

      const routeData =
        await getRoute(
          startLocation,
          endLocation
        );

      if (cancelled) {
        return;
      }

      if (routeData) {
        setRoadRoute(routeData);
      }

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
    selectedRoute?.route_id,

    selectedRoute?.origin?.stop_id,
    selectedRoute?.destination?.stop_id,

    selectedRoute?.transfer_stop?.stop_id,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Selected route information
  |--------------------------------------------------------------------------
  */

  const boardingStop =
    selectedRoute?.origin
      ? {
          lat: Number(
            selectedRoute.origin.latitude
          ),
          lon: Number(
            selectedRoute.origin.longitude
          ),
          displayName:
            selectedRoute.origin.stop_name,
        }
      : null;

  const destinationStop =
    selectedRoute?.destination
      ? {
          lat: Number(
            selectedRoute.destination.latitude
          ),
          lon: Number(
            selectedRoute.destination.longitude
          ),
          displayName:
            selectedRoute.destination.stop_name,
        }
      : null;

  const transferStop =
    selectedRoute?.transfer_stop
      ? {
          lat: Number(
            selectedRoute.transfer_stop.latitude
          ),
          lon: Number(
            selectedRoute.transfer_stop.longitude
          ),
          displayName:
            selectedRoute.transfer_stop.stop_name,
        }
      : null;

  /*
  |--------------------------------------------------------------------------
  | Actual coordinates
  |--------------------------------------------------------------------------
  */

  const actualStartPoint:
    | [number, number]
    | null =
    start
      ? [start.lat, start.lon]
      : null;

  const actualEndPoint:
    | [number, number]
    | null =
    end
      ? [end.lat, end.lon]
      : null;

  const boardingPoint:
    | [number, number]
    | null =
    boardingStop
      ? [
          boardingStop.lat,
          boardingStop.lon,
        ]
      : null;

  const transferPoint:
    | [number, number]
    | null =
    transferStop
      ? [
          transferStop.lat,
          transferStop.lon,
        ]
      : null;

  const destinationStopPoint:
    | [number, number]
    | null =
    destinationStop
      ? [
          destinationStop.lat,
          destinationStop.lon,
        ]
      : null;

  /*
  |--------------------------------------------------------------------------
  | GTFS bus legs
  |--------------------------------------------------------------------------
  */

  const legs =
    selectedRoute?.legs ?? [];

  /*
  |--------------------------------------------------------------------------
  | Map fit points
  |--------------------------------------------------------------------------
  */

  const mapFitPoints =
    useMemo(() => {
      const points: [
        number,
        number
      ][] = [];

      if (actualStartPoint) {
        points.push(actualStartPoint);
      }

      if (boardingPoint) {
        points.push(boardingPoint);
      }

      if (transferPoint) {
        points.push(transferPoint);
      }

      if (destinationStopPoint) {
        points.push(
          destinationStopPoint
        );
      }

      if (actualEndPoint) {
        points.push(actualEndPoint);
      }

      /*
       * If no GTFS route is selected,
       * use the road geometry.
       */

      if (
        points.length === 0 &&
        roadRoute
      ) {
        points.push(
          ...roadRoute.coordinates
        );
      }

      return points;
    }, [
      actualStartPoint,
      boardingPoint,
      transferPoint,
      destinationStopPoint,
      actualEndPoint,
      roadRoute,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Center
  |--------------------------------------------------------------------------
  */

  const center: [
    number,
    number
  ] = start
    ? [start.lat, start.lon]
    : [17.385, 78.4867];

  /*
  |--------------------------------------------------------------------------
  | Route type
  |--------------------------------------------------------------------------
  */

  const isTransferRoute =
    selectedRoute?.type ===
      "transfer" ||
    (selectedRoute?.transfers ?? 0) >
      0 ||
    legs.length > 1;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      {/*
      |--------------------------------------------------------------------------
      | Loading
      |--------------------------------------------------------------------------
      */}

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
                  Building your journey map
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | Error
      |--------------------------------------------------------------------------
      */}

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

      {/*
      |--------------------------------------------------------------------------
      | MAP
      |--------------------------------------------------------------------------
      */}

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

        {/*
        |--------------------------------------------------------------------------
        | ACTUAL START
        |--------------------------------------------------------------------------
        */}

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
                📍 Starting point
              </strong>

              <br />

              {from}
            </Popup>
          </Marker>
        )}

        {/*
        |--------------------------------------------------------------------------
        | ACTUAL DESTINATION
        |--------------------------------------------------------------------------
        */}

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
                🎯 Your destination
              </strong>

              <br />

              {to}
            </Popup>
          </Marker>
        )}

        {/*
        |--------------------------------------------------------------------------
        | BOARDING STOP
        |--------------------------------------------------------------------------
        */}

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

              {selectedRoute && (
                <>
                  <br />

                  <span
                    style={{
                      color: "#64748b",
                    }}
                  >
                    Board{" "}
                    {legs.length > 0
                      ? legs[0]
                          ?.route_number
                      : selectedRoute.route_number}
                  </span>
                </>
              )}
            </Popup>
          </Marker>
        )}

        {/*
        |--------------------------------------------------------------------------
        | TRANSFER STOP
        |--------------------------------------------------------------------------
        */}

        {transferStop && (
          <Marker
            position={[
              transferStop.lat,
              transferStop.lon,
            ]}
            icon={transferStopIcon}
          >
            <Popup>
              <strong>
                🔄 Transfer stop
              </strong>

              <br />

              {transferStop.displayName}

              {legs.length > 1 && (
                <>
                  <br />

                  <span
                    style={{
                      color: "#64748b",
                    }}
                  >
                    Change from{" "}
                    <strong>
                      {legs[0]?.route_number}
                    </strong>{" "}
                    to{" "}
                    <strong>
                      {legs[1]?.route_number}
                    </strong>
                  </span>
                </>
              )}
            </Popup>
          </Marker>
        )}

        {/*
        |--------------------------------------------------------------------------
        | DESTINATION STOP
        |--------------------------------------------------------------------------
        */}

        {destinationStop && (
          <Marker
            position={[
              destinationStop.lat,
              destinationStop.lon,
            ]}
            icon={
              destinationStopIcon
            }
          >
            <Popup>
              <strong>
                🚌 Destination stop
              </strong>

              <br />

              {destinationStop.displayName}

              {selectedRoute && (
                <>
                  <br />

                  <span
                    style={{
                      color: "#64748b",
                    }}
                  >
                    Arrive on{" "}
                    {legs.length > 0
                      ? legs[
                          legs.length - 1
                        ]?.route_number
                      : selectedRoute.route_number}
                  </span>
                </>
              )}
            </Popup>
          </Marker>
        )}

        {/*
        |--------------------------------------------------------------------------
        | WALKING: START → BOARDING STOP
        |--------------------------------------------------------------------------
        */}

        {actualStartPoint &&
          boardingPoint && (
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

        {/*
        |--------------------------------------------------------------------------
        | WALKING: DESTINATION STOP → DESTINATION
        |--------------------------------------------------------------------------
        */}

        {destinationStopPoint &&
          actualEndPoint && (
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

        {/*
        |--------------------------------------------------------------------------
        | BUS LEG 1
        |--------------------------------------------------------------------------
        |
        | We draw a visual line between:
        |
        | boarding stop → transfer stop
        |
        */}

        {isTransferRoute &&
          boardingPoint &&
          transferPoint && (
            <Polyline
              positions={[
                boardingPoint,
                transferPoint,
              ]}
              pathOptions={{
                color: "#2563eb",
                weight: 7,
                opacity: 0.9,
              }}
            />
          )}

        {/*
        |--------------------------------------------------------------------------
        | BUS LEG 2
        |--------------------------------------------------------------------------
        |
        | transfer stop → destination stop
        |
        */}

        {isTransferRoute &&
          transferPoint &&
          destinationStopPoint && (
            <Polyline
              positions={[
                transferPoint,
                destinationStopPoint,
              ]}
              pathOptions={{
                color: "#7c3aed",
                weight: 7,
                opacity: 0.9,
              }}
            />
          )}

        {/*
        |--------------------------------------------------------------------------
        | DIRECT BUS ROUTE
        |--------------------------------------------------------------------------
        */}

        {!isTransferRoute &&
          boardingPoint &&
          destinationStopPoint && (
            <Polyline
              positions={[
                boardingPoint,
                destinationStopPoint,
              ]}
              pathOptions={{
                color: "#2563eb",
                weight: 7,
                opacity: 0.9,
              }}
            />
          )}

        {/*
        |--------------------------------------------------------------------------
        | ROAD ROUTE FALLBACK
        |--------------------------------------------------------------------------
        |
        | Only show OSRM geometry when we don't have enough
        | GTFS stop information to construct the transit path.
        |
        */}

        {!selectedRoute &&
          roadRoute &&
          roadRoute.coordinates.length >
            1 && (
            <Polyline
              positions={
                roadRoute.coordinates
              }
              pathOptions={{
                color: "#2563eb",
                weight: 6,
                opacity: 0.72,
              }}
            />
          )}

        {/*
        |--------------------------------------------------------------------------
        | FIT MAP
        |--------------------------------------------------------------------------
        */}

        {mapFitPoints.length > 1 && (
          <MapController
            points={mapFitPoints}
          />
        )}
      </MapContainer>

      {/*
      |--------------------------------------------------------------------------
      | JOURNEY INFORMATION
      |--------------------------------------------------------------------------
      */}

      {selectedRoute &&
        !loading && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="rounded-xl bg-white/95 p-4 shadow-xl backdrop-blur">
              {/*
              |--------------------------------------------------------------------------
              | Header
              |--------------------------------------------------------------------------
              */}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold text-slate-400">
                      SMARTCOMMUTE JOURNEY
                    </p>

                    {isTransferRoute ? (
                      <span className="rounded-full bg-purple-100 px-2 py-1 text-[10px] font-bold text-purple-700">
                        1 TRANSFER
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                        DIRECT
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {from} → {to}
                  </p>
                </div>

                <div className="flex gap-5">
                  <div>
                    <p className="text-[10px] text-slate-400">
                      TOTAL
                    </p>

                    <p className="text-sm font-bold text-slate-900">
                      {
                        selectedRoute.total_minutes
                      }{" "}
                      min
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400">
                      BUSES
                    </p>

                    <p className="text-sm font-bold text-slate-900">
                      {legs.length ||
                        1}
                    </p>
                  </div>
                </div>
              </div>

              {/*
              |--------------------------------------------------------------------------
              | Journey timeline
              |--------------------------------------------------------------------------
              */}

              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-800">
                    📍 {from}
                  </span>

                  <span className="text-slate-400">
                    →
                  </span>

                  <span className="font-semibold text-green-700">
                    🚌{" "}
                    {legs.length > 0
                      ? legs[0]
                          ?.route_number
                      : selectedRoute.route_number}
                  </span>

                  {isTransferRoute &&
                    transferStop && (
                      <>
                        <span className="text-slate-400">
                          →
                        </span>

                        <span className="font-semibold text-purple-700">
                          🔄{" "}
                          {
                            transferStop.displayName
                          }
                        </span>

                        {legs[1] && (
                          <>
                            <span className="text-slate-400">
                              →
                            </span>

                            <span className="font-semibold text-purple-700">
                              🚌{" "}
                              {
                                legs[1]
                                  .route_number
                              }
                            </span>
                          </>
                        )}
                      </>
                    )}

                  <span className="text-slate-400">
                    →
                  </span>

                  <span className="font-bold text-slate-800">
                    🎯 {to}
                  </span>
                </div>
              </div>

              {/*
              |--------------------------------------------------------------------------
              | Individual bus legs
              |--------------------------------------------------------------------------
              */}

              {legs.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {legs.map(
                    (
                      leg: BackendRouteLeg,
                      index
                    ) => (
                      <div
                        key={`${leg.trip_id}-${index}`}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            🚌 Bus{" "}
                            {index + 1}
                          </span>

                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600">
                            {
                              leg.route_number
                            }
                          </span>
                        </div>

                        <p className="mt-2 text-xs font-semibold text-slate-700">
                          {leg.from_stop}
                          {" → "}
                          {leg.to_stop}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-500">
                          {
                            leg.departure_time
                          }
                          {" – "}
                          {
                            leg.arrival_time
                          }
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/*
              |--------------------------------------------------------------------------
              | Journey stats
              |--------------------------------------------------------------------------
              */}

              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
                <span>
                  🚶{" "}
                  {
                    selectedRoute.walking_minutes
                  }{" "}
                  min walking
                </span>

                <span>
                  ⏱{" "}
                  {
                    selectedRoute.wait_minutes
                  }{" "}
                  min initial wait
                </span>

                {typeof selectedRoute.transfer_wait_minutes ===
                  "number" && (
                  <span>
                    🔄{" "}
                    {
                      selectedRoute.transfer_wait_minutes
                    }{" "}
                    min transfer wait
                  </span>
                )}

                <span>
                  🚌{" "}
                  {
                    selectedRoute.journey_minutes
                  }{" "}
                  min bus journey
                </span>
              </div>

              {/*
              |--------------------------------------------------------------------------
              | Legend
              |--------------------------------------------------------------------------
              */}

              <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-400">
                <span>
                  🟢 Boarding
                </span>

                {isTransferRoute && (
                  <span>
                    🟣 Transfer
                  </span>
                )}

                <span>
                  🟠 Destination stop
                </span>

                <span>
                  — Bus route
                </span>

                <span>
                  - - Walking
                </span>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}