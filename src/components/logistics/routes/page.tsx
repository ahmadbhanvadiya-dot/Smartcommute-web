"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MapPin,
  Navigation,
  Package,
  Search,
  Truck,
  Route as RouteIcon,
  Fuel,
  IndianRupee,
  AlertCircle,
} from "lucide-react";

const LogisticsRouteMap = dynamic(
  () => import("@/components/logistics/LogisticsRouteMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[620px] items-center justify-center rounded-2xl bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
          <p className="text-sm font-semibold text-slate-700">
            Loading route map...
          </p>
        </div>
      </div>
    ),
  }
);

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

interface LocationResult {
  display_name: string;
  latitude: number;
  longitude: number;
  type: string | null;
}

interface Vehicle {
  type: string;
  label: string;
  capacity_kg: number;
  fuel_efficiency_kmpl: number;
  fuel_price_inr_per_litre: number;
  driver_cost_per_hour: number;
}

interface LogisticsRoute {
  route_id: string;
  alternative_number: number;
  distance_km: number;
  duration_minutes: number;
  duration_text: string;
  estimated_cost: {
    fuel_litres: number;
    fuel_cost_inr: number;
    driver_cost_inr: number;
    estimated_total_inr: number;
  };
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  capacity_utilization_percent: number;
  vehicle_suitable: boolean;
  rank: number;
  recommendation: string;
}

interface RouteResponse {
  valid: boolean;
  message?: string;
  vehicle?: Vehicle & {
    type: string;
  };
  cargo?: {
    weight_kg: number;
    capacity_kg: number;
    utilization_percent: number;
  };
  route_source?: string;
  cost_method?: string;
  routes: LogisticsRoute[];
}

