"use client";

import {
  AlertTriangle,
  BusFront,
  CheckCircle2,
  Clock3,
  MapPin,
  Radio,
  Users,
} from "lucide-react";

interface LiveTransportProps {
  from: string;
  to: string;
}

interface TransportService {
  route: string;
  name: string;
  eta: number;
  nextEta: number;
  crowd: "Low" | "Moderate" | "High";
  delay: number;
  status: "On Time" | "Delayed";
}

function generateTransportData(
  from: string,
  to: string
): TransportService[] {
  const text =
    `${from}-${to}`
      .toLowerCase()
      .split("")
      .reduce(
        (total, char) =>
          total + char.charCodeAt(0),
        0
      );

  const firstEta =
    5 + (text % 7);

  const secondEta =
    10 + ((text >> 2) % 9);

  const firstDelay =
    text % 5 === 0 ? 3 : 0;

  const secondDelay =
    text % 4 === 0 ? 5 : 0;

  return [
    {
      route: "216",
      name: "TSRTC City Bus",
      eta: firstEta,
      nextEta: firstEta + 13,
      crowd:
        text % 3 === 0
          ? "High"
          : "Moderate",
      delay: firstDelay,
      status:
        firstDelay > 0
          ? "Delayed"
          : "On Time",
    },
    {
      route: "5K",
      name: "TSRTC City Bus",
      eta: secondEta,
      nextEta: secondEta + 15,
      crowd:
        text % 2 === 0
          ? "Low"
          : "Moderate",
      delay: secondDelay,
      status:
        secondDelay > 0
          ? "Delayed"
          : "On Time",
    },
  ];
}

function CrowdBadge({
  crowd,
}: {
  crowd: TransportService["crowd"];
}) {
  const styles = {
    Low: "bg-emerald-50 text-emerald-700",
    Moderate:
      "bg-amber-50 text-amber-700",
    High: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[crowd]}`}
    >
      <Users size={11} />
      {crowd}
    </span>
  );
}

export default function LiveTransport({
  from,
  to,
}: LiveTransportProps) {
  const services =
    generateTransportData(
      from,
      to
    );

  const hasDelay = services.some(
    (service) => service.delay > 0
  );

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Live Transport
            </h2>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-600">
              <Radio size={10} />
              Live
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Estimated public transport availability for your current journey.
          </p>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <MapPin size={12} />
          <span>
            {from && to
              ? `${from} → ${to}`
              : "Enter a start and destination"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <div
            key={service.route}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BusFront size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Bus Route {service.route}
                  </p>
                  <h3 className="mt-1 text-sm font-bold text-slate-900">
                    {service.name}
                  </h3>
                </div>
              </div>

              {service.status === "On Time" ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
                  <CheckCircle2 size={11} />
                  On Time
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700">
                  <AlertTriangle size={11} />
                  +{service.delay} min
                </span>
              )}
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Next bus
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">
                      {service.eta}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      min
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Following
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {service.nextEta} min
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <CrowdBadge crowd={service.crowd} />
              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                <Clock3 size={12} />
                Updated just now
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[9px]">
                <span className="font-semibold text-slate-400">
                  ARRIVAL ESTIMATE
                </span>
                <span className="font-bold text-blue-600">
                  {service.eta} min
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${Math.max(
                      15,
                      Math.min(
                        100,
                        100 - service.eta * 5
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Radio size={14} />
            </div>
            <p className="text-[11px] text-slate-500">
              SmartCommute is checking estimated transport availability.
            </p>
          </div>

          <span
            className={`text-[10px] font-bold ${
              hasDelay
                ? "text-amber-600"
                : "text-emerald-600"
            }`}
          >
            {hasDelay
              ? "Minor delays detected"
              : "Services operating normally"}
          </span>
        </div>
      </div>
    </section>
  );
}
