import json
import urllib.parse
import urllib.request
from typing import Any


OSRM_URL = "https://router.project-osrm.org/route/v1/driving"

# These are planning assumptions, not live fuel prices.
VEHICLES = {
    "mini_truck": {
        "label": "Mini Truck",
        "capacity_kg": 1500,
        "fuel_efficiency_kmpl": 12.0,
        "fuel_price_inr_per_litre": 95.0,
        "driver_cost_per_hour": 180.0,
    },
    "light_truck": {
        "label": "Light Truck",
        "capacity_kg": 3500,
        "fuel_efficiency_kmpl": 9.0,
        "fuel_price_inr_per_litre": 95.0,
        "driver_cost_per_hour": 220.0,
    },
    "medium_truck": {
        "label": "Medium Truck",
        "capacity_kg": 7500,
        "fuel_efficiency_kmpl": 6.5,
        "fuel_price_inr_per_litre": 95.0,
        "driver_cost_per_hour": 280.0,
    },
    "heavy_truck": {
        "label": "Heavy Truck",
        "capacity_kg": 15000,
        "fuel_efficiency_kmpl": 4.5,
        "fuel_price_inr_per_litre": 95.0,
        "driver_cost_per_hour": 350.0,
    },
}


def get_vehicle(vehicle_type: str) -> dict[str, Any]:
    vehicle = VEHICLES.get(vehicle_type)

    if not vehicle:
        raise ValueError(
            f"Unsupported vehicle type: {vehicle_type}"
        )

    return vehicle


def calculate_operating_cost(
    distance_km: float,
    duration_minutes: float,
    vehicle: dict[str, Any],
) -> dict[str, float]:
    fuel_litres = (
        distance_km
        / vehicle["fuel_efficiency_kmpl"]
    )

    fuel_cost = (
        fuel_litres
        * vehicle["fuel_price_inr_per_litre"]
    )

    driver_cost = (
        duration_minutes / 60
    ) * vehicle["driver_cost_per_hour"]

    estimated_total = fuel_cost + driver_cost

    return {
        "fuel_litres": round(fuel_litres, 2),
        "fuel_cost_inr": round(fuel_cost, 2),
        "driver_cost_inr": round(driver_cost, 2),
        "estimated_total_inr": round(
            estimated_total,
            2,
        ),
    }


def fetch_osrm_routes(
    origin_lat: float,
    origin_lng: float,
    destination_lat: float,
    destination_lng: float,
) -> list[dict[str, Any]]:

    coordinates = (
        f"{origin_lng},{origin_lat};"
        f"{destination_lng},{destination_lat}"
    )

    params = urllib.parse.urlencode(
        {
            "alternatives": "true",
            "steps": "false",
            "geometries": "geojson",
            "overview": "full",
        }
    )

    url = (
        f"{OSRM_URL}/"
        f"{coordinates}?"
        f"{params}"
    )

    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "SmartCommuteAI/1.0",
        },
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=15,
        ) as response:

            payload = json.loads(
                response.read().decode(
                    "utf-8"
                )
            )

    except Exception as exc:
        raise RuntimeError(
            "Road routing service is temporarily "
            "unavailable."
        ) from exc

    if payload.get("code") != "Ok":
        raise RuntimeError(
            payload.get(
                "message",
                "No road route was found.",
            )
        )

    return payload.get("routes", [])


def build_logistics_routes(
    origin_lat: float,
    origin_lng: float,
    destination_lat: float,
    destination_lng: float,
    cargo_weight_kg: float,
    vehicle_type: str,
) -> dict[str, Any]:

    vehicle = get_vehicle(
        vehicle_type
    )

    capacity_kg = vehicle["capacity_kg"]

    if cargo_weight_kg > capacity_kg:
        return {
            "valid": False,
            "message": (
                f"Cargo weight exceeds the "
                f"{vehicle['label']} capacity."
            ),
            "vehicle": {
                "type": vehicle_type,
                **vehicle,
            },
            "routes": [],
        }

    if cargo_weight_kg <= 0:
        raise ValueError(
            "Cargo weight must be greater than zero."
        )

    routes = fetch_osrm_routes(
        origin_lat,
        origin_lng,
        destination_lat,
        destination_lng,
    )

    if not routes:
        return {
            "valid": False,
            "message": "No road route found.",
            "routes": [],
        }

    results = []

    for index, route in enumerate(routes):

        distance_km = (
            float(route["distance"])
            / 1000
        )

        duration_minutes = (
            float(route["duration"])
            / 60
        )

        cost = calculate_operating_cost(
            distance_km,
            duration_minutes,
            vehicle,
        )

        results.append(
            {
                "route_id": f"LOG-{index + 1}",

                "alternative_number":
                    index + 1,

                "distance_km": round(
                    distance_km,
                    2,
                ),

                "duration_minutes": round(
                    duration_minutes,
                    1,
                ),

                "duration_text": (
                    f"{int(duration_minutes // 60)}h "
                    f"{int(duration_minutes % 60)}m"
                ),

                "estimated_cost": cost,

                "geometry":
                    route.get("geometry"),

                "weight":
                    route.get("weight"),

                "vehicle_suitable": True,

                "capacity_utilization_percent":
                    round(
                        (
                            cargo_weight_kg
                            / capacity_kg
                        )
                        * 100,
                        1,
                    ),
            }
        )

    results.sort(
        key=lambda item: (
            item["estimated_cost"][
                "estimated_total_inr"
            ],
            item["duration_minutes"],
        )
    )

    for index, route in enumerate(results):
        route["rank"] = index + 1

        if index == 0:
            route["recommendation"] = (
                "Lowest estimated operating cost"
            )
        else:
            route["recommendation"] = (
                "Alternative route"
            )

    return {
        "valid": True,

        "vehicle": {
            "type": vehicle_type,
            **vehicle,
        },

        "cargo": {
            "weight_kg": cargo_weight_kg,
            "capacity_kg": capacity_kg,
            "utilization_percent": round(
                (
                    cargo_weight_kg
                    / capacity_kg
                )
                * 100,
                1,
            ),
        },

        "route_source": (
            "OpenStreetMap road network "
            "via OSRM"
        ),

        "cost_method": (
            "Estimated fuel + driver operating cost"
        ),

        "routes": results,
    }