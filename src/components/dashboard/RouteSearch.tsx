"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";

interface LocationResult {
  display_name: string;
  latitude: number;
  longitude: number;
  type?: string;
}

interface RouteSearchProps {
  onSearch: (from: string, to: string) => void;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function RouteSearch({
  onSearch,
}: RouteSearchProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [fromResults, setFromResults] = useState<LocationResult[]>(
    []
  );

  const [toResults, setToResults] = useState<LocationResult[]>(
    []
  );

  const [fromLoading, setFromLoading] = useState(false);
  const [toLoading, setToLoading] = useState(false);

  const [activeField, setActiveField] = useState<
    "from" | "to" | null
  >(null);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  /*
   * ----------------------------------------------------------
   * SEARCH LOCATIONS
   * ----------------------------------------------------------
   */

  async function searchLocations(
    query: string,
    field: "from" | "to"
  ) {
    const cleanQuery = query.trim();

    if (cleanQuery.length < 2) {
      if (field === "from") {
        setFromResults([]);
      } else {
        setToResults([]);
      }

      return;
    }

    if (field === "from") {
      setFromLoading(true);
    } else {
      setToLoading(true);
    }

    try {
      const response = await fetch(
        `${API_URL}/api/logistics/locations/search?q=${encodeURIComponent(
          cleanQuery
        )}`
      );

      if (!response.ok) {
        throw new Error("Location search failed");
      }

      const data = await response.json();

      const results: LocationResult[] =
        Array.isArray(data.results)
          ? data.results
          : [];

      if (field === "from") {
        setFromResults(results);
      } else {
        setToResults(results);
      }
    } catch (error) {
      console.error(
        "Location search failed:",
        error
      );

      if (field === "from") {
        setFromResults([]);
      } else {
        setToResults([]);
      }
    } finally {
      if (field === "from") {
        setFromLoading(false);
      } else {
        setToLoading(false);
      }
    }
  }

  /*
   * ----------------------------------------------------------
   * DEBOUNCED SEARCH
   * ----------------------------------------------------------
   */

  useEffect(() => {
    if (activeField !== "from") {
      return;
    }

    const timer = setTimeout(() => {
      searchLocations(from, "from");
    }, 400);

    return () => clearTimeout(timer);
  }, [from, activeField]);

  useEffect(() => {
    if (activeField !== "to") {
      return;
    }

    const timer = setTimeout(() => {
      searchLocations(to, "to");
    }, 400);

    return () => clearTimeout(timer);
  }, [to, activeField]);

  /*
   * ----------------------------------------------------------
   * SELECT LOCATION
   * ----------------------------------------------------------
   */

  function selectFromLocation(
    location: LocationResult
  ) {
    setFrom(location.display_name);
    setFromResults([]);
    setActiveField(null);
  }

  function selectToLocation(
    location: LocationResult
  ) {
    setTo(location.display_name);
    setToResults([]);
    setActiveField(null);
  }

  /*
   * ----------------------------------------------------------
   * SEARCH ROUTES
   * ----------------------------------------------------------
   */

  function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    if (!cleanFrom || !cleanTo) {
      return;
    }

    setFromResults([]);
    setToResults([]);
    setActiveField(null);

    /*
     * IMPORTANT:
     * We pass the typed text directly.
     *
     * The user does NOT have to select a suggestion.
     */
    onSearch(cleanFrom, cleanTo);
  }

  /*
   * ----------------------------------------------------------
   * SWAP LOCATIONS
   * ----------------------------------------------------------
   */

  function swapLocations() {
    const oldFrom = from;
    const oldTo = to;

    setFrom(oldTo);
    setTo(oldFrom);

    setFromResults([]);
    setToResults([]);
    setActiveField(null);
  }

  /*
   * ----------------------------------------------------------
   * CLOSE SUGGESTIONS WHEN CLICKING OUTSIDE
   * ----------------------------------------------------------
   */

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      if (
        fromRef.current &&
        !fromRef.current.contains(target) &&
        toRef.current &&
        !toRef.current.contains(target)
      ) {
        setFromResults([]);
        setToResults([]);
        setActiveField(null);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-900">
          Plan your journey
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Search any place in Hyderabad
        </p>
      </div>

      {/* Search fields */}
      <div className="grid items-end gap-4 lg:grid-cols-[1fr_auto_1fr_auto]">

        {/* FROM */}
        <div
          ref={fromRef}
          className="relative"
        >
          <label className="mb-2 block text-xs font-medium text-slate-600">
            From
          </label>

          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />

            <input
              type="text"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setActiveField("from");
              }}
              onFocus={() => {
                setActiveField("from");
              }}
              placeholder="Search starting place..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              autoComplete="off"
            />

            {fromLoading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-500" />
            )}
          </div>

          {/* FROM suggestions */}
          {activeField === "from" &&
            fromResults.length > 0 && (
              <div className="absolute left-0 right-0 top-[76px] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {fromResults.map(
                  (location, index) => (
                    <button
                      key={`${location.latitude}-${location.longitude}-${index}`}
                      type="button"
                      onClick={() =>
                        selectFromLocation(
                          location
                        )
                      }
                      className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-blue-50"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <MapPin className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium text-slate-800">
                          {location.display_name}
                        </p>

                        {location.type && (
                          <p className="mt-0.5 text-[11px] capitalize text-slate-400">
                            {location.type.replace(
                              /_/g,
                              " "
                            )}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
        </div>

        {/* SWAP */}
        <button
          type="button"
          onClick={swapLocations}
          title="Swap locations"
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        >
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* TO */}
        <div
          ref={toRef}
          className="relative"
        >
          <label className="mb-2 block text-xs font-medium text-slate-600">
            To
          </label>

          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />

            <input
              type="text"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setActiveField("to");
              }}
              onFocus={() => {
                setActiveField("to");
              }}
              placeholder="Search destination..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              autoComplete="off"
            />

            {toLoading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500" />
            )}
          </div>

          {/* TO suggestions */}
          {activeField === "to" &&
            toResults.length > 0 && (
              <div className="absolute left-0 right-0 top-[76px] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {toResults.map(
                  (location, index) => (
                    <button
                      key={`${location.latitude}-${location.longitude}-${index}`}
                      type="button"
                      onClick={() =>
                        selectToLocation(
                          location
                        )
                      }
                      className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <MapPin className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium text-slate-800">
                          {location.display_name}
                        </p>

                        {location.type && (
                          <p className="mt-0.5 text-[11px] capitalize text-slate-400">
                            {location.type.replace(
                              /_/g,
                              " "
                            )}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
        </div>

        {/* FIND ROUTES */}
        <button
          type="submit"
          disabled={!from.trim() || !to.trim()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Search className="h-4 w-4" />

          Find Routes
        </button>
      </div>

      {/* Data source */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <MapPin className="h-3.5 w-3.5" />

        <span>
          Powered by OpenStreetMap + TGSRTC GTFS
        </span>
      </div>
    </form>
  );
}