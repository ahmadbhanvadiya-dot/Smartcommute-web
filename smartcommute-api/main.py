from pathlib import Path
from math import radians, sin, cos, sqrt, atan2
from functools import lru_cache
from datetime import datetime

import pandas as pd

from fastapi import (
    FastAPI,
    Query,
    HTTPException,
)

from fastapi.middleware.cors import CORSMiddleware


# ============================================================
# SMARTCOMMUTE AI API
# ============================================================

app = FastAPI(
    title="SmartCommute AI API",
    description=(
        "Smart transportation backend powered by "
        "TGSRTC GTFS data."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


# ============================================================
# DATA LOADING
# ============================================================

@lru_cache(maxsize=1)
def load_stops():
    """
    Load TGSRTC stops.txt and keep it cached in memory.
    """

    file_path = DATA_DIR / "stops.txt"

    if not file_path.exists():
        raise FileNotFoundError(
            f"Missing TGSRTC file: {file_path}"
        )

    stops = pd.read_csv(
        file_path,
        low_memory=False,
    )

    required_columns = [
        "stop_id",
        "stop_name",
        "stop_lat",
        "stop_lon",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in stops.columns
    ]

    if missing_columns:
        raise ValueError(
            "stops.txt is missing columns: "
            + ", ".join(missing_columns)
        )

    # Optional fields
    if "zone_id" not in stops.columns:
        stops["zone_id"] = ""

    if "stop_desc" not in stops.columns:
        stops["stop_desc"] = ""

    stops["stop_lat"] = pd.to_numeric(
        stops["stop_lat"],
        errors="coerce",
    )

    stops["stop_lon"] = pd.to_numeric(
        stops["stop_lon"],
        errors="coerce",
    )

    stops = stops.dropna(
        subset=[
            "stop_lat",
            "stop_lon",
        ]
    )

    return stops


@lru_cache(maxsize=1)
def load_routes():
    """
    Load TGSRTC routes.txt.
    """

    file_path = DATA_DIR / "routes.txt"

    if not file_path.exists():
        raise FileNotFoundError(
            f"Missing TGSRTC file: {file_path}"
        )

    routes = pd.read_csv(
        file_path,
        low_memory=False,
    )

    return routes


@lru_cache(maxsize=1)
def load_trips():
    """
    Load TGSRTC trips.txt.
    """

    file_path = DATA_DIR / "trips.txt"

    if not file_path.exists():
        raise FileNotFoundError(
            f"Missing TGSRTC file: {file_path}"
        )

    trips = pd.read_csv(
        file_path,
        low_memory=False,
    )

    return trips


@lru_cache(maxsize=1)
def load_stop_times():
    """
    Load TGSRTC stop_times.txt.
    """

    file_path = DATA_DIR / "stop_times.txt"

    if not file_path.exists():
        raise FileNotFoundError(
            f"Missing TGSRTC file: {file_path}"
        )

    stop_times = pd.read_csv(
        file_path,
        low_memory=False,
    )

    return stop_times


@lru_cache(maxsize=1)
def load_calendar():
    """
    Load calendar.txt if it exists.
    """

    file_path = DATA_DIR / "calendar.txt"

    if not file_path.exists():
        return pd.DataFrame()

    return pd.read_csv(
        file_path,
        low_memory=False,
    )


# ============================================================
# HAVERSINE DISTANCE
# ============================================================

def haversine_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """
    Calculate distance between two GPS coordinates.

    Returns distance in kilometers.
    """

    earth_radius_km = 6371.0

    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)

    delta_lat = radians(
        lat2 - lat1
    )

    delta_lon = radians(
        lon2 - lon1
    )

    a = (
        sin(delta_lat / 2) ** 2
        +
        cos(lat1_rad)
        * cos(lat2_rad)
        * sin(delta_lon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a),
    )

    return earth_radius_km * c


# ============================================================
# GTFS TIME PARSER
# ============================================================

def parse_gtfs_time(
    time_string: str,
):
    """
    Convert GTFS HH:MM:SS into seconds from midnight.

    Supports GTFS times greater than 24 hours.

    Example:

        08:30:00 -> 30600
        25:30:00 -> 91800
    """

    try:

        parts = str(
            time_string
        ).split(":")

        if len(parts) != 3:
            return None

        hours = int(parts[0])
        minutes = int(parts[1])
        seconds = int(parts[2])

        if minutes < 0 or minutes >= 60:
            return None

        if seconds < 0 or seconds >= 60:
            return None

        return (
            hours * 3600
            + minutes * 60
            + seconds
        )

    except (
        ValueError,
        TypeError,
    ):
        return None


# ============================================================
# FORMAT GTFS TIME
# ============================================================

def format_gtfs_time(
    total_seconds: int,
) -> str:
    """
    Convert seconds since midnight into HH:MM:SS.

    Supports hours greater than 24.
    """

    total_seconds = max(
        0,
        int(total_seconds),
    )

    hours = total_seconds // 3600

    minutes = (
        total_seconds % 3600
    ) // 60

    seconds = (
        total_seconds % 60
    )

    return (
        f"{hours:02d}:"
        f"{minutes:02d}:"
        f"{seconds:02d}"
    )


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "name": "SmartCommute AI API",
        "status": "online",
        "data_source": "TGSRTC GTFS",
        "version": "1.0.0",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health():

    return {
        "status": "healthy",
        "service": "SmartCommute AI API",
    }


# ============================================================
# GTFS STATS
# ============================================================

@app.get("/api/gtfs/stats")
def gtfs_stats():

    stops = load_stops()

    routes = load_routes()

    trips = load_trips()

    stop_times = load_stop_times()

    return {
        "stops": len(stops),
        "routes": len(routes),
        "trips": len(trips),
        "stop_times": len(stop_times),
    }


# ============================================================
# NEARBY STOPS
# ============================================================

@app.get("/api/stops/nearby")
def nearby_stops(
    lat: float = Query(
        ...,
        ge=-90,
        le=90,
        description="User latitude",
    ),
    lng: float = Query(
        ...,
        ge=-180,
        le=180,
        description="User longitude",
    ),
    limit: int = Query(
        5,
        ge=1,
        le=20,
        description="Number of stops",
    ),
    radius_km: float = Query(
        5,
        gt=0,
        le=50,
        description="Search radius in kilometers",
    ),
):

    stops = load_stops().copy()

    # --------------------------------------------------------
    # Calculate distance to every stop
    # --------------------------------------------------------

    stops["distance_km"] = stops.apply(
        lambda row: haversine_distance(
            lat,
            lng,
            float(row["stop_lat"]),
            float(row["stop_lon"]),
        ),
        axis=1,
    )

    # --------------------------------------------------------
    # Filter radius
    # --------------------------------------------------------

    stops = stops[
        stops["distance_km"]
        <= radius_km
    ]

    # --------------------------------------------------------
    # Closest first
    # --------------------------------------------------------

    stops = stops.sort_values(
        "distance_km"
    )

    stops = stops.head(
        limit
    )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    results = []

    for _, stop in stops.iterrows():

        results.append(
            {
                "stop_id": str(
                    stop["stop_id"]
                ),
                "stop_name": str(
                    stop["stop_name"]
                ),
                "zone_id": str(
                    stop.get(
                        "zone_id",
                        "",
                    )
                ),
                "latitude": float(
                    stop["stop_lat"]
                ),
                "longitude": float(
                    stop["stop_lon"]
                ),
                "distance_km": round(
                    float(
                        stop["distance_km"]
                    ),
                    3,
                ),
                "distance_m": round(
                    float(
                        stop["distance_km"]
                    )
                    * 1000
                ),
            }
        )

    return {
        "user_location": {
            "latitude": lat,
            "longitude": lng,
        },
        "search_radius_km": radius_km,
        "count": len(results),
        "stops": results,
    }


# ============================================================
# STOP DETAILS
# ============================================================

@app.get("/api/stops/{stop_id}")
def stop_details(
    stop_id: str,
):

    stops = load_stops()

    matches = stops[
        stops["stop_id"].astype(str)
        == str(stop_id)
    ]

    if matches.empty:

        raise HTTPException(
            status_code=404,
            detail="Stop not found",
        )

    stop = matches.iloc[0]

    return {
        "stop_id": str(
            stop["stop_id"]
        ),
        "stop_name": str(
            stop["stop_name"]
        ),
        "zone_id": str(
            stop.get(
                "zone_id",
                "",
            )
        ),
        "latitude": float(
            stop["stop_lat"]
        ),
        "longitude": float(
            stop["stop_lon"]
        ),
        "description": str(
            stop.get(
                "stop_desc",
                "",
            )
        ),
    }


# ============================================================
# ROUTES SERVING A STOP
# ============================================================

@app.get(
    "/api/stops/{stop_id}/routes"
)
def routes_for_stop(
    stop_id: str,
):

    stops = load_stops()

    # --------------------------------------------------------
    # Verify stop
    # --------------------------------------------------------

    stop_exists = (
        stops["stop_id"].astype(str)
        == str(stop_id)
    ).any()

    if not stop_exists:

        raise HTTPException(
            status_code=404,
            detail="Stop not found",
        )

    stop_times = load_stop_times()

    trips = load_trips()

    routes = load_routes()

    # --------------------------------------------------------
    # Find trips visiting stop
    # --------------------------------------------------------

    stop_trip_ids = (
        stop_times[
            stop_times["stop_id"]
            .astype(str)
            == str(stop_id)
        ]["trip_id"]
        .astype(str)
        .unique()
    )

    if len(stop_trip_ids) == 0:

        return {
            "stop_id": stop_id,
            "route_count": 0,
            "routes": [],
        }

    # --------------------------------------------------------
    # Find matching trips
    # --------------------------------------------------------

    trips_copy = trips.copy()

    trips_copy["trip_id"] = (
        trips_copy["trip_id"]
        .astype(str)
    )

    trips_copy["route_id"] = (
        trips_copy["route_id"]
        .astype(str)
    )

    matching_trips = trips_copy[
        trips_copy["trip_id"]
        .isin(stop_trip_ids)
    ]

    route_ids = (
        matching_trips[
            "route_id"
        ]
        .unique()
    )

    # --------------------------------------------------------
    # Normalize routes
    # --------------------------------------------------------

    routes_copy = routes.copy()

    routes_copy["route_id"] = (
        routes_copy["route_id"]
        .astype(str)
    )

    matching_routes = routes_copy[
        routes_copy["route_id"]
        .isin(route_ids)
    ]

    # --------------------------------------------------------
    # Build response
    # --------------------------------------------------------

    results = []

    for _, route in (
        matching_routes.iterrows()
    ):

        route_short_name = route.get(
            "route_short_name",
            route["route_id"],
        )

        route_long_name = route.get(
            "route_long_name",
            "",
        )

        route_type = route.get(
            "route_type",
            None,
        )

        results.append(
            {
                "route_id": str(
                    route["route_id"]
                ),
                "route_short_name": str(
                    route_short_name
                ),
                "route_long_name": (
                    str(route_long_name)
                    if pd.notna(
                        route_long_name
                    )
                    else ""
                ),
                "route_type": (
                    int(route_type)
                    if pd.notna(
                        route_type
                    )
                    else None
                ),
            }
        )

    results.sort(
        key=lambda item:
        item["route_short_name"]
    )

    return {
        "stop_id": stop_id,
        "route_count": len(results),
        "routes": results,
    }


# ============================================================
# UPCOMING BUSES
# ============================================================

@app.get(
    "/api/stops/{stop_id}/upcoming"
)
def upcoming_buses(
    stop_id: str,

    minutes: int = Query(
        120,
        ge=15,
        le=360,
        description=(
            "Look ahead this many minutes"
        ),
    ),

    limit: int = Query(
        10,
        ge=1,
        le=50,
        description=(
            "Maximum number of buses"
        ),
    ),
):

    # --------------------------------------------------------
    # Load data
    # --------------------------------------------------------

    stops = load_stops()

    stop_times = load_stop_times()

    trips = load_trips()

    routes = load_routes()

    # --------------------------------------------------------
    # Verify stop
    # --------------------------------------------------------

    stop_matches = stops[
        stops["stop_id"].astype(str)
        == str(stop_id)
    ]

    if stop_matches.empty:

        raise HTTPException(
            status_code=404,
            detail="Stop not found",
        )

    stop = stop_matches.iloc[0]

    # --------------------------------------------------------
    # Current time
    # --------------------------------------------------------

    now = datetime.now()

    current_seconds = (
        now.hour * 3600
        + now.minute * 60
        + now.second
    )

    end_seconds = (
        current_seconds
        + minutes * 60
    )

    # --------------------------------------------------------
    # Stop times for this stop
    # --------------------------------------------------------

    stop_records = stop_times[
        stop_times["stop_id"]
        .astype(str)
        == str(stop_id)
    ].copy()

    if stop_records.empty:

        return {
            "stop": {
                "stop_id": str(
                    stop["stop_id"]
                ),
                "stop_name": str(
                    stop["stop_name"]
                ),
                "latitude": float(
                    stop["stop_lat"]
                ),
                "longitude": float(
                    stop["stop_lon"]
                ),
            },
            "current_time": now.strftime(
                "%H:%M:%S"
            ),
            "lookahead_minutes": minutes,
            "count": 0,
            "buses": [],
        }

    # --------------------------------------------------------
    # Parse arrival time
    # --------------------------------------------------------

    stop_records[
        "arrival_seconds"
    ] = stop_records[
        "arrival_time"
    ].apply(
        parse_gtfs_time
    )

    stop_records = (
        stop_records.dropna(
            subset=[
                "arrival_seconds"
            ]
        )
    )

    # --------------------------------------------------------
    # Parse departure time if available
    # --------------------------------------------------------

    if "departure_time" in stop_records.columns:

        stop_records[
            "departure_seconds"
        ] = stop_records[
            "departure_time"
        ].apply(
            parse_gtfs_time
        )

    # --------------------------------------------------------
    # Find upcoming records
    # --------------------------------------------------------

    upcoming = stop_records[
        (
            stop_records[
                "arrival_seconds"
            ]
            >= current_seconds
        )
        &
        (
            stop_records[
                "arrival_seconds"
            ]
            <= end_seconds
        )
    ].copy()

    # --------------------------------------------------------
    # Sort
    # --------------------------------------------------------

    upcoming = upcoming.sort_values(
        "arrival_seconds"
    )

    # --------------------------------------------------------
    # Limit
    # --------------------------------------------------------

    upcoming = upcoming.head(
        limit
    )

    if upcoming.empty:

        return {
            "stop": {
                "stop_id": str(
                    stop["stop_id"]
                ),
                "stop_name": str(
                    stop["stop_name"]
                ),
                "latitude": float(
                    stop["stop_lat"]
                ),
                "longitude": float(
                    stop["stop_lon"]
                ),
            },
            "current_time": now.strftime(
                "%H:%M:%S"
            ),
            "lookahead_minutes": minutes,
            "count": 0,
            "buses": [],
        }

    # --------------------------------------------------------
    # Normalize IDs
    # --------------------------------------------------------

    upcoming["trip_id"] = (
        upcoming["trip_id"]
        .astype(str)
    )

    trips_copy = trips.copy()

    routes_copy = routes.copy()

    trips_copy["trip_id"] = (
        trips_copy["trip_id"]
        .astype(str)
    )

    if "route_id" not in trips_copy.columns:

        raise HTTPException(
            status_code=500,
            detail=(
                "TGSRTC trips.txt does not "
                "contain route_id"
            ),
        )

    trips_copy["route_id"] = (
        trips_copy["route_id"]
        .astype(str)
    )

    routes_copy["route_id"] = (
        routes_copy["route_id"]
        .astype(str)
    )

    # --------------------------------------------------------
    # Join stop times → trips
    # --------------------------------------------------------

    merged = upcoming.merge(
        trips_copy,
        on="trip_id",
        how="left",
        suffixes=(
            "",
            "_trip",
        ),
    )

    # --------------------------------------------------------
    # Join trips → routes
    #
    # IMPORTANT:
    # route_long_name is OPTIONAL in GTFS.
    # The TGSRTC dataset does not contain it.
    # --------------------------------------------------------

    route_columns = [
        "route_id",
    ]

    if "route_short_name" in routes_copy.columns:
        route_columns.append(
            "route_short_name"
        )

    if "route_long_name" in routes_copy.columns:
        route_columns.append(
            "route_long_name"
        )

    route_info = routes_copy[
        route_columns
    ].copy()

    merged = merged.merge(
        route_info,
        on="route_id",
        how="left",
    )

    # --------------------------------------------------------
    # Build buses
    # --------------------------------------------------------

    buses = []

    for _, row in merged.iterrows():

        # ----------------------------------------------------
        # Arrival
        # ----------------------------------------------------

        arrival_seconds = int(
            row["arrival_seconds"]
        )

        # ----------------------------------------------------
        # ETA
        # ----------------------------------------------------

        eta_seconds = (
            arrival_seconds
            - current_seconds
        )

        eta_minutes = max(
            0,
            round(
                eta_seconds / 60
            ),
        )

        # ----------------------------------------------------
        # Route number
        # ----------------------------------------------------

        route_number = row.get(
            "route_short_name",
            row["route_id"],
        )

        if pd.isna(
            route_number
        ):

            route_number = row[
                "route_id"
            ]

        # ----------------------------------------------------
        # Route name
        # ----------------------------------------------------

        if (
            "route_long_name"
            in merged.columns
            and pd.notna(
                row.get(
                    "route_long_name"
                )
            )
        ):

            route_name = str(
                row[
                    "route_long_name"
                ]
            )

        else:

            route_name = str(
                route_number
            )

        # ----------------------------------------------------
        # Trip name
        # ----------------------------------------------------

        trip_name = row.get(
            "trip_short_name",
            "",
        )

        if pd.isna(
            trip_name
        ):

            trip_name = ""

        # ----------------------------------------------------
        # Direction
        # ----------------------------------------------------

        direction_id = row.get(
            "direction_id",
            None,
        )

        if pd.isna(
            direction_id
        ):

            direction_id = None

        else:

            try:

                direction_id = int(
                    direction_id
                )

            except (
                ValueError,
                TypeError,
            ):

                direction_id = None

        # ----------------------------------------------------
        # Departure
        # ----------------------------------------------------

        departure_time = row.get(
            "departure_time",
            row["arrival_time"],
        )

        if pd.isna(
            departure_time
        ):

            departure_time = (
                row["arrival_time"]
            )

        # ----------------------------------------------------
        # Add result
        # ----------------------------------------------------

        buses.append(
            {
                "trip_id": str(
                    row["trip_id"]
                ),

                "route_id": str(
                    row["route_id"]
                ),

                "route_number": str(
                    route_number
                ),

                "route_name": route_name,

                "trip_name": str(
                    trip_name
                ),

                "direction_id": (
                    direction_id
                ),

                "arrival_time": str(
                    row["arrival_time"]
                ),

                "departure_time": str(
                    departure_time
                ),

                "eta_minutes": (
                    eta_minutes
                ),

                "status": (
                    "Scheduled"
                ),
            }
        )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "stop": {
            "stop_id": str(
                stop["stop_id"]
            ),
            "stop_name": str(
                stop["stop_name"]
            ),
            "latitude": float(
                stop["stop_lat"]
            ),
            "longitude": float(
                stop["stop_lon"]
            ),
        },

        "current_time": now.strftime(
            "%H:%M:%S"
        ),

        "lookahead_minutes": minutes,

        "count": len(buses),

        "buses": buses,
    }


