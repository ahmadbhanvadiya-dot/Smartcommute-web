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

export interface BackendRoute {
  trip_id: string;
  route_id: string;
  route_number: string;
  route_name: string;
  trip_name: string;

  origin: BackendStop;
  destination: BackendStop;

  departure_time: string;
  arrival_time: string;

  wait_minutes: number;
  journey_minutes: number;
  walking_minutes: number;
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
 * The frontend no longer talks directly to Nominatim.
 *
 * Instead:
 *
 * Browser
 *   ↓
 * FastAPI /api/locations/search
 *   ↓
 * OpenStreetMap Nominatim
 *
 * This keeps geocoding behind our backend and gives us one
 * source of truth for coordinates.
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
    data = JSON.parse(text) as LocationSearchResult;
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
 * User enters:
 *
 *   Abids → Attapur
 *
 * We resolve both names through our FastAPI location API,
 * then send only coordinates to the GTFS route-search API.
 *
 * If the caller already has the user's GPS coordinates,
 * those coordinates are used for the origin instead.
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
   * Resolve both locations.
   *
   * The origin can optionally come directly from the
   * browser's GPS position when "Use my current location"
   * is selected.
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
   * Build the GTFS route-search request.
   */

  const params = new URLSearchParams({
    from_lat: String(origin.lat),
    from_lng: String(origin.lng),

    to_lat: String(destination.lat),
    to_lng: String(destination.lng),

    radius_km: "5",
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
   * Handle HTTP errors with the actual backend message.
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
   * Parse FastAPI response.
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
   * Keep the user's actual coordinates separate from the
   * nearest GTFS stop coordinates.
   *
   * This lets the map show:
   *
   *   actual user location
   *          ↓ walking
   *   nearest bus stop
   *          ↓ bus
   *   destination bus stop
   *          ↓ walking
   *   actual destination
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
