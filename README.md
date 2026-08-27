# SpotterELD — Truck Trip Planner & ELD Log Generator

A production-quality full-stack web application for professional truck drivers. Enter your trip details and get a legally-compliant FMCSA Hours of Service schedule, interactive route map, and auto-generated ELD daily logs — all in seconds.

---

## Features

- 🗺️ **Real routing** via OSRM (OpenStreetMap) — no paid API key required
- 📋 **HOS-compliant scheduling** — 11hr drive limit, 14hr window, 30-min breaks, 10hr rest, 70hr/8-day cycle
- ⛽ **Automatic fuel stops** every 1,000 miles
- 📦 **Pickup & dropoff** handling (1 hour each)
- 📊 **ELD daily log generation** — SVG 24-hour grid charts, one per driving day
- 🖨️ **Print-ready ELD logs** — CSS print styles included
- 📱 **Responsive SaaS-style UI** — Tailwind CSS, clean dashboard design

---

## Architecture

```
truck-eld-planner/
├── backend/               Django 6 REST API
│   ├── config/            Django project settings
│   ├── trips/             Main app
│   │   └── services/
│   │       ├── geocoding.py   Nominatim + Photon fallback
│   │       ├── routing.py     OSRM + haversine fallback
│   │       ├── hos.py         HOS scheduling engine
│   │       ├── stops.py       Stop geo-interpolation
│   │       └── eld.py         ELD log generator
│   └── requirements.txt
└── frontend/              React + Vite
    └── src/
        ├── pages/         LandingPage, ResultsPage
        ├── components/    Map, Timeline, ELD charts, etc.
        ├── hooks/         useTripPlanner
        └── services/      API client
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Leaflet |
| Backend | Python 3.12, Django 6, Django REST Framework |
| Database | SQLite (dev), PostgreSQL (prod) |
| Geocoding | Nominatim (OSM) + Photon fallback |
| Routing | OSRM public API + haversine fallback |
| Maps | Leaflet + OpenStreetMap tiles |
| Icons | Lucide React |

---

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip, npm

### Backend

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env if needed

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver 8000
```

Backend runs at: `http://localhost:8000`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit VITE_API_URL if backend is on a different port

# Start dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | dev key | Django secret key |
| `DEBUG` | `True` | Debug mode |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Allowed hosts |
| `CORS_ALLOW_ALL_ORIGINS` | `True` | Allow all CORS origins (dev) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Specific allowed origins (prod) |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL |

---

## API Documentation

### `POST /api/trips/plan/`

**Request:**
```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "Dallas, TX",
  "dropoff_location": "Los Angeles, CA",
  "cycle_used_hours": 20
}
```

**Response:**
```json
{
  "trip_summary": {
    "distance_miles": 2404.5,
    "total_driving_hours": 43.72,
    "total_duration_hours": 78.72,
    "driving_days": 4,
    "rest_stops": 3,
    "fuel_stops": 2,
    "cycle_hours_remaining": 6.28,
    "avg_speed_mph": 55
  },
  "locations": { "current": {...}, "pickup": {...}, "dropoff": {...} },
  "route": { "geometry": [[lat, lon], ...], "distance_miles": 2404.5 },
  "stops": [{ "type", "label", "lat", "lon", "arrival_time", "duration_minutes", ... }],
  "timeline": [{ "type", "label", "start_time", "end_time", "duration_hours", ... }],
  "eld_logs": [{ "day", "date", "segments": [...], "totals": {...} }]
}
```

**Validation errors** return HTTP 400. **Geocoding failures** return HTTP 422.

---

## Running Tests

```bash
cd backend
python manage.py test trips
```

Tests cover:
- HOS 11-hour driving limit
- 14-hour duty window
- 30-minute break after 8 cumulative hours
- 10-hour rest insertion
- 70-hour/8-day cycle limits
- Fuel stop generation
- Multi-day ELD log generation
- API endpoint validation

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
# Set VITE_API_URL to your backend URL
```

Or connect your GitHub repo to Vercel and set the root directory to `frontend/`.

### Backend → Render / Railway

1. Create a new Web Service
2. Set root directory to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
5. Set environment variables:
   - `DJANGO_SECRET_KEY` — generate a new secret key
   - `DEBUG=False`
   - `ALLOWED_HOSTS=your-backend-domain.onrender.com`
   - `CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app`
   - `CORS_ALLOW_ALL_ORIGINS=False`

---

## HOS Assumptions

All scheduling follows **FMCSA property-carrying vehicle regulations**:

| Rule | Value |
|------|-------|
| Driving limit per shift | 11 hours |
| On-duty window per shift | 14 hours |
| Required rest between shifts | 10 consecutive hours |
| Break after cumulative drive | 30 min after 8 hours |
| Weekly cycle | 70 hours / 8 days |
| Cycle reset | 34-hour restart |
| Average truck speed | 55 mph |
| Fuel stop interval | Every 1,000 miles (30 min) |
| Pickup duration | 1 hour |
| Dropoff duration | 1 hour |

---

## Known Limitations

- Geocoding uses Nominatim (rate-limited to 1 req/sec) with Photon as fallback — very unusual location strings may fail
- OSRM public demo server may occasionally be slow; haversine straight-line fallback applies automatically
- Schedule starts at 06:00 AM on Day 1 (configurable in `hos.py`)
- Real-world traffic, weather, and state regulations are not modeled
- Fuel stop locations are interpolated along the route polyline, not actual truck stops

---

## Screenshots

_Add screenshots of the landing page, results dashboard, route map, and ELD logs here._

---

## Demo Flow (3–5 min)

1. Open `http://localhost:5173`
2. Enter: **Chicago, IL** / **Dallas, TX** / **Los Angeles, CA** / **20** hrs
3. Click **PLAN TRIP**
4. Watch the step-by-step loading progress
5. View the interactive route map with all stops
6. Check the trip summary cards
7. Browse the timeline and stops table
8. Click through ELD log tabs (4 days for this route)
9. Click **Print ELD Logs**
