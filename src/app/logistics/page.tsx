"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Map,
  Package,
  Route,
  Truck,
  Warehouse,
  Zap,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

interface Vehicle {
  type: string;
  capacity_kg: number;
  fuel_efficiency_kmpl: number;
  fuel_price_inr_per_litre: number;
  driver_cost_inr_per_hour: number;
}

function vehicleName(type: string) {
  return type
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

export default function LogisticsDashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVehicles() {
      try {
        const response = await fetch(
          `${API_URL}/api/logistics/vehicles`
        );

        if (!response.ok) {
          throw new Error("Failed to load vehicles");
        }

        const data = await response.json();

        setVehicles(data.vehicles || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadVehicles();
  }, []);

  const totalCapacity = vehicles.reduce(
    (sum, vehicle) => sum + vehicle.capacity_kg,
    0
  );

  return (
    <main className="min-h-screen bg-slate-50 pt-16 lg:ml-64 lg:pt-0">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>Logistics</span>
              <span>/</span>
              <span className="text-emerald-600">
                Dashboard
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Logistics Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor freight planning, vehicles and route
              optimization from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* Back to onboarding */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Start
            </Link>

            {/* Route Optimizer status */}
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <Zap className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  Route Optimizer
                </p>

                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Online
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">

          <Link
            href="/logistics/routes"
            className="group rounded-2xl bg-emerald-600 p-5 text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Route className="h-6 w-6" />
              </div>

              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </div>

            <h2 className="mt-5 text-lg font-bold">
              Plan Freight Route
            </h2>

            <p className="mt-1 text-sm text-emerald-50">
              Compare road routes, travel time and estimated
              operating costs.
            </p>
          </Link>

          <Link
            href="/logistics/shipments"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Package className="h-6 w-6" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Manage Shipments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create, monitor and manage freight shipments.
            </p>
          </Link>

          <Link
            href="/logistics/fleet"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Truck className="h-6 w-6" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Fleet Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View vehicle capacity and operating profiles.
            </p>
          </Link>
        </div>

        {/* System overview */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Route optimizer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Route Optimization
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current routing capabilities
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Map className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />

                  <span className="font-semibold text-slate-800">
                    Road Network Routing
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Routes are generated using real road-network
                  geometry.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />

                  <span className="font-semibold text-slate-800">
                    Cost Estimation
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Fuel and driver operating costs are estimated
                  for each route.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />

                  <span className="font-semibold text-slate-800">
                    Alternative Routes
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Available road alternatives can be compared
                  before selecting a route.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />

                  <span className="font-semibold text-slate-800">
                    Vehicle Constraints
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Cargo weight is checked against the selected
                  vehicle capacity.
                </p>
              </div>

            </div>
          </div>

          {/* System status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  System Status
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Logistics services
                </p>
              </div>

              <div className="h-3 w-3 rounded-full bg-emerald-500" />
            </div>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  Route Optimizer
                </span>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  Location Search
                </span>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  Road Routing
                </span>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Online
                </span>
              </div>

            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Data Sources
              </p>

              <p className="mt-2 text-sm font-medium text-slate-700">
                OpenStreetMap
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Road-network and location data
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle capabilities */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Vehicle Profiles
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Vehicle configurations currently supported by
                the route optimizer.
              </p>
            </div>

            <Link
              href="/logistics/vehicles"
              className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View Vehicles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.type}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                        <Truck className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {vehicleName(vehicle.type)}
                        </p>

                        <p className="text-xs text-slate-500">
                          {vehicle.capacity_kg.toLocaleString(
                            "en-IN"
                          )}{" "}
                          kg capacity
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Efficiency
                      </span>

                      <span className="font-semibold text-slate-700">
                        {vehicle.fuel_efficiency_kmpl} km/L
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {vehicles.length > 0 && (
                <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                  <Warehouse className="h-4 w-4" />

                  <span>
                    {vehicles.length} vehicle profiles
                    available ·{" "}
                    {totalCapacity.toLocaleString(
                      "en-IN"
                    )}{" "}
                    kg combined configured capacity
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom modules */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">

          <Link
            href="/logistics/delivery-planning"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <BarChart3 className="h-6 w-6" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              Delivery Planning
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Build delivery plans and coordinate freight
              movement.
            </p>
          </Link>

          <Link
            href="/logistics/analytics"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <BarChart3 className="h-6 w-6" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              Logistics Analytics
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Analyze route costs, fuel usage and logistics
              performance.
            </p>
          </Link>

        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Truck className="h-4 w-4" />
          SmartCommute AI Logistics Intelligence
        </div>

      </div>
    </main>
  );
}