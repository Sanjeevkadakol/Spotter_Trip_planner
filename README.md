# SpotterELD — Truck Trip Planner & ELD Log Generator

[![Django](https://img.shields.io/badge/Django-6.0.4-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![License](https://img.shields.io/badge/License-MIT-black?style=for-the-badge)](LICENSE)

A production-quality full-stack web application designed for commercial property-carrying truck drivers. Enter your trip details to calculate legal FMCSA Hours of Service routes, schedule required stops & rest cycles, map highway routes via free OpenStreetMap/OSRM APIs, and instantly generate standard 24-hour ELD daily logs with full print support.

---

## 🌟 Key Features

- 🗺️ **Open Routing & Geocoding**: Uses Nominatim (OSM) & Photon geocoders with OSRM highway routing — zero paid third-party API keys required.
- ⏱️ **FMCSA Part 395 Compliance Engine**:
  - 11-hour driving limit per shift.
  - 14-hour consecutive on-duty window.
  - Mandatory 30-minute break after 8 hours of cumulative driving.
  - 10-hour consecutive off-duty / sleeper berth rest requirement.
  - 70-hour / 8-day rolling cycle limit with automatic 34-hour restart calculation.
- ⛽ **Automated Fuel Stops**: Automatically calculates and positions 30-minute fuel stops every ≤ 1,000 miles.
- 📦 **Pickup & Dropoff Dwell Times**: Automatically logs 1-hour On-Duty Not Driving at pickup and dropoff facilities.
- 📊 **Standard 24-Hour ELD Daily Logs**:
  - Generates authentic 4-tier duty status charts (*Off Duty*, *Sleeper Berth*, *Driving*, *On Duty*).
  - Continuous stepped line graph with hour-by-hour totals.
  - Multi-day pagination for long-haul routes.
- 🖨️ **Print & Inspection Ready**: Dedicated print layout formatted for DOT inspections.
- 🎨 **Steep Editorial UI/UX**: Crafted with modern editorial typography, clean soft mist surfaces, pill-shaped controls, and a responsive layout.

---

## 📐 Architecture Overview

```
Spotter_Fullstack/
├── backend/                         # Django REST API
│   ├── config/                      # Project configuration & settings
│   │   ├── settings.py              # CORS, installed apps, static/media
│   │   ├── urls.py                  # Root URL dispatcher
│   │   └── wsgi.py                  # WSGI entry point
│   ├── trips/                       # Core trip planning app
│   │   ├── services/
│   │   │   ├── geocoding.py         # Nominatim + Photon fallback geocoder
│   │   │   ├── routing.py           # OSRM highway routing + haversine fallback
│   │   │   ├── hos.py               # Deterministic FMCSA HOS Engine
│   │   │   ├── stops.py             # Geo-coordinate interpolation along polyline
│   │   │   └── eld.py               # 24-hour daily ELD log generator
│   │   ├── serializers.py           # DRF request/response serializers
│   │   ├── views.py                 # PlanTripView (POST /api/trips/plan/)
│   │   ├── urls.py                  # /api/trips/ routing
│   │   └── tests.py                 # 15 comprehensive unit & integration tests
│   ├── manage.py
│   └── requirements.txt             # Python dependencies
│
└── frontend/                        # React + Vite Client
    ├── src/
    │   ├── pages/
    │   │   ├── LandingPage.jsx      # Input form, presets, HOS feature cards
    │   │   └── ResultsPage.jsx      # Map, summary cards, timeline, ELD logs
    │   ├── components/
    │   │   ├── RouteMap.jsx         # React Leaflet interactive map with markers
    │   │   ├── TripSummaryCards.jsx # 8-metric compliance summary strip
    │   │   ├── TripTimeline.jsx     # Chronological schedule with duty badges
    │   │   ├── StopsTable.jsx       # Mandatory en-route stops & dwell times
    │   │   ├── ELDLogViewer.jsx     # Multi-day log viewer & summary
    │   │   ├── ELDDayChart.jsx      # 24-hour stepped SVG duty status grid
    │   │   └── LoadingOverlay.jsx   # Step-by-step calculation progress modal
    │   ├── hooks/
    │   │   └── useTripPlanner.js    # Trip planning state machine hook
    │   ├── services/
    │   │   └── api.js               # Axios API client
    │   └── utils/
    │       └── formatters.js        # Time, distance, and badge formatters
    ├── tailwind.config.js           # Steep theme design tokens & colors
    ├── vite.config.js               # React plugin, proxy, and host config
    └── package.json
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python 3.10+** & `pip`
- **Node.js 18+** & `npm`

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create & activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Run automated tests to verify
python manage.py test trips

# Start backend server
python manage.py runserver 0.0.0.0:8000
```
Backend API will be live at: `http://localhost:8000/`

---

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend client will be live at: `http://localhost:5173/`

---

## 📡 API Reference

### `POST /api/trips/plan/`

Accepts trip route parameters and returns a complete HOS driving schedule, geographic polyline, stops, and 24-hour ELD daily logs.

#### Request Body
```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "Dallas, TX",
  "dropoff_location": "Los Angeles, CA",
  "cycle_used_hours": 20.0
}
```

#### Response (200 OK)
```json
{
  "trip_summary": {
    "distance_miles": 2404.5,
    "distance_to_pickup_miles": 967.2,
    "distance_to_dropoff_miles": 1437.3,
    "total_driving_hours": 43.72,
    "total_duration_hours": 78.72,
    "driving_days": 4,
    "rest_stops": 3,
    "fuel_stops": 2,
    "cycle_hours_used": 20.0,
    "cycle_hours_remaining": 6.28,
    "avg_speed_mph": 55
  },
  "locations": {
    "current": { "name": "Chicago, IL", "lat": 41.8781, "lon": -87.6298 },
    "pickup": { "name": "Dallas, TX", "lat": 32.7767, "lon": -96.7970 },
    "dropoff": { "name": "Los Angeles, CA", "lat": 34.0522, "lon": -118.2437 }
  },
  "route": {
    "distance_miles": 2404.5,
    "geometry": [[41.8781, -87.6298], [32.7767, -96.7970], ...]
  },
  "stops": [
    {
      "id": 1,
      "type": "break",
      "label": "30-Min Break",
      "lat": 36.1627,
      "lon": -86.7816,
      "arrival_time": "14:00",
      "departure_time": "14:30",
      "duration_minutes": 30,
      "reason": "30-minute break required after 8 cumulative driving hours"
    }
  ],
  "timeline": [...],
  "eld_logs": [
    {
      "day": 1,
      "date": "January 01, 2024",
      "segments": [
        { "status": "driving", "start_hour": 0.0, "end_hour": 8.0, "duration_hours": 8.0, "start_pct": 0.0, "width_pct": 33.33 },
        ...
      ],
      "totals": {
        "off_duty": 0.5,
        "sleeper_berth": 10.0,
        "driving": 13.5,
        "on_duty_not_driving": 0.0,
        "total_on_duty": 13.5,
        "total_hours": 24.0
      }
    }
  ]
}
```

---

## 🧪 Testing

The backend includes a comprehensive test suite in `backend/trips/tests.py`:

```bash
cd backend
python manage.py test trips
```

### Coverage:
- `test_short_trip_no_rest`: Validates trips under 11 driving hours require no rest stops.
- `test_no_drive_segment_exceeds_11_hours`: Asserts no driving segment exceeds the 11-hour FMCSA rule.
- `test_30min_break_after_8_hours`: Verifies 30-minute rest break after 8 hours cumulative driving.
- `test_rest_after_long_trip`: Verifies 10-hour consecutive rest insertion.
- `test_fuel_stops_every_1000_miles`: Ensures fueling stop at every 1,000 miles.
- `test_cycle_hours_affect_schedule`: Validates rolling 70-hour / 8-day cycle limits and 34-hour restart trigger.
- `test_each_log_has_24_hours`: Confirms all generated daily ELD logs sum exactly to 24.0 hours.
- `test_empty_location_returns_400`: Verifies robust API input validation.

---

## 🌐 Production Deployment

### Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Set Build Command to `npm run build` and Output Directory to `dist`.
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-app.onrender.com`

### Backend (Render / Railway)
1. Create a **Web Service** on [Render](https://render.com) or [Railway](https://railway.app).
2. Set Root Directory to `backend`.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
5. Set Environment Variables:
   - `DJANGO_SECRET_KEY` = `<secure-random-key>`
   - `DEBUG` = `False`
   - `ALLOWED_HOSTS` = `your-backend.onrender.com`
   - `CORS_ALLOWED_ORIGINS` = `https://your-frontend.vercel.app`
   - `CORS_ALLOW_ALL_ORIGINS` = `False`

---

## 📄 License

This project is licensed under the MIT License.
