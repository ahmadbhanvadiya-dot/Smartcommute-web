"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  MapPin,
  Truck,
  Route,
  Construction,
} from "lucide-react";

export default function LogisticsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to SmartCommute
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <Truck className="h-5 w-5 text-white" />
            </div>

            <div className="hidden sm:block">
              <p className="font-bold">SmartCommute</p>
              <p className="text-xs text-slate-500">Logistics</p>
            </div>
          </div>
        </header>

        {/* Main */}
        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
            <Construction className="h-10 w-10" />
          </div>

          <div className="mt-8 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            Logistics platform
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Smart logistics is
            <span className="text-emerald-600"> coming.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
            We are building an intelligent goods transportation platform to
            help businesses plan routes, manage shipments and optimize
            logistics operations.
          </p>

          {/* Feature Preview */}
          <div className="mt-12 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
            <Feature
              icon={<Route className="h-5 w-5" />}
              title="Route Planning"
              description="Efficient freight routes"
            />

            <Feature
              icon={<Box className="h-5 w-5" />}
              title="Shipment Planning"
              description="Plan goods movement"
            />

            <Feature
              icon={<Truck className="h-5 w-5" />}
              title="Fleet Intelligence"
              description="Optimize vehicle usage"
            />
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Choose another experience
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>

        <footer className="pb-4 text-center text-xs text-slate-400">
          SmartCommute AI • Logistics experience
        </footer>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>

      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}