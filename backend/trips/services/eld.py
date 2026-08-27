"""
ELD Log Generator

Takes a timeline of events and produces one ELD log per calendar day.
Each log contains 24-hour segments for the four duty statuses:
  - off_duty
  - sleeper_berth
  - driving
  - on_duty_not_driving
"""
from typing import List, Dict
from datetime import datetime, timedelta
import math

STATUS_MAP = {
    'driving': 'driving',
    'rest': 'sleeper_berth',
    'restart': 'off_duty',
    'break': 'off_duty',
    'fuel': 'on_duty_not_driving',
    'pickup': 'on_duty_not_driving',
    'dropoff': 'on_duty_not_driving',
    'start': 'on_duty_not_driving',
    'end': 'off_duty',
}


def generate_eld_logs(timeline: List[Dict]) -> List[Dict]:
    """
    Generate one ELD log per calendar day.
    Day boundaries are at 0, 24, 48, ... hours from trip start.
    """
    if not timeline:
        return []

    # Find total duration
    last_end = max(e['end_hour'] for e in timeline)
    num_days = math.ceil(last_end / 24) if last_end > 0 else 1
    num_days = max(num_days, 1)

    base_dt = datetime(2024, 1, 1, 6, 0, 0)

    logs = []
    for day_idx in range(num_days):
        day_start = day_idx * 24.0
        day_end = day_start + 24.0
        
        # Date label
        day_dt = base_dt + timedelta(days=day_idx)
        date_str = day_dt.strftime('%B %d, %Y')

        # Collect segments for this day
        segments = []
        totals = {
            'off_duty': 0.0,
            'sleeper_berth': 0.0,
            'driving': 0.0,
            'on_duty_not_driving': 0.0,
        }

        # Start with off-duty if there's a gap before first event
        prev_end = day_start

        # Get all events that overlap this day
        day_events = []
        for event in timeline:
            es = event['start_hour']
            ee = event['end_hour']
            # Clip to this day
            cs = max(es, day_start)
            ce = min(ee, day_end)
            if ce > cs + 0.001:  # at least 1 minute
                day_events.append({
                    'status': STATUS_MAP.get(event['type'], 'off_duty'),
                    'start': cs,
                    'end': ce,
                    'label': event['label'],
                    'type': event['type'],
                })

        # Sort by start time
        day_events.sort(key=lambda x: x['start'])

        # Fill gaps with off-duty
        filled = []
        cursor = day_start
        for ev in day_events:
            if ev['start'] > cursor + 0.001:
                # Gap — fill with off-duty
                filled.append({
                    'status': 'off_duty',
                    'start': cursor,
                    'end': ev['start'],
                    'label': 'Off Duty',
                    'type': 'off_duty',
                })
            filled.append(ev)
            cursor = max(cursor, ev['end'])

        # Fill remaining day with off-duty
        if cursor < day_end - 0.001:
            filled.append({
                'status': 'off_duty',
                'start': cursor,
                'end': day_end,
                'label': 'Off Duty',
                'type': 'off_duty',
            })

        # Convert to segments with hours-within-day (0..24)
        for seg in filled:
            start_in_day = seg['start'] - day_start
            end_in_day = seg['end'] - day_start
            duration = end_in_day - start_in_day
            if duration < 0.001:
                continue

            segment = {
                'status': seg['status'],
                'label': seg['label'],
                'start_hour': round(start_in_day, 4),
                'end_hour': round(end_in_day, 4),
                'duration_hours': round(duration, 4),
                'start_pct': round(start_in_day / 24 * 100, 2),
                'width_pct': round(duration / 24 * 100, 2),
            }
            segments.append(segment)

            # Accumulate totals
            status = seg['status']
            if status in totals:
                totals[status] += duration

        total_on_duty = totals['driving'] + totals['on_duty_not_driving']

        logs.append({
            'day': day_idx + 1,
            'date': date_str,
            'day_start_hour': day_start,
            'segments': segments,
            'totals': {
                'off_duty': round(totals['off_duty'], 2),
                'sleeper_berth': round(totals['sleeper_berth'], 2),
                'driving': round(totals['driving'], 2),
                'on_duty_not_driving': round(totals['on_duty_not_driving'], 2),
                'total_on_duty': round(total_on_duty, 2),
                'total_hours': 24.0,
            },
        })

    return logs