# ============================================================
# DEBUG — DATASET COLUMNS
# ============================================================

@app.get("/api/debug/schema")
def debug_schema():

    stops = load_stops()

    routes = load_routes()

    trips = load_trips()

    stop_times = load_stop_times()

    return {
        "stops_columns": list(
            stops.columns
        ),
        "routes_columns": list(
            routes.columns
        ),
        "trips_columns": list(
            trips.columns
        ),
        "stop_times_columns": list(
            stop_times.columns
        ),
    }
# ============================================================
# TRIP ROUTE
# ============================================================

@app.get("/api/trips/{trip_id}/route")
def trip_route(
    trip_id: str,
):
    """
    Reconstruct an actual TGSRTC trip from:

        trips.txt
        stop_times.txt
        stops.txt
        routes.txt

    The result contains the ordered stops and their
    coordinates/times.
    """

    # --------------------------------------------------------
    # Load data
    # --------------------------------------------------------

    trips = load_trips()
    stop_times = load_stop_times()
    stops = load_stops()
    routes = load_routes()

    # --------------------------------------------------------
    # Normalize IDs
    # --------------------------------------------------------

    trips_copy = trips.copy()

    trips_copy["trip_id"] = (
        trips_copy["trip_id"]
        .astype(str)
    )

    trips_copy["route_id"] = (
        trips_copy["route_id"]
        .astype(str)
    )

    stop_times_copy = stop_times.copy()

    stop_times_copy["trip_id"] = (
        stop_times_copy["trip_id"]
        .astype(str)
    )

    stop_times_copy["stop_id"] = (
        stop_times_copy["stop_id"]
        .astype(str)
    )

    stops_copy = stops.copy()

    stops_copy["stop_id"] = (
        stops_copy["stop_id"]
        .astype(str)
    )

    routes_copy = routes.copy()

    routes_copy["route_id"] = (
        routes_copy["route_id"]
        .astype(str)
    )

    # --------------------------------------------------------
    # Find trip
    # --------------------------------------------------------

    trip_matches = trips_copy[
        trips_copy["trip_id"]
        == str(trip_id)
    ]

    if trip_matches.empty:

        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    trip = trip_matches.iloc[0]

    route_id = str(
        trip["route_id"]
    )

    # --------------------------------------------------------
    # Find route information
    # --------------------------------------------------------

    route_matches = routes_copy[
        routes_copy["route_id"]
        == route_id
    ]

    route_number = route_id

    if not route_matches.empty:

        route = route_matches.iloc[0]

        if "route_short_name" in route.index:

            if pd.notna(
                route["route_short_name"]
            ):

                route_number = str(
                    route["route_short_name"]
                )

    # --------------------------------------------------------
    # Find stop times for trip
    # --------------------------------------------------------

    trip_stop_times = stop_times_copy[
        stop_times_copy["trip_id"]
        == str(trip_id)
    ].copy()

    if trip_stop_times.empty:

        return {
            "trip_id": str(trip_id),
            "route_id": route_id,
            "route_number": route_number,
            "stop_count": 0,
            "stops": [],
        }

    # --------------------------------------------------------
    # Sort by actual GTFS stop sequence
    # --------------------------------------------------------

    trip_stop_times[
        "stop_sequence"
    ] = pd.to_numeric(
        trip_stop_times[
            "stop_sequence"
        ],
        errors="coerce",
    )

    trip_stop_times = (
        trip_stop_times
        .sort_values(
            "stop_sequence"
        )
    )

    # --------------------------------------------------------
    # Join stops
    # --------------------------------------------------------

    trip_stop_times = (
        trip_stop_times.merge(
            stops_copy[
                [
                    "stop_id",
                    "stop_name",
                    "zone_id",
                    "stop_lat",
                    "stop_lon",
                    "stop_desc",
                ]
            ],
            on="stop_id",
            how="left",
        )
    )

    # --------------------------------------------------------
    # Build ordered route
    # --------------------------------------------------------

    route_stops = []

    for _, row in (
        trip_stop_times.iterrows()
    ):

        latitude = row.get(
            "stop_lat"
        )

        longitude = row.get(
            "stop_lon"
        )

        if pd.isna(latitude) or pd.isna(
            longitude
        ):
            continue

        arrival_time = row.get(
            "arrival_time",
            "",
        )

        departure_time = row.get(
            "departure_time",
            "",
        )

        if pd.isna(
            arrival_time
        ):
            arrival_time = ""

        if pd.isna(
            departure_time
        ):
            departure_time = ""

        route_stops.append(
            {
                "stop_sequence": int(
                    row[
                        "stop_sequence"
                    ]
                ),

                "stop_id": str(
                    row["stop_id"]
                ),

                "stop_name": str(
                    row["stop_name"]
                ),

                "zone_id": str(
                    row.get(
                        "zone_id",
                        "",
                    )
                ),

                "latitude": float(
                    latitude
                ),

                "longitude": float(
                    longitude
                ),

                "arrival_time": str(
                    arrival_time
                ),

                "departure_time": str(
                    departure_time
                ),
            }
        )

    # --------------------------------------------------------
    # Trip information
    # --------------------------------------------------------

    service_id = trip.get(
        "service_id",
        "",
    )

    direction_id = trip.get(
        "direction_id",
        None,
    )

    trip_name = trip.get(
        "trip_short_name",
        "",
    )

    if pd.isna(
        service_id
    ):
        service_id = ""

    if pd.isna(
        trip_name
    ):
        trip_name = ""

    if pd.isna(
        direction_id
    ):
        direction_id = None
    else:
        direction_id = int(
            direction_id
        )

    return {
        "trip_id": str(
            trip_id
        ),

        "route_id": route_id,

        "route_number": route_number,

        "trip_name": str(
            trip_name
        ),

        "service_id": str(
            service_id
        ),

        "direction_id": direction_id,

        "stop_count": len(
            route_stops
        ),

        "stops": route_stops,
    }

