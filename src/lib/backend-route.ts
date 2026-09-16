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
  /*
   * Coordinates returned by FastAPI.
   *
   * These are the coordinates used for the
   * GTFS route search.
   */
  origin: {
    latitude: number;
    longitude: number;
  };

  destination: {
    latitude: number;
    longitude: number;
  };

  /*
   * Actual coordinates requested by the user.
   *
   * These are kept separately so the map can show
   * the actual starting point and destination.
   */
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
}

/*
 * =========================================================
 * KNOWN LOCATIONS
 * =========================================================
 *
 * These are demo-known Hyderabad locations.
 *
 * Known locations are resolved locally first so the
 * application does not depend on a third-party geocoder
 * for common demo searches.
 */

const KNOWN_LOCATIONS: Record<
  string,
  LocationCoordinates
> = {
  mehdipatnam: {
    lat: 17.3952,
    lng: 78.4392,
  },

  koti: {
    lat: 17.3831,
    lng: 78.4828,
  },

  "koti bus station": {
    lat: 17.3831,
    lng: 78.4828,
  },

  "koti medical college": {
    lat: 17.38273,
    lng: 78.48243,
  },

  "lords institute of engineering": {
    lat: 17.342264,
    lng: 78.367449,
  },

  "lords institute of engineering and technology": {
    lat: 17.342264,
    lng: 78.367449,
  },

  "lords institute of engineering & technology": {
    lat: 17.342264,
    lng: 78.367449,
  },

  "lords college": {
    lat: 17.342264,
    lng: 78.367449,
  },

  "himayath sagar": {
  lat: 17.342264,
  lng: 78.367449,
},

  "appa junction": {
    lat: 17.342264,
    lng: 78.367449,
  },
};

/*
 * =========================================================
 * NORMALIZE LOCATION
 * =========================================================
 */

function normalizeLocation(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ");
}

/*
 * =========================================================
 * RESOLVE LOCATION
 * =========================================================
 */

export async function resolveLocation(
  location: string
): Promise<LocationCoordinates> {
  const normalized =
    normalizeLocation(location);

  /*
   * -------------------------------------------------------
   * 1. Exact known-location match
   * -------------------------------------------------------
   */

  if (KNOWN_LOCATIONS[normalized]) {
    return KNOWN_LOCATIONS[normalized];
  }

  /*
   * -------------------------------------------------------
   * 2. Partial known-location match
   * -------------------------------------------------------
   *
   * Examples:
   *
   * "Lords Institute"
   * "Lords Institute of Engineering"
   * "Lords College"
   */

  const matchingKey =
    Object.keys(KNOWN_LOCATIONS).find(
      (key) =>
        normalized.includes(key) ||
        key.includes(normalized)
    );

  if (matchingKey) {
    return KNOWN_LOCATIONS[matchingKey];
  }

  /*
   * -------------------------------------------------------
   * 3. Last-resort Nominatim geocoding
   * -------------------------------------------------------
   */

  const params = new URLSearchParams({
    q: `${location}, Hyderabad, Telangana, India`,
    format: "json",
    limit: "1",
    countrycodes: "in",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to resolve "${location}".`
    );
  }

  const results =
    await response.json();

  if (
    !Array.isArray(results) ||
    results.length === 0
  ) {
    throw new Error(
      `Location "${location}" could not be found.`
    );
  }

  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
  };
}

/*
 * =========================================================
 * SEARCH BACKEND ROUTES
 * =========================================================
 *
 * Sends the resolved coordinates to FastAPI.
 *
 * FastAPI then searches the TGSRTC GTFS dataset and returns
 * upcoming routes.
 */

export async function searchBackendRoutes(
  from: string,
  to: string,
  fromCoordinates?: {
    latitude: number;
    longitude: number;
  }
): Promise<BackendRouteResponse> {
  /*
   * Resolve both requested locations.
   */

  const [origin, destination] =
  await Promise.all([
    fromCoordinates
      ? Promise.resolve({
          lat: fromCoordinates.latitude,
          lng: fromCoordinates.longitude,
        })
      : resolveLocation(from),

    resolveLocation(to),
  ]);

  /*
   * Backend URL.
   */

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

  /*
   * Query parameters expected by FastAPI.
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
    `${apiBase}/api/routes/search?` +
    params.toString();

  console.log(
    "SmartCommute route request:",
    url
  );

  /*
   * Request FastAPI.
   */

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  /*
   * Handle backend errors.
   */

  if (!response.ok) {
    const text =
      await response.text().catch(
        () => ""
      );

    throw new Error(
      `Route API failed (${response.status}) ${
        text || ""
      }`
    );
  }

  /*
   * Parse backend response.
   */

  const data =
    (await response.json()) as BackendRouteResponse;

  /*
   * IMPORTANT:
   *
   * Keep the user's actual requested coordinates.
   *
   * The backend's origin/destination can represent
   * nearby GTFS stops, while these represent the actual
   * searched locations.
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