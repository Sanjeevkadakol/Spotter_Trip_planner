import requests
import math
from typing import Dict, List, Tuple

OSRM_URL = 'https://router.project-osrm.org/route/v1/driving'


def _haversine_miles(lat1, lon1, lat2, lon2) -> float:
    """Straight-line distance in miles between two lat/lon points."""
    R = 3958.8  # Earth radius in miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def _interpolate_geometry(start: Dict, end: Dict, num_points: int = 10) -> List[List[float]]:
    """Generate a simple straight-line geometry as fallback."""
    points = []
    for i in range(num_points + 1):
        t = i / num_points
        lat = start['lat'] + t * (end['lat'] - start['lat'])
        lon = start['lon'] + t * (end['lon'] - start['lon'])
        points.append([lat, lon])
    return points


def get_route(origin: Dict, destination: Dict) -> Dict:
    """
    Get driving route from origin to destination.
    Uses OSRM public API; falls back to haversine straight-line if API fails.
    Returns: {distance_miles, duration_hours, geometry: [[lat, lon], ...]}
    """
    coords = f"{origin['lon']},{origin['lat']};{destination['lon']},{destination['lat']}"
    url = f"{OSRM_URL}/{coords}"
    params = {
        'overview': 'full',
        'geometries': 'geojson',
        'steps': 'false',
    }

    try:
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        if data.get('code') != 'Ok' or not data.get('routes'):
            raise ValueError('OSRM returned no routes')

        route = data['routes'][0]
        distance_meters = route['distance']
        duration_seconds = route['duration']
        # GeoJSON geometry coords are [lon, lat] — convert to [lat, lon] for Leaflet
        geojson_coords = route['geometry']['coordinates']
        geometry = [[c[1], c[0]] for c in geojson_coords]

        return {
            'distance_miles': distance_meters * 0.000621371,
            'duration_hours': duration_seconds / 3600,
            'geometry': geometry,
            'source': 'osrm',
        }

    except Exception as e:
        # Fallback: haversine with 1.3x road factor
        straight_miles = _haversine_miles(
            origin['lat'], origin['lon'],
            destination['lat'], destination['lon']
        )
        road_miles = straight_miles * 1.3  # approximate road distance
        geometry = _interpolate_geometry(origin, destination, 20)
        return {
            'distance_miles': road_miles,
            'duration_hours': road_miles / 55,  # 55 mph avg
            'geometry': geometry,
            'source': 'fallback',
            'fallback_reason': str(e),
        }