# ============================================================
# LIVE VEHICLE GPS SIMULATOR
# ============================================================

from datetime import datetime, timedelta


@app.get("/api/vehicles/live")
def live_vehicles():
    """
    Simulates live GPS positions for selected TGSRTC trips.

    The vehicle position is calculated from the actual GTFS
    stop coordinates and scheduled arrival/departure times.

    Later, this endpoint can be replaced by an authorized
    real-time TGSRTC GPS/VTPIS feed.
    """

    # Trips we want to simulate
    trip_ids = [
        "41828307",
    ]

    live_vehicles = []

    now = datetime.now()

    for trip_id in trip_ids:

        # ----------------------------------------------------
        # Get actual trip route
        # ----------------------------------------------------

        trips = load_trips()
        stop_times = load_stop_times()
        stops = load_stops()
        routes = load_routes()

        trips_copy = trips.copy()
        trips_copy["trip_id"] = trips_copy["trip_id"].astype(str)

        stop_times_copy = stop_times.copy()
        stop_times_copy["trip_id"] = stop_times_copy["trip_id"].astype(str)
        stop_times_copy["stop_id"] = stop_times_copy["stop_id"].astype(str)

        stops_copy = stops.copy()
        stops_copy["stop_id"] = stops_copy["stop_id"].astype(str)

        routes_copy = routes.copy()
        routes_copy["route_id"] = routes_copy["route_id"].astype(str)

        # ----------------------------------------------------
        # Find trip
        # ----------------------------------------------------

        trip_matches = trips_copy[
            trips_copy["trip_id"] == trip_id
        ]

        if trip_matches.empty:
            continue

        trip = trip_matches.iloc[0]

        route_id = str(trip["route_id"])

        # ----------------------------------------------------
        # Get route number
        # ----------------------------------------------------

        route_number = route_id

        route_matches = routes_copy[
            routes_copy["route_id"] == route_id
        ]

        if not route_matches.empty:

            route = route_matches.iloc[0]

            if "route_short_name" in route.index:

                if pd.notna(route["route_short_name"]):
                    route_number = str(
                        route["route_short_name"]
                    )

        # ----------------------------------------------------
        # Get trip stop times
        # ----------------------------------------------------

        trip_stop_times = stop_times_copy[
            stop_times_copy["trip_id"] == trip_id
        ].copy()

        if trip_stop_times.empty:
            continue

        trip_stop_times["stop_sequence"] = pd.to_numeric(
            trip_stop_times["stop_sequence"],
            errors="coerce",
        )

        trip_stop_times = trip_stop_times.sort_values(
            "stop_sequence"
        )

        # ----------------------------------------------------
        # Join coordinates
        # ----------------------------------------------------

        trip_stop_times = trip_stop_times.merge(
            stops_copy[
                [
                    "stop_id",
                    "stop_name",
                    "stop_lat",
                    "stop_lon",
                ]
            ],
            on="stop_id",
            how="left",
        )

        route_stops = []

        for _, row in trip_stop_times.iterrows():

            if (
                pd.isna(row["stop_lat"])
                or pd.isna(row["stop_lon"])
            ):
                continue

            route_stops.append(
                {
                    "sequence": int(
                        row["stop_sequence"]
                    ),
                    "stop_id": str(
                        row["stop_id"]
                    ),
                    "stop_name": str(
                        row["stop_name"]
                    ),
                    "lat": float(
                        row["stop_lat"]
                    ),
                    "lon": float(
                        row["stop_lon"]
                    ),
                    "arrival": str(
                        row["arrival_time"]
                    ),
                    "departure": str(
                        row["departure_time"]
                    ),
                }
            )

        if len(route_stops) < 2:
            continue

        # ----------------------------------------------------
        # Convert current time to seconds
        # ----------------------------------------------------

        current_seconds = (
            now.hour * 3600
            + now.minute * 60
            + now.second
        )

        # ----------------------------------------------------
        # Convert GTFS time
        # ----------------------------------------------------

        def gtfs_seconds(time_string):

            try:

                parts = time_string.split(":")

                hours = int(parts[0])
                minutes = int(parts[1])
                seconds = int(parts[2])

                return (
                    hours * 3600
                    + minutes * 60
                    + seconds
                )

            except Exception:
                return None

        # ----------------------------------------------------
        # Find current segment
        # ----------------------------------------------------

        current_stop = None
        next_stop = None

        for index in range(
            len(route_stops) - 1
        ):

            current = route_stops[index]
            next_item = route_stops[index + 1]

            departure_seconds = gtfs_seconds(
                current["departure"]
            )

            next_arrival_seconds = gtfs_seconds(
                next_item["arrival"]
            )

            if (
                departure_seconds is None
                or next_arrival_seconds is None
            ):
                continue

            if (
                departure_seconds
                <= current_seconds
                <= next_arrival_seconds
            ):

                current_stop = current
                next_stop = next_item

                break

        # ----------------------------------------------------
        # Trip hasn't started
        # ----------------------------------------------------

        if current_stop is None:

            first_stop = route_stops[0]
            last_stop = route_stops[-1]

            first_time = gtfs_seconds(
                first_stop["departure"]
            )

            last_time = gtfs_seconds(
                last_stop["arrival"]
            )

            if (
                first_time is not None
                and current_seconds < first_time
            ):

                live_vehicles.append(
                    {
                        "vehicle_id": f"SC-{route_number}-01",
                        "trip_id": trip_id,
                        "route_number": route_number,
                        "status": "Not Started",
                        "latitude": first_stop["lat"],
                        "longitude": first_stop["lon"],
                        "current_stop": first_stop[
                            "stop_name"
                        ],
                        "next_stop": first_stop[
                            "stop_name"
                        ],
                        "progress": 0,
                    }
                )

                continue

            if (
                last_time is not None
                and current_seconds > last_time
            ):

                live_vehicles.append(
                    {
                        "vehicle_id": f"SC-{route_number}-01",
                        "trip_id": trip_id,
                        "route_number": route_number,
                        "status": "Completed",
                        "latitude": last_stop["lat"],
                        "longitude": last_stop["lon"],
                        "current_stop": last_stop[
                            "stop_name"
                        ],
                        "next_stop": None,
                        "progress": 100,
                    }
                )

                continue

        # ----------------------------------------------------
        # Calculate interpolated GPS position
        # ----------------------------------------------------

        if current_stop and next_stop:

            start_time = gtfs_seconds(
                current_stop["departure"]
            )

            end_time = gtfs_seconds(
                next_stop["arrival"]
            )

            if (
                start_time is None
                or end_time is None
                or end_time <= start_time
            ):
                progress = 0

            else:

                progress = (
                    current_seconds
                    - start_time
                ) / (
                    end_time
                    - start_time
                )

                progress = max(
                    0,
                    min(
                        progress,
                        1,
                    ),
                )

            # Linear interpolation
            latitude = (
                current_stop["lat"]
                + (
                    next_stop["lat"]
                    - current_stop["lat"]
                )
                * progress
            )

            longitude = (
                current_stop["lon"]
                + (
                    next_stop["lon"]
                    - current_stop["lon"]
                )
                * progress
            )

            # ------------------------------------------------
            # Status
            # ------------------------------------------------

            scheduled_progress_time = (
                start_time
                + (
                    end_time
                    - start_time
                )
                * progress
            )

            delay_seconds = (
                current_seconds
                - scheduled_progress_time
            )

            if delay_seconds <= 60:
                status = "On Time"

            elif delay_seconds <= 300:
                status = "Delayed"

            else:
                status = "Significantly Delayed"

            live_vehicles.append(
                {
                    "vehicle_id": f"SC-{route_number}-01",
                    "trip_id": trip_id,
                    "route_number": route_number,
                    "status": status,

                    "latitude": round(
                        latitude,
                        6,
                    ),

                    "longitude": round(
                        longitude,
                        6,
                    ),

                    "current_stop": current_stop[
                        "stop_name"
                    ],

                    "next_stop": next_stop[
                        "stop_name"
                    ],

                    "progress": round(
                        progress * 100,
                        1,
                    ),

                    "scheduled_next_arrival":
                        next_stop["arrival"],

                    "updated_at":
                        now.isoformat(),
                }
            )

    return {
        "timestamp": now.isoformat(),
        "source": "GTFS schedule simulation",
        "vehicles": live_vehicles,
    }

# ============================================================
# RUN DIRECTLY
# ============================================================

if __name__ == "__main__":

    

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )