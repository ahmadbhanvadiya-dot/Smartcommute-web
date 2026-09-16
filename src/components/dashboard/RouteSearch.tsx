"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  MapPin,
  Navigation,
  Search,
  LocateFixed,
} from "lucide-react";

interface RouteSearchProps {
  onSearch?: (from: string, to: string) => void;

  onUseCurrentLocation?: () => void;

  locationLoading?: boolean;
}

export default function RouteSearch({
  onSearch,
  onUseCurrentLocation,
  locationLoading = false,
}: RouteSearchProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const swapLocations = () => {
    setFrom(to);
    setTo(from);
  };

  const handleSearch = () => {
    if (!from.trim() || !to.trim()) {
      return;
    }

    onSearch?.(
      from.trim(),
      to.trim()
    );
  };

  const handleCurrentLocation = () => {
    setFrom("Current Location");
    onUseCurrentLocation?.();
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/10">

      {/* HEADER */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Smart Route Planner
        </p>

        <h2 className="mt-1 text-xl font-bold">
          Where are you going?
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Find the best available public transport route.
        </p>
      </div>

      {/* ROUTE INPUTS */}
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-center">

        {/* FROM */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">

          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            From
          </label>

          <div className="flex items-center gap-2">

            <MapPin
              size={17}
              className="shrink-0 text-blue-400"
            />

            <input
              value={from}
              onChange={(e) =>
                setFrom(e.target.value)
              }
              className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-500"
              placeholder="Starting location"
            />

          </div>

          {/* CURRENT LOCATION */}
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={locationLoading}
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-blue-400 transition hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LocateFixed size={14} />

            {locationLoading
              ? "Finding your location..."
              : "Use my current location"}
          </button>

        </div>

        {/* SWAP */}
        <button
          onClick={swapLocations}
          type="button"
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
          title="Swap locations"
        >
          <ArrowUpDown size={17} />
        </button>

        {/* DESTINATION */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">

          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Destination
          </label>

          <div className="flex items-center gap-2">

            <Navigation
              size={17}
              className="shrink-0 text-emerald-400"
            />

            <input
              value={to}
              onChange={(e) =>
                setTo(e.target.value)
              }
              className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-500"
              placeholder="Where do you want to go?"
            />

          </div>

        </div>

        {/* SEARCH */}
        <button
          type="button"
          onClick={handleSearch}
          disabled={
            !from.trim() ||
            !to.trim()
          }
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >

          <Search size={17} />

          Find Route

        </button>

      </div>

      {/* FEATURES */}
      <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-400">

        <span>
          ✓ GTFS route data
        </span>

        <span>
          ✓ Route optimization
        </span>

        <span>
          ✓ Live transport
        </span>

        <span>
          ✓ Smart ETA
        </span>

      </div>

    </div>
  );
}