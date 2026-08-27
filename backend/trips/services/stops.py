"""
Maps timeline events to geographic coordinates along the route polyline.
"""
from typing import List, Dict
import math

# Stop types to extract as named stops
STOP_TYPES = {'rest', 'break', 'fuel', 'pickup', 'dropoff'}


def _interpolate_point(geometry: List[List[float]], pct: float) -> List[float]:
    """
    Interpolate a lat/lon position along a polyline at percentage pct (0.0–1.0).
    geometry: list of [lat, lon]
    """
    if not geometry:
        return [0.0, 0.0]
    if pct <= 0:
        return geometry[0]
    if pct >= 1:
        return geometry[-1]

    # Compute total length
    segments = []
    total_len = 0.0
    for i in range(len(geometry) - 1):
        p1 = geometry[i]
        p2 = geometry[i + 1]
        d = math.sqrt((p2[0]-p1[0])**2 + (p2[1]-p1[1])**2)
        segments.append(d)
        total_len += d

    if total_len == 0:
        return geometry[0]

    target = pct * total_len
    accumulated = 0.0
    for i, seg_len in enumerate(segments):
        if accumulated + seg_len >= target:
            if seg_len == 0:
                return geometry[i]
            t = (target - accumulated) / seg_len
            p1 = geometry[i]
            p2 = geometry[i + 1]
            return [
                p1[0] + t * (p2[0] - p1[0]),
                p1[1] + t * (p2[1] - p1[1]),
            ]
        accumulated += seg_len

    return geometry[-1]


def assign_stop_coordinates(timeline: List[Dict], geometry: List[List[float]]) -> List[Dict]:
    """
    Extract meaningful stops from timeline and assign lat/lon coordinates.
    """
    stops = []
    stop_num = 1

    for event in timeline:
        if event['type'] not in STOP_TYPES:
            continue

        pct = event.get('route_pct', 0.0)
        coords = _interpolate_point(geometry, pct)

        stop = {
            'id': stop_num,
            'type': event['type'],
            'label': event['label'],
            'lat': round(coords[0], 6),
            'lon': round(coords[1], 6),
            'arrival_hour': event['start_hour'],
            'departure_hour': event['end_hour'],
            'duration_hours': event['duration_hours'],
            'duration_minutes': round(event['duration_hours'] * 60),
            'arrival_time': event.get('start_time', ''),
            'departure_time': event.get('end_time', ''),
            'miles_at_stop': event.get('miles_at_event', 0),
            'reason': event.get('notes', ''),
            'status': event.get('status', ''),
        }
        stops.append(stop)
        stop_num += 1

    return stops
