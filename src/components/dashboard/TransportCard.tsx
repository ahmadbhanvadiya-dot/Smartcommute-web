"use client";

import {
  BusFront,
  CarFront,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Users,
  Footprints,
} from "lucide-react";

interface TransportCardProps {
  type: "bus" | "auto" | "walk";
  title: string;
  eta: string;
  cost: string;
  crowd: string;
  recommended?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export default function TransportCard({
  type,
  title,
  eta,
  cost,
  crowd,
  recommended = false,
  selected = false,
  onClick,
}: TransportCardProps) {
  const getIcon = () => {
    if (type === "bus") {
      return <BusFront size={22} />;
    }

    if (type === "auto") {
      return <CarFront size={22} />;
    }

    return <Footprints size={22} />;
  };

  const getIconBackground = () => {
    if (type === "bus") {
      return "bg-blue-50 text-blue-600";
    }

    if (type === "auto") {
      return "bg-amber-50 text-amber-600";
    }

    return "bg-emerald-50 text-emerald-600";
  };

  const getCrowdStyle = () => {
    if (crowd === "Low" || crowd === "None") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (crowd === "Moderate") {
      return "bg-amber-50 text-amber-700";
    }

    return "bg-red-50 text-red-700";
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition-all duration-200 ${
        selected
          ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
          : "border-slate-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      }`}
    >
      {/* Recommended badge */}

      {recommended && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
          <CheckCircle2 size={11} />
          AI Pick
        </div>
      )}

      {/* Selected badge */}

      {selected && !recommended && (
        <div className="absolute right-4 top-4 rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
          Selected
        </div>
      )}

      {/* Icon + title */}

      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${getIconBackground()}`}
        >
          {getIcon()}
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900">
            {title}
          </h3>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Tap to analyze this option
          </p>
        </div>
      </div>

      {/* Stats */}

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">

        {/* ETA */}

        <div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock3 size={12} />
            ETA
          </div>

          <p className="mt-1 text-sm font-bold text-slate-900">
            {eta}
          </p>
        </div>

        {/* Cost */}

        <div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <IndianRupee size={12} />
            Cost
          </div>

          <p className="mt-1 text-sm font-bold text-slate-900">
            {cost}
          </p>
        </div>

        {/* Crowd */}

        <div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Users size={12} />
            Crowd
          </div>

          <p
            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${getCrowdStyle()}`}
          >
            {crowd}
          </p>
        </div>

      </div>

      {/* Selection indicator */}

      <div
        className={`mt-4 flex items-center justify-center rounded-lg py-2 text-[10px] font-bold transition ${
          selected
            ? "bg-blue-600 text-white"
            : "bg-slate-50 text-slate-500"
        }`}
      >
        {selected
          ? "Currently analyzing this route"
          : "Select this route"}
      </div>
    </button>
  );
}