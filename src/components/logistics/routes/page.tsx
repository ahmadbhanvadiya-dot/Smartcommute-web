"use client";

import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

export default function LogisticsRoutesPage() {
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");

  const [fromResults, setFromResults] = useState<LocationResult[]>([]);
  const [toResults, setToResults] = useState<LocationResult[]>([]);

  const [fromLocation, setFromLocation] =
    useState<LocationResult | null>(null);

  const [toLocation, setToLocation] =
    useState<LocationResult | null>(null);

  const [cargoWeight, setCargoWeight] = useState("1200");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleType, setVehicleType] = useState("medium_truck");

  const [searchingFrom, setSearchingFrom] = useState(false);
  const [searchingTo, setSearchingTo] = useState(false);

  const searchLocations = async (
    query: string,
    setter: (results: LocationResult[]) => void,
    setLoading: (value: boolean) => void
  ) => {
    if (query.trim().length < 2) {
      setter([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/logistics/locations/search?q=${encodeURIComponent(
          query.trim()
        )}`
      );

      if (!response.ok) {
        throw new Error("Location search failed");
      }

      const data = await response.json();

      setter(data.results || []);
    } catch (error) {
      console.error("Location search error:", error);
      setter([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/logistics/vehicles`
      );

      if (!response.ok) {
        throw new Error("Vehicle request failed");
      }

      const data = await response.json();

      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error("Vehicle loading error:", error);
    }
  };

  useState(() => {
    loadVehicles();
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Logistics Platform
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Freight Route Planner
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Plan road freight routes using real road-network data,
            vehicle capacity and estimated operating costs.
          </p>
        </div>

        {/* Planner */}
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">

          {/* Left panel */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="mb-6 text-lg font-bold text-slate-900">
              Shipment Details
            </h2>

            {/* From */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                From
              </label>

              <input
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  setFromLocation(null);

                  searchLocations(
                    e.target.value,
                    setFromResults,
                    setSearchingFrom
                  );
                }}
                placeholder="Search any starting location..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              {searchingFrom && (
                <p className="mt-2 text-xs text-slate-400">
                  Searching locations...
                </p>
              )}

              {fromResults.length > 0 && !fromLocation && (
                <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {fromResults.map((location, index) => (
                    <button
                      key={`${location.latitude}-${location.longitude}-${index}`}
                      type="button"
                      onClick={() => {
                        setFromLocation(location);
                        setFromQuery(location.display_name);
                        setFromResults([]);
                      }}
                      className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-800">
                        {location.display_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {location.latitude.toFixed(5)},{" "}
                        {location.longitude.toFixed(5)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* To */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Destination
              </label>

              <input
                value={toQuery}
                onChange={(e) => {
                  setToQuery(e.target.value);
                  setToLocation(null);

                  searchLocations(
                    e.target.value,
                    setToResults,
                    setSearchingTo
                  );
                }}
                placeholder="Search any destination..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              {searchingTo && (
                <p className="mt-2 text-xs text-slate-400">
                  Searching locations...
                </p>
              )}

              {toResults.length > 0 && !toLocation && (
                <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {toResults.map((location, index) => (
                    <button
                      key={`${location.latitude}-${location.longitude}-${index}`}
                      type="button"
                      onClick={() => {
                        setToLocation(location);
                        setToQuery(location.display_name);
                        setToResults([]);
                      }}
                      className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-800">
                        {location.display_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {location.latitude.toFixed(5)},{" "}
                        {location.longitude.toFixed(5)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cargo */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Cargo Weight
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  kg
                </span>
              </div>
            </div>

            {/* Vehicle */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Vehicle
              </label>

              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle.type} value={vehicle.type}>
                    {vehicle.label} — {vehicle.capacity_kg.toLocaleString()} kg
                  </option>
                ))}
              </select>
            </div>

            {/* Find Routes */}
            <button
              type="button"
              onClick={() => {
                console.log("FROM:", fromLocation);
                console.log("TO:", toLocation);
                console.log("CARGO:", cargoWeight);
                console.log("VEHICLE:", vehicleType);
              }}
              className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Find Freight Routes
            </button>

            <p className="mt-4 text-center text-xs text-slate-400">
              Powered by OpenStreetMap road data and OSRM
            </p>
          </section>

          {/* Right panel */}
          <section className="flex min-h-[600px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl">
                🗺️
              </div>

              <h2 className="text-lg font-bold text-slate-800">
                Route Map
              </h2>

              <p className="mt-2 max-w-sm text-sm text-slate-400">
                Select a starting location and destination to calculate
                real road routes.
              </p>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}