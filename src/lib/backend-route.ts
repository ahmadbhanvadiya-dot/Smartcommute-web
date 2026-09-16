// src/lib/backend-route.ts

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface BackendStop {
  stop_id: string;
  stop_name: string;
  distance_km: number;
  latitude: number;
  longitude: number;
}

export interface BackendRouteLeg {
  trip_id: string;
  route_id: string;
  route_number: string;
  from_stop: string;
  to_stop: string;
  departure_time: string;
  arrival_time: string;
}

export interface BackendTransferStop {
  stop_id: string;
  stop_name: string;
  latitude: number;
  longitude: number;
}

export interface BackendRoute {
  trip_id: string;
  route_id: string;
  route_number: string;
  route_name: string;
  trip_name: string;

  /**
   * Route type returned by the SmartCommute backend.
   */
  type?: "direct" | "transfer";

  /**
   * Number of transfers.
   */
  transfers?: number;

  /**
   * First / boarding stop.
   */
  origin: BackendStop;

  /**
   * Final GTFS destination stop.
   */
  destination: BackendStop;

  /**
   * Transfer stop for transfer routes.
   */
  transfer_stop?: BackendTransferStop;

  /**
   * Individual bus legs.
   *
   * Direct route:
   *   legs[0]
   *
   * Transfer route:
   *   legs[0] → transfer_stop → legs[1]
   */
  legs?: BackendRouteLeg[];

  departure_time: string;
  arrival_time: string;

  wait_minutes: number;
  journey_minutes: number;
  walking_minutes: number;

  /**
   * Optional waiting time between buses.
   */
  transfer_wait_minutes?: number;

  total_minutes: number;

  score: number;

  status: string;
}

export interface BackendRouteResponse {
  origin: {
    latitude: number;
    longitude: number;
  };

  destination: {
    latitude: number;
    longitude: number;
  };

  requested_origin: {
    latitude: number;
    longitude: number;
  };

  requested_destination: {
    latitude: number;
    longitude: number;
  };

  current_time: string;

  search_radius_km: number;

  count: number;

  /**
   * Backend routing metadata.
   */
  routing?: {
    engine: string;
    max_transfers: number;
    walking_speed_minutes_per_km: number;
  };

  /**
   * Backend ranking metadata.
   */
  ranking?: {
    method: string;
    lower_score_is_better: boolean;
  };

  routes: BackendRoute[];

  message?: string;
}

export interface LocationSearchResult {
  name: string;
  latitude: number;
  longitude: number;
  display_name: string;
  source: string;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

/*
 * =========================================================
 * REAL LOCATION SEARCH
 * =========================================================
 *
 * Browser
 *    ↓
 * FastAPI /api/locations/search
 *    ↓
 * OpenStreetMap Nominatim
 */

export async function searchLocation(
  location: string
): Promise<LocationCoordinates> {
  const query = location.trim();

  if (!query) {
    throw new Error("Please enter a location.");
  }

  const params = new URLSearchParams({
    q: query,
  });

  const url =
    `${API_BASE}/api/locations/search?${params.toString()}`;

  console.log(
    "SmartCommute location request:",
    url
  );

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      "Location API network error:",
      error
    );

    throw new Error(
      "Unable to connect to the SmartCommute location service."
    );
  }

  const text =
    await response.text().catch(() => "");

  if (!response.ok) {
    let message =
      `Location search failed (${response.status}).`;

    try {
      const errorData = JSON.parse(text);

      if (
        typeof errorData?.detail === "string"
      ) {
        message = errorData.detail;
      } else if (
        typeof errorData?.message === "string"
      ) {
        message = errorData.message;
      }
    } catch {
      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }

  let data: LocationSearchResult;

  try {
    data =
      JSON.parse(text) as LocationSearchResult;
  } catch {
    throw new Error(
      "Location service returned an invalid response."
    );
  }

  if (
    typeof data.latitude !== "number" ||
    typeof data.longitude !== "number"
  ) {
    throw new Error(
      `Location "${query}" could not be resolved.`
    );
  }

  return {
    lat: data.latitude,
    lng: data.longitude,
  };
}

/*
 * =========================================================
 * SEARCH BACKEND ROUTES
 * =========================================================
 *
 * User:
 *
 *   Abids → Katedan
 *
 * Browser
 *    ↓
 * location search
 *    ↓
 * coordinates
 *    ↓
 * GTFS route search
 */

export async function searchBackendRoutes(
  from: string,
  to: string,
  fromCoordinates?: {
    latitude: number;
    longitude: number;
  }
): Promise<BackendRouteResponse> {
  const cleanFrom = from.trim();
  const cleanTo = to.trim();

  if (!cleanFrom) {
    throw new Error(
      "Please enter a starting location."
    );
  }

  if (!cleanTo) {
    throw new Error(
      "Please enter a destination."
    );
  }

  /*
   * Resolve locations.
   *
   * If GPS coordinates are supplied for the origin,
   * don't geocode the origin again.
   */

  const [origin, destination] =
    await Promise.all([
      fromCoordinates
        ? Promise.resolve({
            lat: fromCoordinates.latitude,
            lng: fromCoordinates.longitude,
          })
        : searchLocation(cleanFrom),

      searchLocation(cleanTo),
    ]);

  /*
   * Build GTFS route-search request.
   */

  const params = new URLSearchParams({
    from_lat: String(origin.lat),
    from_lng: String(origin.lng),

    to_lat: String(destination.lat),
    to_lng: String(destination.lng),

    radius_km: "10",
    limit: "10",
  });

  const url =
    `${API_BASE}/api/routes/search?` +
    params.toString();

  console.log(
    "SmartCommute route request:",
    url
  );

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      "Route API network error:",
      error
    );

    throw new Error(
      "Unable to connect to the SmartCommute route service."
    );
  }

  const text =
    await response.text().catch(() => "");

  /*
   * HTTP error handling.
   */

  if (!response.ok) {
    let message =
      `Route API failed (${response.status}).`;

    try {
      const errorData = JSON.parse(text);

      if (
        typeof errorData?.detail === "string"
      ) {
        message = errorData.detail;
      } else if (
        typeof errorData?.message === "string"
      ) {
        message = errorData.message;
      }
    } catch {
      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }

  /*
   * Parse backend response.
   */

  let data: BackendRouteResponse;

  try {
    data =
      JSON.parse(text) as BackendRouteResponse;
  } catch {
    throw new Error(
      "Route service returned an invalid response."
    );
  }

  /*
   * Preserve actual requested coordinates.
   *
   * These are different from the nearest GTFS stops.
   *
   * Example:
   *
   * Abids
   *   ↓ walking
   * Mehdipatnam
   *   ↓ bus
   * Koti
   *   ↓ walking
   * Katedan
   */

  return {
    ...data,

    requested_origin: {
      latitude: origin.lat,
      longitude: origin.lng,
    },

    requested_destination: {
      latitude: destination.lat,
      longitude: destination.lng,
    },
  };
}