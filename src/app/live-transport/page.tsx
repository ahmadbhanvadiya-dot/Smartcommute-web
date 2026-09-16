"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import {
  AlertTriangle,
  BusFront,
  CheckCircle2,
  Clock3,
  MapPin,
  Radio,
  RefreshCw,
  Users,
} from "lucide-react";

import Header from "@/components/dashboard/Header";

const LiveTransportMap = dynamic(
  () =>
    import(
      "@/components/dashboard/LiveTransportMap"
    ),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[620px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-100">

        <div className="text-center">

          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />

          <p className="text-sm font-bold text-slate-700">
            Loading fleet map...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Connecting to transport tracking
          </p>

        </div>

      </div>
    ),
  }
);

interface BusInfo {
  id: string;
  route: string;
  name: string;
  eta: number;
  crowd: "Low" | "Moderate" | "High";
  delay: number;
  status: "On Time" | "Delayed";
}

const initialBuses: BusInfo[] = [
  {
    id: "bus-216",
    route: "216",
    name: "Mehdipatnam → Himayath Sagar",
    eta: 7,
    crowd: "Moderate",
    delay: 0,
    status: "On Time",
  },
  {
    id: "bus-5k",
    route: "5K",
    name: "Mehdipatnam → TSPA",
    eta: 12,
    crowd: "Low",
    delay: 3,
    status: "Delayed",
  },
  {
    id: "bus-102",
    route: "102",
    name: "Mehdipatnam → Gachibowli",
    eta: 16,
    crowd: "High",
    delay: 5,
    status: "Delayed",
  },
  {
    id: "bus-8a",
    route: "8A",
    name: "Mehdipatnam → Lakdikapul",
    eta: 4,
    crowd: "Low",
    delay: 0,
    status: "On Time",
  },
];

