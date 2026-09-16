"use client";

import { useState } from "react";
import {
  ArrowRight,
  Loader2,
  MapPin,
  Search,
  X,
} from "lucide-react";

interface RouteSearchProps {
  onSearch: (from: string, to: string) => void;
}

export default function RouteSearch({
  onSearch,
}: RouteSearchProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    if (!cleanFrom || !cleanTo) {
      return;
    }

    setLoading(true);

    try {
      await onSearch(cleanFrom, cleanTo);
    } finally {
      setLoading(false);
    }
  };

  const clearFrom = () => setFrom("");
  const clearTo = () => setTo("");

  const swapLocations = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">
          Plan your journey
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Search any place in Hyderabad
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-center">
        {/* FROM */}
        <div className="relative">
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
            From
          </label>

          <div className="relative">
            <MapPin
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600"
            />

            <input
              value={from}
              onChange={(event) =>
                setFrom(event.target.value)
              }
              placeholder="Search starting place..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            {from && (
              <button
                type="button"
                onClick={clearFrom}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Clear starting place"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* SWAP */}
        <button
          type="button"
          onClick={swapLocations}
          className="mt-5 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
          title="Swap locations"
        >
          <ArrowRight size={17} />
        </button>

        {/* TO */}
        <div className="relative">
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
            To
          </label>

          <div className="relative">
            <MapPin
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600"
            />

            <input
              value={to}
              onChange={(event) =>
                setTo(event.target.value)
              }
              placeholder="Search destination..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            {to && (
              <button
                type="button"
                onClick={clearTo}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Clear destination"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* SEARCH */}
        <button
          type="submit"
          disabled={
            loading ||
            !from.trim() ||
            !to.trim()
          }
          className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />
              Searching
            </>
          ) : (
            <>
              <Search size={17} />
              Find Routes
            </>
          )}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
        <MapPin size={13} />

        <span>
          Powered by OpenStreetMap + TGSRTC GTFS
        </span>
      </div>
    </form>
  );
}