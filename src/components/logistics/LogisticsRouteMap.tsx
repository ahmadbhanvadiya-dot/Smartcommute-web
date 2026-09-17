"use client";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

interface RouteGeometry {
  type: string;
  coordinates: [number, number][];
}

interface LogisticsRoute {
  route_id: string;
  alternative_number: number;
  distance_km: number;
  duration_minutes: number;
  duration_text: string;
  estimated_cost: {
    fuel_litres: number;
    fuel_cost_inr: number;
    driver_cost_inr: number;
    estimated_total_inr: number;
  };
  geometry: RouteGeometry;
}

export interface LocationPoint {
  display_name: string;
  latitude: number;
  longitude: number;
}

interface Props {
  origin: LocationPoint | null;
  destination: LocationPoint | null;
  routes: LogisticsRoute[];
  selectedRouteId: string | null;
}

const originIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:32px;
      height:32px;
      border-radius:50%;
      background:#059669;
      border:4px solid white;
      box-shadow:0 2px 10px rgba(0,0,0,.25);
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:14px;
      font-weight:800;
    ">A</div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const destinationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:32px;
      height:32px;
      border-radius:50%;
      background:#0f172a;
      border:4px solid white;
      box-shadow:0 2px 10px rgba(0,0,0,.25);
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:14px;
      font-weight:800;
    ">B</div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function FitMap({
  origin,
  destination,
  routes,
  selectedRouteId,
}: {
  origin: LocationPoint | null;
  destination: LocationPoint | null;
  routes: LogisticsRoute[];
  selectedRouteId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!origin || !destination) return;

    const selectedRoute = routes.find(
      (route) => route.route_id === selectedRouteId
    );

    const points: [number, number][] = [
      [origin.latitude, origin.longitude],
      [destination.latitude, destination.longitude],
    ];

    if (selectedRoute?.geometry?.coordinates?.length) {
      selectedRoute.geometry.coordinates.forEach(
        ([lng, lat]) => {
          points.push([lat, lng]);
        }
      );
    }

    const bounds = L.latLngBounds(points);

    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 13,
      animate: true,
    });
  }, [
    origin,
    destination,
    routes,
    selectedRouteId,
    map,
  ]);

  return null;
}

export default function LogisticsRouteMap({
  origin,
  destination,
  routes,
  selectedRouteId,
}: Props) {
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  return (
    <div className="relative h-full min-h-[620px] overflow-hidden rounded-2xl">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMap
  origin={origin}
  destination={destination}
  routes={routes}
  selectedRouteId={selectedRouteId}
/>

        {origin && (
          <Marker
            position={[
              origin.latitude,
              origin.longitude,
            ]}
            icon={originIcon}
          >
            <Popup>
              <strong>Origin</strong>
              <br />
              {origin.display_name}
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker
            position={[
              destination.latitude,
              destination.longitude,
            ]}
            icon={destinationIcon}
          >
            <Popup>
              <strong>Destination</strong>
              <br />
              {destination.display_name}
            </Popup>
          </Marker>
        )}

        {routes.map((route) => {
          if (!route.geometry?.coordinates?.length) {
            return null;
          }

          const positions = route.geometry.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number]
          );

          const selected =
            route.route_id === selectedRouteId;

          return (
            <Polyline
              key={route.route_id}
              positions={positions}
              pathOptions={{
                color: selected ? "#059669" : "#64748b",
                weight: selected ? 7 : 4,
                opacity: selected ? 0.95 : 0.35,
              }}
            >
              <Popup>
                <strong>
                  {selected
                    ? "Selected Route"
                    : "Alternative Route"}
                </strong>

                <br />

                {route.distance_km} km

                <br />

                {route.duration_text}

                <br />

                ₹
                {route.estimated_cost.estimated_total_inr.toLocaleString(
                  "en-IN"
                )}
              </Popup>
            </Polyline>
          );
        })}
      </MapContainer>

      {!origin && !destination && (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-5 text-center shadow-xl backdrop-blur">
            <div className="text-3xl">🗺️</div>

            <p className="mt-2 text-sm font-bold text-slate-800">
              Route map
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Search locations and calculate a route
            </p>
          </div>
        </div>
      )}
    </div>
  );
}