function CrowdBadge({
  crowd,
}: {
  crowd: BusInfo["crowd"];
}) {
  const styles = {
    Low: "bg-emerald-50 text-emerald-700",
    Moderate:
      "bg-amber-50 text-amber-700",
    High: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${styles[crowd]}`}
    >
      {crowd}
    </span>
  );
}

export default function LiveTransportPage() {
  const [selectedBus, setSelectedBus] =
    useState<string | null>("bus-216");

  const [buses, setBuses] =
    useState(initialBuses);

  const [lastUpdated, setLastUpdated] =
    useState("Just now");

  const refreshData = () => {
    setBuses((current) =>
      current.map((bus) => ({
        ...bus,
        eta: Math.max(
          2,
          bus.eta +
            (Math.random() > 0.5
              ? 1
              : -1)
        ),
      }))
    );

    setLastUpdated("Just now");
  };

  const activeCount = buses.length;

  const onTimeCount = buses.filter(
    (bus) => bus.delay === 0
  ).length;

  const delayedCount =
    buses.length - onTimeCount;

  return (
    <div className="min-h-screen bg-slate-50">

      <Header />

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">

        <div className="mx-auto max-w-7xl">

          {/* ================================================= */}
          {/* PAGE HEADER */}
          {/* ================================================= */}

          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <p className="text-sm font-semibold text-blue-600">
                  SmartCommute AI
                </p>

                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-600">

                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />

                  Live

                </span>

              </div>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Live Transport
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Monitor active buses, estimated arrival
                times, crowd levels and transport
                movement on the Hyderabad network.
              </p>

            </div>

            <button
              type="button"
              onClick={refreshData}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >

              <RefreshCw size={15} />

              Refresh tracking

            </button>

          </div>

          {/* ================================================= */}
          {/* STATS */}
          {/* ================================================= */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Buses
                  </p>

                  <p className="mt-1 text-2xl font-black text-slate-900">
                    {activeCount}
                  </p>

                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BusFront size={20} />
                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    On Time
                  </p>

                  <p className="mt-1 text-2xl font-black text-slate-900">
                    {onTimeCount}
                  </p>

                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Delayed
                  </p>

                  <p className="mt-1 text-2xl font-black text-slate-900">
                    {delayedCount}
                  </p>

                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle size={20} />
                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tracking
                  </p>

                  <p className="mt-1 text-2xl font-black text-emerald-600">
                    LIVE
                  </p>

                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Radio size={20} />
                </div>

              </div>

            </div>

          </div>

          {/* ================================================= */}
          {/* MAP + SELECTED BUS */}
          {/* ================================================= */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">

            <section>

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Fleet Map
                  </h2>

                  <p className="text-sm text-slate-500">
                    Vehicle positions update continuously
                    in the tracking simulation.
                  </p>

                </div>

                <div className="hidden items-center gap-2 text-[10px] text-slate-400 sm:flex">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

                  Updated {lastUpdated}

                </div>

              </div>

              <LiveTransportMap
                selectedBus={selectedBus}
                onSelectBus={setSelectedBus}
              />

            </section>

            {/* SELECTED BUS */}

            <section>

              <div className="mb-4">

                <h2 className="text-lg font-bold text-slate-900">
                  Selected Vehicle
                </h2>

                <p className="text-sm text-slate-500">
                  Select a bus marker or vehicle below.
                </p>

              </div>

              {(() => {
                const selected =
                  buses.find(
                    (bus) =>
                      bus.id === selectedBus
                  ) ?? buses[0];

                return (
                  <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">

                    <div className="flex items-start justify-between">

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <BusFront size={22} />
                        </div>

                        <div>

                          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            Bus {selected.route}
                          </p>

                          <h3 className="mt-1 text-sm font-bold text-slate-900">
                            {selected.name}
                          </h3>

                        </div>

                      </div>

                      {selected.status ===
                      "On Time" ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
                          On Time
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
                          +{selected.delay} min
                        </span>
                      )}

                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div className="rounded-xl bg-slate-50 p-4">

                        <Clock3
                          size={16}
                          className="text-blue-600"
                        />

                        <p className="mt-2 text-[10px] font-semibold uppercase text-slate-400">
                          Next Arrival
                        </p>

                        <p className="mt-1 text-xl font-black text-slate-900">
                          {selected.eta}
                          <span className="ml-1 text-xs font-medium text-slate-400">
                            min
                          </span>
                        </p>

                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">

                        <Users
                          size={16}
                          className="text-purple-600"
                        />

                        <p className="mt-2 text-[10px] font-semibold uppercase text-slate-400">
                          Crowd
                        </p>

                        <div className="mt-2">
                          <CrowdBadge
                            crowd={
                              selected.crowd
                            }
                          />
                        </div>

                      </div>

                    </div>

                    <div className="mt-4 rounded-xl border border-slate-100 p-4">

                      <div className="flex items-center gap-2">

                        <MapPin
                          size={15}
                          className="text-blue-600"
                        />

                        <p className="text-xs font-bold text-slate-800">
                          GPS Tracking Active
                        </p>

                      </div>

                      <p className="mt-1 text-[10px] leading-5 text-slate-400">
                        Vehicle position is being
                        refreshed continuously on the
                        fleet map.
                      </p>

                    </div>

                  </div>
                );
              })()}

            </section>

          </div>

          {/* ================================================= */}
          {/* BUS LIST */}
          {/* ================================================= */}

          <section className="mt-8">

            <div className="mb-4">

              <h2 className="text-lg font-bold text-slate-900">
                Active Vehicles
              </h2>

              <p className="text-sm text-slate-500">
                Select a vehicle to highlight it on the
                map.
              </p>

            </div>

            <div className="grid gap-3 md:grid-cols-2">

              {buses.map((bus) => (

                <button
                  key={bus.id}
                  type="button"
                  onClick={() =>
                    setSelectedBus(
                      bus.id
                    )
                  }
                  className={`w-full rounded-2xl border bg-white p-4 text-left transition ${
                    selectedBus === bus.id
                      ? "border-blue-500 ring-2 ring-blue-100"
                      : "border-slate-200 hover:border-blue-200"
                  }`}
                >

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <BusFront size={19} />
                      </div>

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                          Route {bus.route}
                        </p>

                        <p className="mt-0.5 text-xs font-bold text-slate-900">
                          {bus.name}
                        </p>

                      </div>

                    </div>

                    {bus.status ===
                    "On Time" ? (
                      <CheckCircle2
                        size={17}
                        className="text-emerald-500"
                      />
                    ) : (
                      <AlertTriangle
                        size={17}
                        className="text-amber-500"
                      />
                    )}

                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">

                    <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-bold text-slate-600">
                      <Clock3
                        size={10}
                        className="mr-1 inline"
                      />
                      {bus.eta} min
                    </span>

                    <CrowdBadge
                      crowd={bus.crowd}
                    />

                    {bus.delay > 0 && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
                        +{bus.delay} min
                      </span>
                    )}

                  </div>

                </button>

              ))}

            </div>

          </section>

          {/* ================================================= */}
          {/* DATA NOTE */}
          {/* ================================================= */}

          <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Radio size={18} />
              </div>

              <div>

                <p className="text-sm font-bold text-blue-900">
                  SmartCommute Fleet Intelligence
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-800/70">
                  The current prototype demonstrates
                  the live fleet-tracking interface using
                  simulated vehicle movement. The tracking
                  layer is designed so an authorized
                  real-time transit feed can replace the
                  simulation without changing the UI.
                </p>

              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}