

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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

/*
 * Known Hyderabad locations.
 *
 * These are used first so the demo does not depend
 * on an external geocoding service for common places.
 */
const KNOWN_LOCATIONS: Record<
  string,
  { lat: number; lng: number }
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
    lat: 17.3827,
    lng: 78.4824,
  },
};

function normalizeLocation(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

async function geocodeLocation(
  location: string
): Promise<{
  lat: number;
  lng: number;
}> {
  const normalized =
    normalizeLocation(location);

  const known =
    KNOWN_LOCATIONS[normalized];

  if (known) {
    return known;
  }

  /*
   * Fallback geocoding using OpenStreetMap.
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
      `Unable to find "${location}".`
    );
  }

  const results = await response.json();

  if (!results?.length) {
    throw new Error(
      `Location "${location}" could not be found.`
    );
  }

  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
  };
}

export async function searchBackendRoutes(
  from: string,
  to: string
): Promise<BackendRouteResponse> {
  const [origin, destination] =
    await Promise.all([
      geocodeLocation(from),
      geocodeLocation(to),
    ]);

  const params = new URLSearchParams({
    from_lat: String(origin.lat),
    from_lng: String(origin.lng),
    to_lat: String(destination.lat),
    to_lng: String(destination.lng),
    radius_km: "5",
    limit: "10",
  });

  const response = await fetch(
    `${API_BASE_URL}/api/routes/search?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text().catch(
        () => ""
      );

    throw new Error(
      errorText ||
        `Backend route search failed (${response.status}).`
    );
  }

  return response.json();
}