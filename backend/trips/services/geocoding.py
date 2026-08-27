import requests
import time
from typing import Dict

NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
PHOTON_URL = 'https://photon.komoot.io/api/'

# Nominatim requires a descriptive User-Agent identifying the application
NOMINATIM_HEADERS = {
    'User-Agent': 'SpotterELD-TruckTripPlanner/1.0 (+https://github.com/spotter-eld; ops@spottereld.app)',
    'Accept-Language': 'en',
    'Referer': 'https://spottereld.app',
}

PHOTON_HEADERS = {
    'User-Agent': 'SpotterELD-TruckTripPlanner/1.0',
}


def _geocode_nominatim(location: str) -> Dict:
    """Try geocoding via Nominatim."""
    params = {
        'q': location,
        'format': 'json',
        'limit': 1,
        'addressdetails': 1,
        'countrycodes': 'us,ca,mx',  # Focus on North America for truck routes
    }
    resp = requests.get(NOMINATIM_URL, params=params, headers=NOMINATIM_HEADERS, timeout=12)
    resp.raise_for_status()
    results = resp.json()
    if not results:
        raise ValueError(f"Not found via Nominatim")
    r = results[0]
    return {
        'name': location,
        'display_name': r.get('display_name', location),
        'lat': float(r['lat']),
        'lon': float(r['lon']),
    }


def _geocode_photon(location: str) -> Dict:
    """Fallback geocoding via Photon (OpenStreetMap-based, no key required)."""
    params = {
        'q': location,
        'limit': 1,
        'lang': 'en',
    }
    resp = requests.get(PHOTON_URL, params=params, headers=PHOTON_HEADERS, timeout=12)
    resp.raise_for_status()
    data = resp.json()
    features = data.get('features', [])
    if not features:
        raise ValueError(f"Not found via Photon")
    feat = features[0]
    coords = feat['geometry']['coordinates']  # [lon, lat]
    props = feat.get('properties', {})
    display = ', '.join(filter(None, [
        props.get('name', ''),
        props.get('city', props.get('town', props.get('village', ''))),
        props.get('state', ''),
        props.get('country', ''),
    ]))
    return {
        'name': location,
        'display_name': display or location,
        'lat': float(coords[1]),
        'lon': float(coords[0]),
    }


def geocode(location: str) -> Dict:
    """
    Geocode a location string using Nominatim with Photon as fallback.
    Returns dict with lat, lon, display_name.
    Raises ValueError if location not found via both services.
    """
    # Try Nominatim first
    try:
        result = _geocode_nominatim(location)
        time.sleep(0.5)  # Nominatim rate limit: max 1 req/sec
        return result
    except Exception as nominatim_err:
        pass  # Fall through to Photon

    # Fallback: Photon
    try:
        result = _geocode_photon(location)
        return result
    except Exception as photon_err:
        raise ValueError(
            f"Could not geocode '{location}'. "
            f"Please use a more specific location (e.g., 'Chicago, IL' or 'Dallas, TX')."
        )