export default function LogisticsRoutesPage() {
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");

  const [fromResults, setFromResults] =
    useState<LocationResult[]>([]);
  const [toResults, setToResults] =
    useState<LocationResult[]>([]);

  const [origin, setOrigin] =
    useState<LocationResult | null>(null);

  const [destination, setDestination] =
    useState<LocationResult | null>(null);

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [vehicleType, setVehicleType] =
    useState("medium_truck");

  const [cargoWeight, setCargoWeight] =
    useState("1200");

  const [routes, setRoutes] =
    useState<LogisticsRoute[]>([]);

  const [selectedRouteId, setSelectedRouteId] =
    useState<string | null>(null);

  const [searchingFrom, setSearchingFrom] =
    useState(false);

  const [searchingTo, setSearchingTo] =
    useState(false);

  const [loadingRoutes, setLoadingRoutes] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [routeResponse, setRouteResponse] =
    useState<RouteResponse | null>(null);

  useEffect(() => {
    async function loadVehicles() {
      try {
        const response = await fetch(
          `${API_URL}/api/logistics/vehicles`
        );

        if (!response.ok) {
          throw new Error("Unable to load vehicles.");
        }

        const data = await response.json();

        setVehicles(data.vehicles || []);
      } catch (err) {
        console.error(err);
      }
    }

    loadVehicles();
  }, []);

  async function searchLocation(
    query: string,
    side: "from" | "to"
  ) {
    if (query.trim().length < 2) {
      if (side === "from") {
        setFromResults([]);
      } else {
        setToResults([]);
      }

      return;
    }

    if (side === "from") {
      setSearchingFrom(true);
    } else {
      setSearchingTo(true);
    }

    try {
      const response = await fetch(
        `${API_URL}/api/logistics/locations/search?q=${encodeURIComponent(
          query.trim()
        )}`
      );

      if (!response.ok) {
        throw new Error("Location search failed.");
      }

      const data = await response.json();

      if (side === "from") {
        setFromResults(data.results || []);
      } else {
        setToResults(data.results || []);
      }
    } catch (err) {
      console.error(err);

      if (side === "from") {
        setFromResults([]);
      } else {
        setToResults([]);
      }
    } finally {
      if (side === "from") {
        setSearchingFrom(false);
      } else {
        setSearchingTo(false);
      }
    }
  }

  async function calculateRoutes() {
    setError(null);
    setRoutes([]);
    setRouteResponse(null);
    setSelectedRouteId(null);

    if (!origin) {
      setError("Please select a starting location.");
      return;
    }

    if (!destination) {
      setError("Please select a destination.");
      return;
    }

    const weight = Number(cargoWeight);

    if (!Number.isFinite(weight) || weight <= 0) {
      setError("Enter a valid cargo weight.");
      return;
    }

    setLoadingRoutes(true);

    try {
      const response = await fetch(
        `${API_URL}/api/logistics/routes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
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

      const data: RouteResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Route calculation failed."
        );
      }

      setRouteResponse(data);

      if (!data.valid) {
        setError(
          data.message ||
            "No suitable route could be calculated."
        );
        return;
      }

      setRoutes(data.routes || []);

      if (data.routes?.length) {
        setSelectedRouteId(data.routes[0].route_id);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to calculate routes."
      );
    } finally {
      setLoadingRoutes(false);
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
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <div className="min-h-screen px-4 py-6 lg:ml-64 lg:px-8">
        <div className="mx-auto max-w-[1500px]">

          {/* Header */}
          <header className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span>Logistics</span>
                <span>/</span>
                <span className="text-emerald-600">
                  Freight Routes
                </span>
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Freight Route Planner
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Plan freight movement using real road-network data,
                vehicle capacity and operating-cost estimates.
              </p>
            </div>

            <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Truck size={18} />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-900">
                  Route Optimizer
                </p>
                <p className="text-[10px] text-emerald-600">
                  Online
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">

            {/* Planner */}
            <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <RouteIcon size={19} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Shipment Details
                  </h2>

                  <p className="text-xs text-slate-400">
                    Enter your freight requirements
                  </p>
                </div>
              </div>

              {/* FROM */}
              <LocationField
                label="From"
                icon={<MapPin size={16} />}
                value={fromQuery}
                loading={searchingFrom}
                results={fromResults}
                placeholder="Search any starting location"
                onChange={(value) => {
                  setFromQuery(value);
                  setOrigin(null);
                }}
                onSearch={() =>
                  searchLocation(fromQuery, "from")
                }
                onSelect={(location) => {
                  setOrigin(location);
                  setFromQuery(location.display_name);
                  setFromResults([]);
                }}
              />

              {/* Arrow */}
              <div className="relative my-1 ml-5 h-6 border-l border-dashed border-slate-300">
                <div className="absolute -left-[4px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-slate-300" />
              </div>

              {/* TO */}
              <LocationField
                label="Destination"
                icon={<Navigation size={16} />}
                value={toQuery}
                loading={searchingTo}
                results={toResults}
                placeholder="Search any destination"
                onChange={(value) => {
                  setToQuery(value);
                  setDestination(null);
                }}
                onSearch={() =>
                  searchLocation(toQuery, "to")
                }
                onSelect={(location) => {
                  setDestination(location);
                  setToQuery(location.display_name);
                  setToResults([]);
                }}
              />

              <div className="my-6 border-t border-slate-100" />

              {/* Cargo */}
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Cargo Weight
              </label>

              <div className="relative mb-5">
                <Package
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="number"
                  min="1"
                  value={cargoWeight}
                  onChange={(e) =>
                    setCargoWeight(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-14 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  kg
                </span>
              </div>

              {/* Vehicle */}
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Vehicle
              </label>

              <div className="relative mb-5">
                <Truck
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={vehicleType}
                  onChange={(e) =>
                    setVehicleType(e.target.value)
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                >
                  {vehicles.length === 0 && (
                    <option value="medium_truck">
                      Loading vehicles...
                    </option>
                  )}

                  {vehicles.map((vehicle) => (
                    <option
                      key={vehicle.type}
                      value={vehicle.type}
                    >
                      {vehicle.label} —{" "}
                      {vehicle.capacity_kg.toLocaleString(
                        "en-IN"
                      )}{" "}
                      kg
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {/* Vehicle capacity */}
              {selectedVehicle && (
                <div className="mb-5 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Vehicle capacity
                    </span>

                    <span className="font-bold text-slate-800">
                      {selectedVehicle.capacity_kg.toLocaleString(
                        "en-IN"
                      )}{" "}
                      kg
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(cargoWeight) /
                            selectedVehicle.capacity_kg) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-4 flex gap-3 rounded-xl border border-red-100 bg-red-50 p-3">
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0 text-red-500"
                  />

                  <p className="text-xs font-medium leading-5 text-red-700">
                    {error}
                  </p>
                </div>
              )}

              {/* Calculate */}
              <button
                type="button"
                disabled={loadingRoutes}
                onClick={calculateRoutes}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingRoutes ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Calculating routes...
                  </>
                ) : (
                  <>
                    <Search size={17} />
                    Find Freight Routes
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[10px] leading-4 text-slate-400">
                Road geometry: OpenStreetMap / OSRM
                <br />
                Operating cost is an estimate based on vehicle assumptions.
              </p>
            </section>

            {/* RIGHT */}
            <div className="space-y-5">

              {/* Map */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <LogisticsRouteMap
                  origin={origin}
                  destination={destination}
                  routes={routes}
                  selectedRouteId={selectedRouteId}
                />
              </section>

              {/* Results */}
              {routes.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Available Routes
                      </h2>

                      <p className="text-xs text-slate-400">
                        {routes.length} road route
                        {routes.length === 1 ? "" : "s"} found
                      </p>
                    </div>

                    {routeResponse?.route_source && (
                      <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-500 sm:block">
                        {routeResponse.route_source}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3">
                    {routes.map((route) => {
                      const selected =
                        route.route_id === selectedRouteId;

                      return (
                        <button
                          key={route.route_id}
                          type="button"
                          onClick={() =>
                            setSelectedRouteId(
                              route.route_id
                            )
                          }
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-emerald-400 bg-emerald-50/50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                  selected
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                <RouteIcon size={18} />
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold text-slate-900">
                                    Route {route.alternative_number}
                                  </p>

                                  {route.rank === 1 && (
                                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                                      Recommended
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-xs text-slate-400">
                                  {route.recommendation}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-5 md:min-w-[430px]">
                              <Metric
                                icon={<RouteIcon size={14} />}
                                label="Distance"
                                value={`${route.distance_km} km`}
                              />

                              <Metric
                                icon={<Clock3 size={14} />}
                                label="Duration"
                                value={route.duration_text}
                              />

                              <Metric
                                icon={<IndianRupee size={14} />}
                                label="Est. Cost"
                                value={`₹${route.estimated_cost.estimated_total_inr.toLocaleString(
                                  "en-IN",
                                  {
                                    maximumFractionDigits: 0,
                                  }
                                )}`}
                              />
                            </div>

                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200/70 pt-3 md:grid-cols-4">

                            <SmallMetric
                              icon={<Fuel size={14} />}
                              label="Fuel"
                              value={`${route.estimated_cost.fuel_litres} L`}
                            />

                            <SmallMetric
                              icon={<IndianRupee size={14} />}
                              label="Fuel cost"
                              value={`₹${route.estimated_cost.fuel_cost_inr.toLocaleString(
                                "en-IN",
                                {
                                  maximumFractionDigits: 0,
                                }
                              )}`}
                            />

                            <SmallMetric
                              icon={<Clock3 size={14} />}
                              label="Driver"
                              value={`₹${route.estimated_cost.driver_cost_inr.toLocaleString(
                                "en-IN",
                                {
                                  maximumFractionDigits: 0,
                                }
                              )}`}
                            />

                            <SmallMetric
                              icon={<Package size={14} />}
                              label="Capacity"
                              value={`${route.capacity_utilization_percent}%`}
                            />

                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Selected route summary */}
              {selectedRoute && routeResponse?.cargo && (
                <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          size={18}
                          className="text-emerald-600"
                        />

                        <h3 className="font-bold text-slate-900">
                          Route {selectedRoute.alternative_number} selected
                        </h3>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {selectedRoute.distance_km} km •{" "}
                        {selectedRoute.duration_text} •{" "}
                        {selectedVehicle?.label}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-xs text-slate-400">
                        Estimated operating cost
                      </p>

                      <p className="text-2xl font-black text-slate-950">
                        ₹
                        {selectedRoute.estimated_cost.estimated_total_inr.toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 0,
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        Cargo utilization
                      </span>

                      <span className="text-xs font-black text-slate-900">
                        {routeResponse.cargo.utilization_percent}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.min(
                            100,
                            routeResponse.cargo
                              .utilization_percent
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                      <span>
                        {routeResponse.cargo.weight_kg.toLocaleString(
                          "en-IN"
                        )}{" "}
                        kg cargo
                      </span>

                      <span>
                        {routeResponse.cargo.capacity_kg.toLocaleString(
                          "en-IN"
                        )}{" "}
                        kg capacity
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {/* Initial state */}
              {routes.length === 0 && !loadingRoutes && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Truck size={22} />
                  </div>

                  <h3 className="mt-4 font-bold text-slate-800">
                    Ready to plan your shipment
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">
                    Search for any origin and destination,
                    select a suitable vehicle, enter the cargo
                    weight and calculate real road routes.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function LocationField({
  label,
  icon,
  value,
  loading,
  results,
  placeholder,
  onChange,
  onSearch,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  loading: boolean;
  results: LocationResult[];
  placeholder: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onSelect: (location: LocationResult) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
          {icon}
        </div>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch();
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-12 text-sm font-medium outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
        />

        <button
          type="button"
          onClick={onSearch}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
          aria-label={`Search ${label}`}
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
          ) : (
            <Search size={16} />
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="relative z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {results.map((location, index) => (
            <button
              key={`${location.latitude}-${location.longitude}-${index}`}
              type="button"
              onClick={() => onSelect(location)}
              className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-emerald-50"
            >
              <div className="flex gap-3">
                <MapPin
                  size={15}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-5 text-slate-800">
                    {location.display_name}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {location.type || "location"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </div>

      <p className="mt-1 text-sm font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

function SmallMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-slate-400">{icon}</div>

      <div>
        <p className="text-[9px] uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="text-xs font-bold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}