"use client";

import dynamic from "next/dynamic";
import { KeyboardEvent, useEffect, useState } from "react";

const LogisticsRouteMap = dynamic(
  () => import("@/components/logistics/LogisticsRouteMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-500">
            Loading map...
          </p>
        </div>
      </div>
    ),
  }
);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

interface LocationResult {
  display_name: string;
  latitude: number;
  longitude: number;
  type?: string | null;
}

interface Vehicle {
  type: string;
  label: string;
  capacity_kg: number;
  fuel_efficiency_kmpl: number;
  fuel_price_inr_per_litre: number;
  driver_cost_per_hour: number;
}

interface RouteCost {
  fuel_litres: number;
  fuel_cost_inr: number;
  driver_cost_inr: number;
  estimated_total_inr: number;
}

interface LogisticsRoute {
  route_id: string;
  alternative_number: number;
  distance_km: number;
  duration_minutes: number;
  duration_text: string;
  estimated_cost: RouteCost;
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
}

interface RouteResponse {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  valid: boolean;
  vehicle: Vehicle;
  cargo: {
    weight_kg: number;
    capacity_kg: number;
    utilization_percent: number;
  };
  route_source: string;
  cost_method: string;
  routes: LogisticsRoute[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number, decimals = 1) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
  }).format(value);
}

