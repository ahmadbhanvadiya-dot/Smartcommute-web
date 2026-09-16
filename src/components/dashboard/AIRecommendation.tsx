"use client";

import { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  Route,
  TrafficCone,
  Users,
  X,
} from "lucide-react";

import type { RouteOption } from "@/lib/route-engine";

interface AIRecommendationProps {
  route: RouteOption;
}

export default function AIRecommendation({
  route,
}: AIRecommendationProps) {
  const [showDetails, setShowDetails] =
    useState(false);

  const crowd =
    route.crowd === 0
      ? "None"
      : route.crowd < 40
        ? "Low"
        : route.crowd < 70
          ? "Moderate"
          : "High";

  const traffic =
    route.traffic === 0
      ? "None"
      : route.traffic < 40
        ? "Low"
        : route.traffic < 70
          ? "Moderate"
          : "High";

  return (
    <>
      {/* ================================================= */}
      {/* AI RECOMMENDATION CARD */}
      {/* ================================================= */}

      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">

        {/* Header */}

        <div className="flex items-start justify-between gap-4">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <BrainCircuit size={22} />
            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                AI Recommendation
              </p>

              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {route.title}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {route.description}
              </p>

            </div>

          </div>

          {/* AI SCORE */}

          <div className="rounded-xl bg-blue-50 px-4 py-3 text-center">

            <p className="text-[10px] font-bold text-blue-500">
              AI SCORE
            </p>

            <p className="text-2xl font-black text-blue-700">
              {route.score}
            </p>

          </div>

        </div>

        {/* ================================================= */}
        {/* QUICK STATS */}
        {/* ================================================= */}

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">

          <div>

            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock3 size={13} />
              Arrival
            </div>

            <p className="mt-1 text-sm font-bold text-slate-900">
              {route.eta} min
            </p>

          </div>

          <div>

            <div className="flex items-center gap-1 text-xs text-slate-400">
              <IndianRupee size={13} />
              Cost
            </div>

            <p className="mt-1 text-sm font-bold text-slate-900">
              {route.cost === 0
                ? "Free"
                : `₹${route.cost}`}
            </p>

          </div>

          <div>

            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Users size={13} />
              Crowd
            </div>

            <p className="mt-1 text-sm font-bold text-slate-900">
              {crowd}
            </p>

          </div>

        </div>

        {/* ================================================= */}
        {/* WHY THIS ROUTE */}
        {/* ================================================= */}

        <div className="mt-5 rounded-xl bg-slate-50 p-4">

          <div className="flex gap-3">

            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-emerald-500"
            />

            <div>

              <p className="text-xs font-bold text-slate-800">
                Why this route?
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                SmartCommute considered travel time,
                estimated cost, traffic, crowd level
                and route reliability.
              </p>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* VIEW DETAILS BUTTON */}
        {/* ================================================= */}

        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-[0.99]"
        >
          View Route Details
          <ArrowRight size={15} />
        </button>

      </div>

      {/* ================================================= */}
      {/* ROUTE DETAILS MODAL */}
      {/* ================================================= */}

      {showDetails && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setShowDetails(false)}
        >

          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* ================================================= */}
            {/* MODAL HEADER */}
            {/* ================================================= */}

            <div className="flex items-start justify-between border-b border-slate-100 p-6">

              <div className="flex items-start gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Route size={21} />
                </div>

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Route Analysis
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {route.title}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    AI-generated commute analysis
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowDetails(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close route details"
              >
                <X size={19} />
              </button>

            </div>

            {/* ================================================= */}
            {/* AI SUMMARY */}
            {/* ================================================= */}

            <div className="p-6">

              <div className="rounded-2xl bg-blue-50 p-5">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      SmartCommute AI Score
                    </p>

                    <p className="mt-1 text-sm text-blue-900">
                      This route received an overall
                      optimization score based on
                      multiple commute factors.
                    </p>

                  </div>

                  <div className="shrink-0 text-center">

                    <div className="text-4xl font-black text-blue-700">
                      {route.score}
                    </div>

                    <p className="text-[10px] font-bold text-blue-500">
                      OUT OF 100
                    </p>

                  </div>

                </div>

              </div>

              {/* ================================================= */}
              {/* ROUTE OVERVIEW */}
              {/* ================================================= */}

              <div className="mt-6">

                <h3 className="text-sm font-bold text-slate-900">
                  Journey Overview
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">

                  {/* ETA */}

                  <div className="rounded-xl border border-slate-200 p-4">

                    <div className="flex items-center gap-2">

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Clock3 size={17} />
                      </div>

                      <div>

                        <p className="text-[10px] font-semibold uppercase text-slate-400">
                          Estimated Time
                        </p>

                        <p className="text-sm font-bold text-slate-900">
                          {route.eta} minutes
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* COST */}

                  <div className="rounded-xl border border-slate-200 p-4">

                    <div className="flex items-center gap-2">

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <IndianRupee size={17} />
                      </div>

                      <div>

                        <p className="text-[10px] font-semibold uppercase text-slate-400">
                          Estimated Cost
                        </p>

                        <p className="text-sm font-bold text-slate-900">
                          {route.cost === 0
                            ? "Free"
                            : `₹${route.cost}`}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* CROWD */}

                  <div className="rounded-xl border border-slate-200 p-4">

                    <div className="flex items-center gap-2">

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                        <Users size={17} />
                      </div>

                      <div>

                        <p className="text-[10px] font-semibold uppercase text-slate-400">
                          Crowd Level
                        </p>

                        <p className="text-sm font-bold text-slate-900">
                          {crowd}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* TRAFFIC */}

                  <div className="rounded-xl border border-slate-200 p-4">

                    <div className="flex items-center gap-2">

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <TrafficCone size={17} />
                      </div>

                      <div>

                        <p className="text-[10px] font-semibold uppercase text-slate-400">
                          Traffic
                        </p>

                        <p className="text-sm font-bold text-slate-900">
                          {traffic}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* ================================================= */}
              {/* FACTOR BREAKDOWN */}
              {/* ================================================= */}

              <div className="mt-6">

                <h3 className="text-sm font-bold text-slate-900">
                  AI Factor Analysis
                </h3>

                <div className="mt-3 space-y-4">

                  {/* TIME */}

                  <FactorBar
                    label="Travel Time"
                    value={Math.max(
                      0,
                      Math.min(
                        100,
                        Math.round(
                          100 -
                            route.eta * 1.4
                        )
                      )
                    )}
                    description="Lower journey time improves the route score."
                  />

                  {/* COST */}

                  <FactorBar
                    label="Cost Efficiency"
                    value={
                      route.cost === 0
                        ? 100
                        : Math.max(
                            0,
                            Math.min(
                              100,
                              Math.round(
                                100 -
                                  route.cost *
                                    0.75
                              )
                            )
                          )
                    }
                    description="Lower estimated travel cost improves affordability."
                  />

                  {/* CROWD */}

                  <FactorBar
                    label="Crowd Comfort"
                    value={
                      100 - route.crowd
                    }
                    description="Lower passenger density provides a more comfortable journey."
                  />

                  {/* TRAFFIC */}

                  <FactorBar
                    label="Traffic Conditions"
                    value={
                      100 - route.traffic
                    }
                    description="Lower traffic impact reduces expected delays."
                  />

                  {/* RELIABILITY */}

                  <FactorBar
                    label="Reliability"
                    value={
                      route.reliability
                    }
                    description="Higher reliability means a more predictable journey."
                  />

                </div>

              </div>

              {/* ================================================= */}
              {/* ROUTE STATUS */}
              {/* ================================================= */}

              <div className="mt-6 rounded-2xl border border-slate-200 p-5">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={19} />
                  </div>

                  <div>

                    <p className="text-sm font-bold text-slate-900">
                      {route.delayRisk} Delay Risk
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Based on estimated traffic,
                      reliability and journey
                      characteristics, this route
                      currently has a{" "}
                      <strong>
                        {route.delayRisk.toLowerCase()}
                      </strong>{" "}
                      delay risk.
                    </p>

                  </div>

                </div>

              </div>

              {/* ================================================= */}
              {/* ROUTE STEPS */}
              {/* ================================================= */}

              <div className="mt-6">

                <h3 className="text-sm font-bold text-slate-900">
                  Journey Steps
                </h3>

                <div className="mt-3 space-y-3">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <MapPin size={17} />
                    </div>

                    <div>

                      <p className="text-xs font-bold text-slate-900">
                        Start Journey
                      </p>

                      <p className="text-[11px] text-slate-500">
                        Depart from your selected
                        starting location.
                      </p>

                    </div>

                  </div>

                  <div className="ml-[18px] h-5 border-l border-dashed border-slate-300" />

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Route size={17} />
                    </div>

                    <div>

                      <p className="text-xs font-bold text-slate-900">
                        Travel via {route.title}
                      </p>

                      <p className="text-[11px] text-slate-500">
                        Follow the recommended transport
                        option.
                      </p>

                    </div>

                  </div>

                  <div className="ml-[18px] h-5 border-l border-dashed border-slate-300" />

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                      <MapPin size={17} />
                    </div>

                    <div>

                      <p className="text-xs font-bold text-slate-900">
                        Reach Destination
                      </p>

                      <p className="text-[11px] text-slate-500">
                        Estimated arrival in{" "}
                        <strong>
                          {route.eta} minutes
                        </strong>
                        .
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* ================================================= */}
            {/* MODAL FOOTER */}
            {/* ================================================= */}

            <div className="border-t border-slate-100 bg-slate-50 p-4">

              <button
                type="button"
                onClick={() =>
                  setShowDetails(false)
                }
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Done
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

/*
|--------------------------------------------------------------------------
| Factor bar
|--------------------------------------------------------------------------
*/

function FactorBar({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  const safeValue = Math.max(
    0,
    Math.min(100, value)
  );

  return (
    <div>

      <div className="flex items-center justify-between">

        <p className="text-xs font-semibold text-slate-700">
          {label}
        </p>

        <p className="text-xs font-bold text-slate-900">
          {safeValue}%
        </p>

      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">

        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{
            width: `${safeValue}%`,
          }}
        />

      </div>

      <p className="mt-1 text-[10px] text-slate-400">
        {description}
      </p>

    </div>
  );
}