"""
HOS (Hours of Service) Scheduling Engine

Implements FMCSA property-carrying driver rules:
- 11-hour driving limit per shift
- 14-hour on-duty window per shift
- 10-hour consecutive off-duty required before new shift
- 30-minute break required after 8 cumulative hours of driving
- 70-hour / 8-day rolling on-duty limit
- Fuel stops at least every 1,000 miles
- Pickup: 1 hour on-duty not driving
- Dropoff: 1 hour on-duty not driving

Average truck speed: 55 mph
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import math

AVG_SPEED_MPH = 55.0
MAX_DRIVE_PER_SHIFT = 11.0       # hours
MAX_DUTY_WINDOW = 14.0           # hours from shift start
REQUIRED_OFF_DUTY = 10.0         # consecutive hours
BREAK_AFTER_DRIVE = 8.0          # cumulative drive hours before break
BREAK_DURATION = 0.5             # 30 minutes
MAX_CYCLE_HOURS = 70.0           # 70-hr/8-day
FUEL_INTERVAL_MILES = 1000.0     # max miles between fuel stops
FUEL_STOP_DURATION = 0.5         # 30 minutes
PICKUP_DURATION = 1.0            # 1 hour
DROPOFF_DURATION = 1.0           # 1 hour
RESTART_HOURS = 34.0             # 34-hr cycle restart


def _fmt_time(hour: float) -> str:
    """Convert decimal hour offset from trip start to HH:MM string."""
    total_minutes = int(round(hour * 60))
    days = total_minutes // (24 * 60)
    remaining = total_minutes % (24 * 60)
    h = remaining // 60
    m = remaining % 60
    day_str = f" (Day {days + 1})" if days > 0 else ""
    return f"{h:02d}:{m:02d}{day_str}"


def _hour_to_datetime(base: datetime, offset_hours: float) -> datetime:
    return base + timedelta(hours=offset_hours)


class HOSEngine:
    """
    Schedules a trip in compliance with FMCSA HOS rules.
    
    Usage:
        engine = HOSEngine(cycle_used_hours=20)
        timeline = engine.plan(route_to_pickup, route_to_dropoff, ...)
    """

    def __init__(self, cycle_used_hours: float = 0.0):
        # Cumulative on-duty hours already used in the current 8-day cycle
        self.cycle_used = min(cycle_used_hours, MAX_CYCLE_HOURS)
        self.cycle_remaining = MAX_CYCLE_HOURS - self.cycle_used

    def plan(
        self,
        route_to_pickup: Dict,
        route_to_dropoff: Dict,
        current_geo: Dict,
        pickup_geo: Dict,
        dropoff_geo: Dict,
    ) -> List[Dict]:
        """
        Generate a full timeline of events for the trip.
        Returns list of event dicts.
        """
        timeline = []
        
        # Trip-relative time clock (hours from trip start = 0)
        # We use a base date of "Day 1 06:00 AM" for display
        base_dt = datetime(2024, 1, 1, 6, 0, 0)  # arbitrary start

        # State variables
        t = 0.0                      # current time (hours from trip start)
        shift_start = 0.0            # time current shift started
        drive_this_shift = 0.0       # driving hours in current shift
        duty_this_shift = 0.0        # on-duty hours in current shift (driving + not driving)
        drive_since_break = 0.0      # cumulative driving since last 30-min break
        cycle_on_duty = self.cycle_used  # rolling 70hr cycle total
        miles_since_fuel = 0.0       # miles since last fuel stop
        total_miles_driven = 0.0
        on_shift = True              # currently in an active shift

        # Route segments
        leg1_miles = route_to_pickup['distance_miles']
        leg2_miles = route_to_dropoff['distance_miles']
        total_miles = leg1_miles + leg2_miles

        # Add trip start event
        timeline.append({
            'type': 'start',
            'label': 'Trip Start',
            'start_hour': 0.0,
            'end_hour': 0.0,
            'duration_hours': 0.0,
            'miles_at_event': 0.0,
            'start_time': _fmt_time(0.0),
            'end_time': _fmt_time(0.0),
            'datetime_start': _hour_to_datetime(base_dt, 0.0).isoformat(),
            'datetime_end': _hour_to_datetime(base_dt, 0.0).isoformat(),
            'notes': f'Starting from {current_geo["name"]}. Cycle hours available: {self.cycle_remaining:.1f}h',
            'status': 'on_duty_not_driving',
            'route_pct': 0.0,
        })


        def add_event(event_type, label, start, end, notes='', status='driving', route_pct=0.0):
            timeline.append({
                'type': event_type,
                'label': label,
                'start_hour': round(start, 4),
                'end_hour': round(end, 4),
                'duration_hours': round(end - start, 4),
                'miles_at_event': round(total_miles_driven, 1),
                'start_time': _fmt_time(start),
                'end_time': _fmt_time(end),
                'datetime_start': _hour_to_datetime(base_dt, start).isoformat(),
                'datetime_end': _hour_to_datetime(base_dt, end).isoformat(),
                'notes': notes,
                'status': status,  # off_duty, sleeper_berth, driving, on_duty_not_driving
                'route_pct': round(route_pct, 4),  # 0.0 to 1.0 position along full route
            })

        def get_route_pct():
            return total_miles_driven / total_miles if total_miles > 0 else 0.0

        def do_rest(reason='Required 10-hour rest period'):
            nonlocal t, shift_start, drive_this_shift, duty_this_shift
            nonlocal drive_since_break, on_shift
            rest_start = t
            rest_end = t + REQUIRED_OFF_DUTY
            add_event('rest', '10-Hour Rest', rest_start, rest_end,
                      notes=reason, status='sleeper_berth',
                      route_pct=get_route_pct())
            t = rest_end
            shift_start = t
            drive_this_shift = 0.0
            duty_this_shift = 0.0
            drive_since_break = 0.0
            on_shift = True

        def do_break(reason='30-minute break required after 8 cumulative driving hours'):
            nonlocal t, duty_this_shift, drive_since_break
            break_start = t
            break_end = t + BREAK_DURATION
            add_event('break', '30-Min Break', break_start, break_end,
                      notes=reason, status='off_duty',
                      route_pct=get_route_pct())
            t = break_end
            duty_this_shift += BREAK_DURATION
            drive_since_break = 0.0
            # Check if 30-min break ate into duty window
            _check_duty_window()

        def _check_duty_window():
            nonlocal t
            time_on_duty = t - shift_start
            if time_on_duty >= MAX_DUTY_WINDOW:
                do_rest('14-hour duty window reached')

        def do_fuel():
            nonlocal t, duty_this_shift, cycle_on_duty, miles_since_fuel
            fuel_start = t
            fuel_end = t + FUEL_STOP_DURATION
            add_event('fuel', 'Fuel Stop', fuel_start, fuel_end,
                      notes=f'Fuel stop at {round(total_miles_driven, 0):.0f} miles (every {FUEL_INTERVAL_MILES:.0f} mi minimum)',
                      status='on_duty_not_driving',
                      route_pct=get_route_pct())
            t = fuel_end
            duty_this_shift += FUEL_STOP_DURATION
            cycle_on_duty += FUEL_STOP_DURATION
            miles_since_fuel = 0.0
            # Re-check duty window
            _check_duty_window()

        def drive_segment(miles_to_drive: float) -> float:
            """
            Drive up to miles_to_drive miles, inserting required stops as needed.
            Returns actual miles driven.
            """
            nonlocal t, drive_this_shift, duty_this_shift, drive_since_break
            nonlocal cycle_on_duty, miles_since_fuel, total_miles_driven

            miles_remaining = miles_to_drive

            while miles_remaining > 0.001:
                # --- Check cycle limit ---
                if cycle_on_duty >= MAX_CYCLE_HOURS:
                    # Cycle exhausted — 34-hr restart (treated as extended rest)
                    restart_start = t
                    restart_end = t + RESTART_HOURS
                    add_event('restart', '34-Hour Restart',
                              restart_start, restart_end,
                              notes='70-hour/8-day cycle limit reached. 34-hour restart required.',
                              status='off_duty',
                              route_pct=get_route_pct())
                    t = restart_end
                    cycle_on_duty = 0.0
                    shift_start_ref = t
                    drive_this_shift = 0.0
                    duty_this_shift = 0.0
                    drive_since_break = 0.0

                # --- Check 14-hour duty window ---
                time_in_window = t - shift_start
                hours_left_in_window = MAX_DUTY_WINDOW - time_in_window
                if hours_left_in_window <= 0:
                    do_rest('14-hour on-duty window reached')
                    continue

                # --- Check 11-hour drive limit ---
                drive_hours_left = MAX_DRIVE_PER_SHIFT - drive_this_shift
                if drive_hours_left <= 0:
                    do_rest('11-hour driving limit reached')
                    continue

                # --- Check 30-min break need ---
                drive_until_break = BREAK_AFTER_DRIVE - drive_since_break
                if drive_until_break <= 0:
                    do_break()
                    continue

                # --- Check fuel stop ---
                miles_until_fuel = FUEL_INTERVAL_MILES - miles_since_fuel
                if miles_until_fuel <= 0.001:
                    do_fuel()
                    continue

                # --- Calculate max we can drive before next constraint ---
                # Max hours limited by: drive limit, duty window, break need
                max_drive_hours = min(
                    drive_hours_left,
                    hours_left_in_window,
                    drive_until_break,
                )
                # Max miles limited by: time and fuel
                max_drive_miles = min(
                    max_drive_hours * AVG_SPEED_MPH,
                    miles_until_fuel,
                    miles_remaining,
                )

                if max_drive_miles <= 0.001:
                    # Edge case: need a stop before driving
                    if drive_until_break <= 0:
                        do_break()
                    elif hours_left_in_window <= 0:
                        do_rest('14-hour window')
                    elif drive_hours_left <= 0:
                        do_rest('11-hour limit')
                    else:
                        do_fuel()
                    continue

                # Drive the segment
                actual_hours = max_drive_miles / AVG_SPEED_MPH
                seg_start = t
                seg_end = t + actual_hours

                add_event('driving', 'Driving',
                          seg_start, seg_end,
                          notes=f'Driving {max_drive_miles:.1f} miles at {AVG_SPEED_MPH:.0f} mph',
                          status='driving',
                          route_pct=get_route_pct())

                t = seg_end
                drive_this_shift += actual_hours
                duty_this_shift += actual_hours
                drive_since_break += actual_hours
                cycle_on_duty += actual_hours
                miles_since_fuel += max_drive_miles
                total_miles_driven += max_drive_miles
                miles_remaining -= max_drive_miles

            return miles_to_drive - miles_remaining

        # === Execute the trip ===

        # Leg 1: Current location → Pickup
        if leg1_miles > 0:
            drive_segment(leg1_miles)

        # Pickup (1 hour on-duty not driving)
        pickup_start = t
        pickup_end = t + PICKUP_DURATION
        add_event('pickup', 'Pickup',
                  pickup_start, pickup_end,
                  notes=f'1-hour pickup at {pickup_geo["name"]}',
                  status='on_duty_not_driving',
                  route_pct=leg1_miles / total_miles if total_miles > 0 else 0.5)
        t = pickup_end
        duty_this_shift += PICKUP_DURATION
        cycle_on_duty += PICKUP_DURATION

        # Check duty window after pickup
        _check_duty_window()

        # Leg 2: Pickup → Dropoff
        if leg2_miles > 0:
            drive_segment(leg2_miles)

        # Dropoff (1 hour on-duty not driving)
        dropoff_start = t
        dropoff_end = t + DROPOFF_DURATION
        add_event('dropoff', 'Dropoff',
                  dropoff_start, dropoff_end,
                  notes=f'1-hour dropoff at {dropoff_geo["name"]}',
                  status='on_duty_not_driving',
                  route_pct=1.0)
        t = dropoff_end

        # End of trip
        add_event('end', 'Trip Complete',
                  dropoff_end, dropoff_end,
                  notes=f'Trip complete. Total time: {_fmt_time(dropoff_end)}. '
                        f'Total miles: {round(total_miles, 0):.0f}',
                  status='off_duty',
                  route_pct=1.0)

        return timeline
