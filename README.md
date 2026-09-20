# 🚍 SmartCommute AI

SmartCommute AI is an intelligent transportation platform designed for **commuters and logistics operations**. It combines real transportation data, geospatial search, route optimization, and logistics intelligence in one platform.

## ✨ Features

### 🚌 Commuter
- TGSRTC GTFS-based bus route planning
- Real location search using OpenStreetMap
- Direct and transfer route detection
- Walking, waiting, and journey-time analysis
- Smart route recommendations

### 🚚 Logistics
- Freight route optimization
- Vehicle capacity management
- Fuel and driver cost estimation
- Shipment management
- Alternative road routes
- Route visualization

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Python
- **Transport Data:** TGSRTC GTFS
- **Maps:** Leaflet / React Leaflet
- **Location Search:** OpenStreetMap / Nominatim
- **Road Routing:** OSRM

## 📊 Architecture

```text
              SmartCommute AI
                    │
          ┌─────────┴─────────┐
          │                   │
      🚌 Commuter         🚚 Logistics
          │                   │
      GTFS Routing       Road Routing
          │                   │
      Route Search       Cost Analysis
          │                   │
          └─────────┬─────────┘
                    │
              FastAPI Backend
                    │
          ┌─────────┼─────────┐
          │         │         │
         GTFS    OSM/Nominatim OSRM
```
🚀 Run Locally
Frontend
```
npm install
npm run dev
```
```
Create .env.local:

NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
Backend
cd smartcommute-api

pip install -r requirements.txt

uvicorn main:app --reload

Frontend:

http://localhost:3000

Backend:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs
```
📌 Project Vision

SmartCommute AI aims to create a unified mobility platform that makes public transportation and freight movement smarter, more efficient, and data-driven.
