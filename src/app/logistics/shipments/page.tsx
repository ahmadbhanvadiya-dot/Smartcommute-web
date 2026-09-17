"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Edit3,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Truck,
  X,
  Trash2,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type ShipmentStatus =
  | "Pending"
  | "Planned"
  | "In Transit"
  | "Delivered"
  | "Cancelled";

interface LocationResult {
  display_name: string;
  latitude: number;
  longitude: number;
  type?: string | null;
}

interface ShipmentLocation {
  name: string;
  latitude: number;
  longitude: number;
}

interface Shipment {
  shipment_id: string;
  origin: ShipmentLocation;
  destination: ShipmentLocation;
  cargo_weight_kg: number;
  vehicle_type: string;
  status: ShipmentStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Vehicle {
  type: string;
  label: string;
  capacity_kg: number;
  fuel_efficiency_kmpl: number;
  fuel_price_per_liter: number;
  driver_cost_per_hour: number;
}

const STATUS_OPTIONS: ShipmentStatus[] = [
  "Pending",
  "Planned",
  "In Transit",
  "Delivered",
  "Cancelled",
];

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function formatVehicleName(vehicleType: string) {
  return vehicleType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function statusClasses(status: ShipmentStatus) {
  switch (status) {
    case "Delivered":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "In Transit":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Planned":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

function statusDot(status: ShipmentStatus) {
  switch (status) {
    case "Delivered":
      return "bg-emerald-500";
    case "In Transit":
      return "bg-blue-500";
    case "Planned":
      return "bg-violet-500";
    case "Cancelled":
      return "bg-red-500";
    default:
      return "bg-amber-500";
  }
}

export default function LogisticsShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ShipmentStatus>(
    "All",
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(
    null,
  );

  const [selectedShipment, setSelectedShipment] =
    useState<Shipment | null>(null);

  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [shipmentsResponse, vehiclesResponse] = await Promise.all([
        fetch(`${API_URL}/api/logistics/shipments`, {
          cache: "no-store",
        }),
        fetch(`${API_URL}/api/logistics/vehicles`, {
          cache: "no-store",
        }),
      ]);

      if (!shipmentsResponse.ok) {
        throw new Error("Unable to load shipments.");
      }

      const shipmentsData = await shipmentsResponse.json();

      setShipments(shipmentsData.shipments || []);

      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json();
        setVehicles(vehiclesData.vehicles || []);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading shipments.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredShipments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return shipments.filter((shipment) => {
      const matchesStatus =
        statusFilter === "All" || shipment.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        shipment.shipment_id.toLowerCase().includes(query) ||
        shipment.origin.name.toLowerCase().includes(query) ||
        shipment.destination.name.toLowerCase().includes(query) ||
        formatVehicleName(shipment.vehicle_type)
          .toLowerCase()
          .includes(query)
      );
    });
  }, [shipments, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: shipments.length,
      pending: shipments.filter((s) => s.status === "Pending").length,
      inTransit: shipments.filter((s) => s.status === "In Transit").length,
      delivered: shipments.filter((s) => s.status === "Delivered").length,
    };
  }, [shipments]);

