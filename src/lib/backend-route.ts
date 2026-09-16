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

  current_time: string;
  search_radius_km: number;
  count: number;

  routes: BackendRoute[];
}

/*
 * IMPORTANT:
 * These are demo-known locations.
 *
 * This avoids depending on a third-party geocoder
 * every time the user searches.
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

  "lords institute of engineering":
    {
      lat: 17.342264,
      lng: 78.367449,
    },

  "lords institute of engineering and technology":
    {
      lat: 17.342264,
      lng: 78.367449,
    },

  "lords institute of engineering & technology":
    {
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
 * Resolve a user-entered location.
 */
export async function resolveLocation(
  location: string
): Promise<LocationCoordinates> {
  const normalized =
    normalizeLocation(location);

  /*
   * Exact match.
   */
  if (KNOWN_LOCATIONS[normalized]) {
    return KNOWN_LOCATIONS[normalized];
  }

  /*
   * Partial match.
   *
   * Example:
   * "Lords Institute"
   * can still match the known Lords location.
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
   * Last-resort geocoding.
   *
   * This is only used for locations that are not
   * already known by SmartCommute.
   */
  const params = new URLSearchParams({
    q: `${location}, Hyderabad, Telangana, India`,
    format: "json",
    limit: "1",
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

  const results = await response.json();

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
 * Search real GTFS routes through FastAPI.
 */
export async function searchBackendRoutes(
  from: string,
  to: string
): Promise<BackendRouteResponse> {
  const [origin, destination] =
    await Promise.all([
      resolveLocation(from),
      resolveLocation(to),
    ]);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

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

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

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

  const data =
    (await response.json()) as BackendRouteResponse;

  return data;
}