function LocationField({
  label,
  value,
  placeholder,
  results,
  selected,
  searching,
  onChange,
  onSearch,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  results: LocationResult[];
  selected: LocationResult | null;
  searching: boolean;
  onChange: (value: string) => void;
  onSearch: () => void;
  onSelect: (location: LocationResult) => void;
}) {
  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSearch();
    }
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
        />

        <button
          type="button"
          onClick={onSearch}
          disabled={searching || value.trim().length < 2}
          className="h-11 shrink-0 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {searching ? "..." : "Search"}
        </button>
      </div>

      {selected && (
        <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <div className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Selected
              </p>

              <p className="mt-0.5 break-words text-xs font-semibold leading-5 text-emerald-900">
                {selected.display_name}
              </p>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && !selected && (
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((result, index) => (
            <button
              key={`${result.latitude}-${result.longitude}-${index}`}
              type="button"
              onClick={() => onSelect(result)}
              className="block w-full border-b border-slate-100 px-3 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
            >
              <p className="break-words text-xs font-semibold leading-5 text-slate-800">
                {result.display_name}
              </p>

              {result.type && (
                <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
                  {result.type}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LogisticsRoutesPage() {
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");

  const [fromResults, setFromResults] = useState<LocationResult[]>(
    []
  );
  const [toResults, setToResults] = useState<LocationResult[]>([]);

  const [origin, setOrigin] =
    useState<LocationResult | null>(null);

  const [destination, setDestination] =
    useState<LocationResult | null>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [vehicleType, setVehicleType] =
    useState("medium_truck");

  const [cargoWeight, setCargoWeight] =
    useState("1200");

  const [routes, setRoutes] = useState<LogisticsRoute[]>([]);

  const [selectedRouteId, setSelectedRouteId] =
    useState<string | null>(null);

  const [searchingFrom, setSearchingFrom] =
    useState(false);

  const [searchingTo, setSearchingTo] =
    useState(false);

  const [calculating, setCalculating] =
    useState(false);

  const [loadingVehicles, setLoadingVehicles] =
    useState(true);

  const [error, setError] = useState("");

  const [routeResponse, setRouteResponse] =
    useState<RouteResponse | null>(null);

  useEffect(() => {
    async function loadVehicles() {
      try {
        setLoadingVehicles(true);

        const response = await fetch(
          `${API_BASE_URL}/api/logistics/vehicles`
        );

        if (!response.ok) {
          throw new Error("Unable to load vehicles.");
        }

        const data = await response.json();

        setVehicles(data.vehicles || []);

        if (
          data.vehicles?.length &&
          !data.vehicles.some(
            (vehicle: Vehicle) => vehicle.type === vehicleType
          )
        ) {
          setVehicleType(data.vehicles[0].type);
        }
      } catch (err) {
        console.error(err);
        setError(
          "Could not load vehicle types. Check that the logistics API is running."
        );
      } finally {
        setLoadingVehicles(false);
      }
    }

    loadVehicles();
  }, []);

  async function searchLocation(
    query: string,
    setResults: (results: LocationResult[]) => void,
    setSearching: (value: boolean) => void
  ) {
    if (query.trim().length < 2) {
      return;
    }

    try {
      setError("");
      setSearching(true);
      setResults([]);

      const response = await fetch(
        `${API_BASE_URL}/api/logistics/locations/search?q=${encodeURIComponent(
          query.trim()
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Location search failed."
        );
      }

      setResults(data.results || []);

      if (!data.results?.length) {
        setError(
          `No locations found for "${query.trim()}".`
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Location search failed."
      );
    } finally {
      setSearching(false);
    }
  }

  function selectOrigin(location: LocationResult) {
    setOrigin(location);
    setFromQuery(location.display_name);
    setFromResults([]);
  }

  function selectDestination(location: LocationResult) {
    setDestination(location);
    setToQuery(location.display_name);
    setToResults([]);
  }

  async function calculateRoutes() {
    setError("");

    if (!origin) {
      setError("Please search and select an origin.");
      return;
    }

    if (!destination) {
      setError("Please search and select a destination.");
      return;
    }

    const weight = Number(cargoWeight);

    if (!Number.isFinite(weight) || weight <= 0) {
      setError("Enter a valid cargo weight.");
      return;
    }

    const selectedVehicle = vehicles.find(
      (vehicle) => vehicle.type === vehicleType
    );

    if (
      selectedVehicle &&
      weight > selectedVehicle.capacity_kg
    ) {
      setError(
        `This vehicle can carry up to ${formatNumber(
          selectedVehicle.capacity_kg,
          0
        )} kg.`
      );
      return;
    }

    try {
      setCalculating(true);
      setRoutes([]);
      setSelectedRouteId(null);
      setRouteResponse(null);

      const response = await fetch(
        `${API_BASE_URL}/api/logistics/routes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origin: {
              latitude: origin.latitude,
              longitude: origin.longitude,
            },
            destination: {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
            cargo_weight_kg: weight,
            vehicle_type: vehicleType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Route calculation failed."
        );
      }

      setRouteResponse(data);
      setRoutes(data.routes || []);

      if (data.routes?.length) {
        setSelectedRouteId(data.routes[0].route_id);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Route calculation failed."
      );
    } finally {
      setCalculating(false);
    }
  }

  const selectedRoute =
    routes.find(
      (route) => route.route_id === selectedRouteId
    ) || null;

  const selectedVehicle =
    vehicles.find(
      (vehicle) => vehicle.type === vehicleType
    ) || null;

  return (
    <main className="min-h-screen bg-slate-50 pt-16 lg:ml-64 lg:pt-0">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Logistics Intelligence
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Freight Route Planner
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Calculate road routes for freight using real
                OpenStreetMap road data, vehicle capacity and
                estimated operating costs.
              </p>
            </div>

            <div className="hidden rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Route Engine
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                OpenStreetMap / OSRM
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Main planner */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* Controls */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900">
                Shipment details
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Define the freight movement and calculate
                available road routes.
              </p>
            </div>

            <div className="space-y-5">
              <LocationField
                label="Origin"
                value={fromQuery}
                placeholder="Search pickup location"
                results={fromResults}
                selected={origin}
                searching={searchingFrom}
                onChange={(value) => {
                  setFromQuery(value);
                  setOrigin(null);
                  setFromResults([]);
                }}
                onSearch={() =>
                  searchLocation(
                    fromQuery,
                    setFromResults,
                    setSearchingFrom
                  )
                }
                onSelect={selectOrigin}
              />

              <LocationField
                label="Destination"
                value={toQuery}
                placeholder="Search delivery location"
                results={toResults}
                selected={destination}
                searching={searchingTo}
                onChange={(value) => {
                  setToQuery(value);
                  setDestination(null);
                  setToResults([]);
                }}
                onSearch={() =>
                  searchLocation(
                    toQuery,
                    setToResults,
                    setSearchingTo
                  )
                }
                onSelect={selectDestination}
              />

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Vehicle type
                </label>

                <select
                  value={vehicleType}
                  onChange={(event) =>
                    setVehicleType(event.target.value)
                  }
                  disabled={loadingVehicles}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50"
                >
                  {vehicles.map((vehicle) => (
                    <option
                      key={vehicle.type}
                      value={vehicle.type}
                    >
                      {vehicle.label} —{" "}
                      {formatNumber(
                        vehicle.capacity_kg,
                        0
                      )}{" "}
                      kg
                    </option>
                  ))}
                </select>

                {selectedVehicle && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-50 p-2.5">
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">
                        Capacity
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-700">
                        {formatNumber(
                          selectedVehicle.capacity_kg,
                          0
                        )}{" "}
                        kg
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-2.5">
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">
                        Efficiency
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-700">
                        {formatNumber(
                          selectedVehicle.fuel_efficiency_kmpl,
                          1
                        )}{" "}
                        km/L
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cargo weight
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={cargoWeight}
                    onChange={(event) =>
                      setCargoWeight(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-14 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="1200"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    kg
                  </span>
                </div>

                {selectedVehicle &&
                  Number(cargoWeight) > 0 && (
                    <div className="mt-2">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400">
                          Capacity utilization
                        </span>

                        <span className="text-[10px] font-bold text-slate-600">
                          {formatNumber(
                            Math.min(
                              (Number(cargoWeight) /
                                selectedVehicle.capacity_kg) *
                                100,
                              100
                            ),
                            0
                          )}
                          %
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{
                            width: `${Math.min(
                              (Number(cargoWeight) /
                                selectedVehicle.capacity_kg) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
              </div>

              <button
                type="button"
                onClick={calculateRoutes}
                disabled={
                  calculating ||
                  !origin ||
                  !destination ||
                  !cargoWeight
                }
                className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {calculating ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Calculating routes...
                  </>
                ) : (
                  "Calculate Freight Routes"
                )}
              </button>

              <p className="text-center text-[10px] leading-4 text-slate-400">
                Location search © OpenStreetMap contributors
              </p>
            </div>
          </section>

          {/* Map */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <LogisticsRouteMap
  origin={origin}
  destination={destination}
  routes={routes}
  selectedRouteId={selectedRouteId}
/>
          </section>
        </div>

        {/* Results */}
        {routeResponse && routes.length > 0 && (
          <section className="mt-5 space-y-5">
            {/* Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                    Route analysis complete
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {routeResponse.vehicle.label}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatNumber(
                      routeResponse.cargo.weight_kg,
                      0
                    )}{" "}
                    kg cargo ·{" "}
                    {formatNumber(
                      routeResponse.cargo.utilization_percent,
                      0
                    )}
                    % capacity utilization
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Routes
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {routes.length}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Capacity
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {formatNumber(
                        routeResponse.cargo.utilization_percent,
                        0
                      )}
                      %
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Source
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-900">
                      OSRM
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Cost model
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-900">
                      Operating
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Route cards */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Available routes
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Select a route to highlight it on the map.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {routes.map((route, index) => {
                  const selected =
                    route.route_id === selectedRouteId;

                  return (
                    <button
                      key={route.route_id}
                      type="button"
                      onClick={() =>
                        setSelectedRouteId(route.route_id)
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-emerald-300 bg-emerald-50/60 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                                selected
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {index + 1}
                            </span>

                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                Route{" "}
                                {route.alternative_number}
                              </p>

                              <p className="text-[10px] text-slate-400">
                                {selected
                                  ? "Selected"
                                  : "Alternative"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">
                            {formatCurrency(
                              route.estimated_cost
                                .estimated_total_inr
                            )}
                          </p>

                          <p className="text-[10px] text-slate-400">
                            estimated operating cost
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-white/80 p-2.5">
                          <p className="text-[9px] uppercase tracking-wider text-slate-400">
                            Distance
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-700">
                            {formatNumber(
                              route.distance_km,
                              1
                            )}{" "}
                            km
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/80 p-2.5">
                          <p className="text-[9px] uppercase tracking-wider text-slate-400">
                            Time
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-700">
                            {route.duration_text}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/80 p-2.5">
                          <p className="text-[9px] uppercase tracking-wider text-slate-400">
                            Fuel
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-700">
                            {formatNumber(
                              route.estimated_cost
                                .fuel_litres,
                              1
                            )}{" "}
                            L
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-3">
                        <span className="text-[10px] text-slate-400">
                          Fuel ₹
                          {formatNumber(
                            route.estimated_cost
                              .fuel_cost_inr,
                            0
                          )}
                        </span>

                        <span className="text-[10px] text-slate-400">
                          Driver ₹
                          {formatNumber(
                            route.estimated_cost
                              .driver_cost_inr,
                            0
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected route */}
            {selectedRoute && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                      Selected route
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-emerald-950">
                      Route{" "}
                      {selectedRoute.alternative_number}
                    </h3>

                    <p className="mt-1 text-xs text-emerald-700">
                      {selectedRoute.distance_km.toFixed(1)} km
                      {" · "}
                      {selectedRoute.duration_text}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl bg-white/80 px-4 py-3">
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">
                        Total
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formatCurrency(
                          selectedRoute.estimated_cost
                            .estimated_total_inr
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/80 px-4 py-3">
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">
                        Fuel
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formatCurrency(
                          selectedRoute.estimated_cost
                            .fuel_cost_inr
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/80 px-4 py-3">
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">
                        Driver
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formatCurrency(
                          selectedRoute.estimated_cost
                            .driver_cost_inr
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/80 px-4 py-3">
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">
                        Fuel used
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formatNumber(
                          selectedRoute.estimated_cost
                            .fuel_litres,
                          1
                        )}{" "}
                        L
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-center text-[10px] leading-5 text-slate-400">
              Routes are calculated using OpenStreetMap road
              data through OSRM. Operating costs are estimates
              based on the selected vehicle's fuel and driver
              parameters.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}