  async function handleDelete(shipment: Shipment) {
    const confirmed = window.confirm(
      `Delete shipment ${shipment.shipment_id}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(shipment.shipment_id);

      const response = await fetch(
        `${API_URL}/api/logistics/shipments/${shipment.shipment_id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "Unable to delete shipment.");
      }

      setShipments((current) =>
        current.filter(
          (item) => item.shipment_id !== shipment.shipment_id,
        ),
      );

      if (selectedShipment?.shipment_id === shipment.shipment_id) {
        setSelectedShipment(null);
      }
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Unable to delete shipment.",
      );
    } finally {
      setDeleteLoading(null);
    }
  }

  function handleCreated(shipment: Shipment) {
    setShipments((current) => [shipment, ...current]);
    setShowCreateModal(false);
  }

  function handleUpdated(shipment: Shipment) {
    setShipments((current) =>
      current.map((item) =>
        item.shipment_id === shipment.shipment_id ? shipment : item,
      ),
    );

    setEditingShipment(null);

    if (selectedShipment?.shipment_id === shipment.shipment_id) {
      setSelectedShipment(shipment);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-16 lg:ml-64 lg:pt-0">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Truck className="h-4 w-4" />
              Logistics
              <span>/</span>
              Shipments
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Shipments
            </h1>

            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Manage and track freight shipments across your network.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New Shipment
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total Shipments"
            value={stats.total}
            icon={<Package className="h-5 w-5" />}
          />

          <StatCard
            label="Pending"
            value={stats.pending}
            icon={<Clock3 className="h-5 w-5" />}
          />

          <StatCard
            label="In Transit"
            value={stats.inTransit}
            icon={<Truck className="h-5 w-5" />}
          />

          <StatCard
            label="Delivered"
            value={stats.delivered}
            icon={<Check className="h-5 w-5" />}
          />
        </div>

        {/* Main card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search shipment, origin or destination..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as "All" | ShipmentStatus,
                      )
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 sm:min-w-36"
                  >
                    <option value="All">All Status</option>

                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                <button
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  title="Refresh shipments"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="m-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div className="flex-1">
                <p className="font-semibold">Unable to load shipments</p>
                <p className="mt-1">{error}</p>
              </div>

              <button
                onClick={() => loadData()}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <LoadingState />
          ) : filteredShipments.length === 0 ? (
            <EmptyState
              hasFilters={Boolean(search) || statusFilter !== "All"}
              onCreate={() => setShowCreateModal(true)}
              onClear={() => {
                setSearch("");
                setStatusFilter("All");
              }}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Shipment
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Route
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Cargo
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Vehicle
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Created
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredShipments.map((shipment) => (
                      <ShipmentRow
                        key={shipment.shipment_id}
                        shipment={shipment}
                        onView={() => setSelectedShipment(shipment)}
                        onEdit={() => setEditingShipment(shipment)}
                        onDelete={() => handleDelete(shipment)}
                        deleting={deleteLoading === shipment.shipment_id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredShipments.map((shipment) => (
                  <ShipmentMobileCard
                    key={shipment.shipment_id}
                    shipment={shipment}
                    onView={() => setSelectedShipment(shipment)}
                    onEdit={() => setEditingShipment(shipment)}
                    onDelete={() => handleDelete(shipment)}
                    deleting={deleteLoading === shipment.shipment_id}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <ShipmentModal
          vehicles={vehicles}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Edit modal */}
      {editingShipment && (
        <EditShipmentModal
          shipment={editingShipment}
          onClose={() => setEditingShipment(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Details modal */}
      {selectedShipment && (
        <ShipmentDetailsModal
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onEdit={() => {
            setEditingShipment(selectedShipment);
            setSelectedShipment(null);
          }}
        />
      )}
    </main>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        {icon}
      </div>

      <p className="text-xs font-medium text-slate-500 sm:text-sm">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

/* ============================================================
   DESKTOP ROW
============================================================ */

function ShipmentRow({
  shipment,
  onView,
  onEdit,
  onDelete,
  deleting,
}: {
  shipment: Shipment;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <button onClick={onView} className="text-left">
          <p className="font-semibold text-slate-900">
            {shipment.shipment_id}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Updated {formatDate(shipment.updated_at)}
          </p>
        </button>
      </td>

      <td className="min-w-72 px-5 py-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="max-w-32 truncate font-medium text-slate-700">
            {shipment.origin.name}
          </div>

          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />

          <div className="max-w-32 truncate font-medium text-slate-700">
            {shipment.destination.name}
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-slate-800">
          {shipment.cargo_weight_kg.toLocaleString("en-IN")} kg
        </p>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Truck className="h-4 w-4 text-slate-400" />
          {formatVehicleName(shipment.vehicle_type)}
        </div>
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={shipment.status} />
      </td>

      <td className="px-5 py-4 text-sm text-slate-500">
        {formatDate(shipment.created_at)}
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <button
            onClick={onView}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            View
          </button>

          <button
            onClick={onEdit}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            title="Edit shipment"
          >
            <Edit3 className="h-4 w-4" />
          </button>

          <button
            onClick={onDelete}
            disabled={deleting}
            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Delete shipment"
          >
            {deleting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ============================================================
   MOBILE CARD
============================================================ */

function ShipmentMobileCard({
  shipment,
  onView,
  onEdit,
  onDelete,
  deleting,
}: {
  shipment: Shipment;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <button onClick={onView} className="text-left">
          <p className="font-bold text-slate-900">
            {shipment.shipment_id}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Created {formatDate(shipment.created_at)}
          </p>
        </button>

        <StatusBadge status={shipment.status} />
      </div>

      <div className="rounded-xl bg-slate-50 p-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />

          <p className="min-w-0 truncate text-sm font-medium text-slate-700">
            {shipment.origin.name}
          </p>
        </div>

        <div className="ml-2 mt-1 h-4 border-l border-dashed border-slate-300" />

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />

          <p className="min-w-0 truncate text-sm font-medium text-slate-700">
            {shipment.destination.name}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          <strong className="text-slate-800">
            {shipment.cargo_weight_kg.toLocaleString("en-IN")} kg
          </strong>{" "}
          cargo
        </span>

        <span>{formatVehicleName(shipment.vehicle_type)}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onView}
          className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View
        </button>

        <button
          onClick={onEdit}
          className="rounded-xl border border-slate-200 px-3 text-slate-600 hover:bg-slate-50"
        >
          <Edit3 className="h-4 w-4" />
        </button>

        <button
          onClick={onDelete}
          disabled={deleting}
          className="rounded-xl border border-slate-200 px-3 text-slate-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          {deleting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
        status,
      )}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDot(status)}`} />
      {status}
    </span>
  );
}

/* ============================================================
   CREATE SHIPMENT MODAL
============================================================ */

function ShipmentModal({
  vehicles,
  onClose,
  onCreated,
}: {
  vehicles: Vehicle[];
  onClose: () => void;
  onCreated: (shipment: Shipment) => void;
}) {
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");

  const [originResults, setOriginResults] = useState<LocationResult[]>([]);
  const [destinationResults, setDestinationResults] = useState<
    LocationResult[]
  >([]);

  const [origin, setOrigin] = useState<LocationResult | null>(null);
  const [destination, setDestination] =
    useState<LocationResult | null>(null);

  const [cargoWeight, setCargoWeight] = useState("1200");
  const [vehicleType, setVehicleType] = useState(
    vehicles[0]?.type || "medium_truck",
  );
  const [notes, setNotes] = useState("");

  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [searchingDestination, setSearchingDestination] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function searchLocation(
    query: string,
    target: "origin" | "destination",
  ) {
    if (query.trim().length < 2) {
      return;
    }

    try {
      setError("");

      if (target === "origin") {
        setSearchingOrigin(true);
      } else {
        setSearchingDestination(true);
      }

      const response = await fetch(
        `${API_URL}/api/logistics/locations/search?q=${encodeURIComponent(
          query.trim(),
        )}`,
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.detail || "Location search failed.",
        );
      }

      const data = await response.json();

      if (target === "origin") {
        setOriginResults(data.results || []);
      } else {
        setDestinationResults(data.results || []);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to search location.",
      );
    } finally {
      setSearchingOrigin(false);
      setSearchingDestination(false);
    }
  }

  async function submitShipment() {
    setError("");

    if (!origin) {
      setError("Please select an origin location.");
      return;
    }

    if (!destination) {
      setError("Please select a destination location.");
      return;
    }

    const weight = Number(cargoWeight);

    if (!Number.isFinite(weight) || weight <= 0) {
      setError("Enter a valid cargo weight.");
      return;
    }

    const selectedVehicle = vehicles.find(
      (vehicle) => vehicle.type === vehicleType,
    );

    if (
      selectedVehicle &&
      weight > selectedVehicle.capacity_kg
    ) {
      setError(
        `Cargo exceeds the ${selectedVehicle.label} capacity of ${selectedVehicle.capacity_kg.toLocaleString(
          "en-IN",
        )} kg.`,
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/api/logistics/shipments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origin: {
              name: origin.display_name,
              latitude: origin.latitude,
              longitude: origin.longitude,
            },
            destination: {
              name: destination.display_name,
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
            cargo_weight_kg: weight,
            vehicle_type: vehicleType,
            notes,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to create shipment.",
        );
      }

      onCreated(data.shipment);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create shipment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.type === vehicleType,
  );

  return (
    <ModalShell title="Create Shipment" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <p className="text-sm text-slate-500">
            Create a freight shipment using real locations and vehicle data.
          </p>
        </div>

        {error && <FormError message={error} />}

        {/* Origin */}
        <LocationPicker
          label="Origin"
          placeholder="Search pickup location..."
          query={originQuery}
          setQuery={(value) => {
            setOriginQuery(value);
            setOrigin(null);
          }}
          results={originResults}
          selected={origin}
          onSearch={() => searchLocation(originQuery, "origin")}
          onSelect={(location) => {
            setOrigin(location);
            setOriginQuery(location.display_name);
            setOriginResults([]);
          }}
          searching={searchingOrigin}
        />

        {/* Destination */}
        <LocationPicker
          label="Destination"
          placeholder="Search delivery location..."
          query={destinationQuery}
          setQuery={(value) => {
            setDestinationQuery(value);
            setDestination(null);
          }}
          results={destinationResults}
          selected={destination}
          onSearch={() =>
            searchLocation(destinationQuery, "destination")
          }
          onSelect={(location) => {
            setDestination(location);
            setDestinationQuery(location.display_name);
            setDestinationResults([]);
          }}
          searching={searchingDestination}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Cargo Weight
            </label>

            <div className="relative">
              <input
                type="number"
                min="1"
                value={cargoWeight}
                onChange={(event) =>
                  setCargoWeight(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-12 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                kg
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Vehicle
            </label>

            <div className="relative">
              <select
                value={vehicleType}
                onChange={(event) =>
                  setVehicleType(event.target.value)
                }
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:border-slate-400"
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle.type} value={vehicle.type}>
                    {vehicle.label}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {selectedVehicle && (
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Vehicle capacity</span>
              <strong className="text-slate-900">
                {selectedVehicle.capacity_kg.toLocaleString("en-IN")} kg
              </strong>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span>Estimated utilization</span>
              <strong className="text-slate-900">
                {Math.min(
                  100,
                  (Number(cargoWeight) /
                    selectedVehicle.capacity_kg) *
                    100,
                ).toFixed(0)}
                %
              </strong>
            </div>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Notes <span className="font-normal text-slate-400">(optional)</span>
          </label>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Add shipment instructions..."
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={submitShipment}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
              <RefreshCw className="h-4 w-4 animate-spin" />
            )}
            {submitting ? "Creating..." : "Create Shipment"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ============================================================
   LOCATION PICKER
============================================================ */

function LocationPicker({
  label,
  placeholder,
  query,
  setQuery,
  results,
  selected,
  onSearch,
  onSelect,
  searching,
}: {
  label: string;
  placeholder: string;
  query: string;
  setQuery: (value: string) => void;
  results: LocationResult[];
  selected: LocationResult | null;
  onSearch: () => void;
  onSelect: (location: LocationResult) => void;
  searching: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSearch();
              }
            }}
            placeholder={placeholder}
            className={`h-11 w-full rounded-xl border bg-white pl-10 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 ${
              selected
                ? "border-emerald-300 bg-emerald-50/30"
                : "border-slate-200"
            }`}
          />
        </div>

        <button
          onClick={onSearch}
          disabled={searching || query.trim().length < 2}
          className="h-11 shrink-0 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50 sm:px-4"
        >
          {searching ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((result, index) => (
            <button
              key={`${result.latitude}-${result.longitude}-${index}`}
              onClick={() => onSelect(result)}
              className="flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left last:border-0 hover:bg-slate-50"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-800">
                  {result.display_name}
                </span>

                {result.type && (
                  <span className="mt-1 block text-xs text-slate-400">
                    {result.type}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="mt-1.5 text-xs text-slate-400">
        Type a location and press Enter or Search.
      </p>
    </div>
  );
}

/* ============================================================
   EDIT MODAL
============================================================ */

function EditShipmentModal({
  shipment,
  onClose,
  onUpdated,
}: {
  shipment: Shipment;
  onClose: () => void;
  onUpdated: (shipment: Shipment) => void;
}) {
  const [status, setStatus] = useState<ShipmentStatus>(
    shipment.status,
  );
  const [notes, setNotes] = useState(shipment.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/logistics/shipments/${shipment.shipment_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            notes,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to update shipment.",
        );
      }

      onUpdated(data.shipment);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update shipment.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={`Edit ${shipment.shipment_id}`}
      onClose={onClose}
    >
      <div className="space-y-5">
        {error && <FormError message={error} />}

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Route
          </p>

          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800">
            <span className="truncate">{shipment.origin.name}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">
              {shipment.destination.name}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Shipment Status
          </label>

          <div className="relative">
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ShipmentStatus)
              }
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:border-slate-400"
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Notes
          </label>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving && (
              <RefreshCw className="h-4 w-4 animate-spin" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ============================================================
   DETAILS MODAL
============================================================ */

function ShipmentDetailsModal({
  shipment,
  onClose,
  onEdit,
}: {
  shipment: Shipment;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <ModalShell
      title={shipment.shipment_id}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Current status</span>
          <StatusBadge status={shipment.status} />
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Route
          </p>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-900" />

              <div className="min-w-0">
                <p className="text-xs text-slate-400">Origin</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {shipment.origin.name}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {shipment.origin.latitude.toFixed(5)},{" "}
                  {shipment.origin.longitude.toFixed(5)}
                </p>
              </div>
            </div>

            <div className="ml-1 border-l border-dashed border-slate-300 pl-5">
              <div className="flex gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-white" />

                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    Destination
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {shipment.destination.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {shipment.destination.latitude.toFixed(5)},{" "}
                    {shipment.destination.longitude.toFixed(5)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DetailItem
            label="Cargo"
            value={`${shipment.cargo_weight_kg.toLocaleString(
              "en-IN",
            )} kg`}
          />

          <DetailItem
            label="Vehicle"
            value={formatVehicleName(shipment.vehicle_type)}
          />

          <DetailItem
            label="Created"
            value={formatDate(shipment.created_at)}
          />

          <DetailItem
            label="Updated"
            value={formatDate(shipment.updated_at)}
          />
        </div>

        {shipment.notes && (
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {shipment.notes}
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>

          <button
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Edit3 className="h-4 w-4" />
            Edit Shipment
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ============================================================
   DETAIL ITEM
============================================================ */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   MODAL SHELL
============================================================ */

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

/* ============================================================
   FORM ERROR
============================================================ */

function FormError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingState() {
  return (
    <div className="p-5">
      <div className="hidden space-y-4 md:block">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>

      <div className="space-y-4 md:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function EmptyState({
  hasFilters,
  onCreate,
  onClear,
}: {
  hasFilters: boolean;
  onCreate: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Package className="h-7 w-7 text-slate-400" />
      </div>

      <h3 className="text-base font-bold text-slate-900">
        {hasFilters ? "No matching shipments" : "No shipments yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {hasFilters
          ? "Try changing your search or status filter."
          : "Create your first freight shipment to start managing logistics."}
      </p>

      <div className="mt-5 flex gap-2">
        {hasFilters && (
          <button
            onClick={onClear}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear Filters
          </button>
        )}

        {!hasFilters && (
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Create Shipment
          </button>
        )}
      </div>
    </div>
  );
}