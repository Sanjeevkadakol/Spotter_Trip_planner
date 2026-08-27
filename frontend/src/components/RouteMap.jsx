import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeCircleIcon(color, borderColor = '#ffffff', size = 14) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid ${borderColor};border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.25)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  })
}

function makeLocationIcon(bgColor, letter) {
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;background:${bgColor};border:2px solid #ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25);font-weight:600;color:#ffffff;font-size:12px;font-family:sans-serif">${letter}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

const stopIcons = {
  rest: makeCircleIcon('#5d2a1a', '#fbe1d1', 16),
  break: makeCircleIcon('#979799', '#ffffff', 14),
  fuel: makeCircleIcon('#f97316', '#ffffff', 14),
  pickup: makeCircleIcon('#17191c', '#ffffff', 16),
  dropoff: makeCircleIcon('#17191c', '#ffffff', 16),
}

function BoundsAdjuster({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      try {
        const bounds = L.latLngBounds(positions)
        map.fitBounds(bounds, { padding: [40, 40] })
      } catch (e) {}
    }
  }, [positions, map])
  return null
}

export default function RouteMap({ route, locations, stops }) {
  const geometry = route?.geometry || []
  const allPositions = geometry.length > 0 ? geometry : [
    [locations.current.lat, locations.current.lon],
    [locations.pickup.lat, locations.pickup.lon],
    [locations.dropoff.lat, locations.dropoff.lon],
  ]

  const center = allPositions[Math.floor(allPositions.length / 2)] || [39.5, -98.35]

  return (
    <div className="relative h-full font-sans">
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geometry.length > 1 && (
          <Polyline
            positions={geometry}
            color="#17191c"
            weight={4}
            opacity={0.85}
          />
        )}

        <BoundsAdjuster positions={allPositions} />

        {/* Main location markers */}
        <Marker position={[locations.current.lat, locations.current.lon]} icon={makeLocationIcon('#17191c', 'S')}>
          <Popup>
            <div className="p-1">
              <strong className="text-xs font-semibold">Start Location:</strong>
              <div className="text-xs text-gray-600 mt-0.5">{locations.current.name}</div>
            </div>
          </Popup>
        </Marker>

        <Marker position={[locations.pickup.lat, locations.pickup.lon]} icon={makeLocationIcon('#5d2a1a', 'P')}>
          <Popup>
            <div className="p-1">
              <strong className="text-xs font-semibold">Pickup:</strong>
              <div className="text-xs text-gray-600 mt-0.5">{locations.pickup.name} (1h dwell)</div>
            </div>
          </Popup>
        </Marker>

        <Marker position={[locations.dropoff.lat, locations.dropoff.lon]} icon={makeLocationIcon('#17191c', 'D')}>
          <Popup>
            <div className="p-1">
              <strong className="text-xs font-semibold">Dropoff:</strong>
              <div className="text-xs text-gray-600 mt-0.5">{locations.dropoff.name} (1h dwell)</div>
            </div>
          </Popup>
        </Marker>

        {/* Stop markers */}
        {stops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lon]}
            icon={stopIcons[stop.type] || makeCircleIcon('#979799', '#ffffff', 12)}
          >
            <Popup>
              <div className="p-1">
                <div className="font-semibold text-xs text-[#17191c]">{stop.label}</div>
                <div className="text-[11px] text-gray-600 mt-0.5">Arrival: {stop.arrival_time}</div>
                <div className="text-[11px] text-gray-600">Duration: {stop.duration_minutes} min</div>
                <div className="text-[11px] text-gray-500 mt-1">{stop.reason}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Steep Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-[16px] border border-[#ececec] shadow-artifact p-3.5">
        <p className="text-[10px] uppercase tracking-wider font-medium text-[#979799] mb-2.5">Map Legend</p>
        <div className="space-y-1.5">
          {[
            { color: '#17191c', label: 'Start / Dropoff', type: 'circle' },
            { color: '#5d2a1a', label: 'Pickup', type: 'circle' },
            { color: '#5d2a1a', label: '10h Rest Stop', type: 'dot' },
            { color: '#f97316', label: 'Fuel Stop (1,000 mi)', type: 'dot' },
            { color: '#979799', label: '30-Min Rest Break', type: 'dot' },
            { color: '#17191c', label: 'Computed Highway', type: 'line' },
          ].map(({ color, label, type }) => (
            <div key={label} className="flex items-center gap-2">
              {type === 'line' ? (
                <div className="w-4 h-0.5 rounded" style={{ backgroundColor: color }} />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full border border-white shadow-xs shrink-0" style={{ backgroundColor: color }} />
              )}
              <span className="text-[11px] text-[#777b86] font-normal">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

