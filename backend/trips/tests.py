from django.test import TestCase, Client
from django.urls import reverse
from .services.hos import HOSEngine, MAX_DRIVE_PER_SHIFT, MAX_DUTY_WINDOW, BREAK_AFTER_DRIVE, MAX_CYCLE_HOURS
from .services.eld import generate_eld_logs
from .services.geocoding import geocode
import json


def make_route(miles):
    """Helper: create a mock route dict."""
    return {
        'distance_miles': miles,
        'duration_hours': miles / 55,
        'geometry': [[41.0, -87.0], [32.0, -96.0]],
        'source': 'test',
    }


def make_geo(name, lat, lon):
    return {'name': name, 'display_name': name, 'lat': lat, 'lon': lon}


class HOSEngineTests(TestCase):
    def _run_trip(self, leg1, leg2, cycle_used=0):
        engine = HOSEngine(cycle_used_hours=cycle_used)
        return engine.plan(
            route_to_pickup=make_route(leg1),
            route_to_dropoff=make_route(leg2),
            current_geo=make_geo('A', 41.0, -87.0),
            pickup_geo=make_geo('B', 35.0, -90.0),
            dropoff_geo=make_geo('C', 34.0, -118.0),
        )

    def _driving_hours(self, timeline):
        return sum(e['duration_hours'] for e in timeline if e['type'] == 'driving')

    def _rest_events(self, timeline):
        return [e for e in timeline if e['type'] == 'rest']

    def _fuel_events(self, timeline):
        return [e for e in timeline if e['type'] == 'fuel']

    def test_short_trip_no_rest(self):
        """A 100-mile trip should complete without any rest stops."""
        timeline = self._run_trip(50, 50)
        rests = self._rest_events(timeline)
        self.assertEqual(len(rests), 0)

    def test_no_drive_segment_exceeds_11_hours(self):
        """No individual driving segment should exceed 11 hours."""
        timeline = self._run_trip(500, 500)
        for event in timeline:
            if event['type'] == 'driving':
                self.assertLessEqual(
                    event['duration_hours'], MAX_DRIVE_PER_SHIFT + 0.001,
                    f"Driving segment exceeds 11h: {event['duration_hours']:.2f}h"
                )

    def test_30min_break_after_8_hours(self):
        """A break should appear after ~8 hours of cumulative driving."""
        timeline = self._run_trip(500, 500)
        breaks = [e for e in timeline if e['type'] == 'break']
        self.assertGreater(len(breaks), 0, "Expected at least one 30-min break")

    def test_rest_after_long_trip(self):
        """A 2000+ mile trip should require rest stops."""
        timeline = self._run_trip(1000, 1000)
        rests = self._rest_events(timeline)
        self.assertGreater(len(rests), 0, "Expected rest stops for long trip")

    def test_fuel_stops_every_1000_miles(self):
        """Fuel stops should appear at least every 1000 miles."""
        timeline = self._run_trip(600, 600)
        fuel_events = self._fuel_events(timeline)
        self.assertGreater(len(fuel_events), 0, "Expected at least one fuel stop for 1200-mile trip")

    def test_pickup_and_dropoff_present(self):
        """Timeline must include pickup and dropoff events."""
        timeline = self._run_trip(200, 200)
        types = [e['type'] for e in timeline]
        self.assertIn('pickup', types)
        self.assertIn('dropoff', types)

    def test_cycle_hours_affect_schedule(self):
        """High cycle hours should force earlier stops than fresh driver."""
        fresh = self._run_trip(400, 400, cycle_used=0)
        tired = self._run_trip(400, 400, cycle_used=65)
        # Tired driver should have more stops or restarts
        fresh_stops = len([e for e in fresh if e['type'] in ('rest', 'restart')])
        tired_stops = len([e for e in tired if e['type'] in ('rest', 'restart')])
        self.assertGreaterEqual(tired_stops, fresh_stops)

    def test_timeline_is_chronological(self):
        """Events must be in chronological order."""
        timeline = self._run_trip(300, 300)
        for i in range(1, len(timeline)):
            self.assertGreaterEqual(
                timeline[i]['start_hour'],
                timeline[i-1]['start_hour'] - 0.001,
                f"Timeline not chronological at index {i}"
            )

    def test_multi_day_trip(self):
        """A very long trip should span multiple days."""
        timeline = self._run_trip(800, 800)
        last_end = max(e['end_hour'] for e in timeline)
        self.assertGreater(last_end, 24, "Expected trip to span multiple days")


class ELDLogTests(TestCase):
    def _make_simple_timeline(self):
        return [
            {'type': 'start', 'label': 'Start', 'start_hour': 0, 'end_hour': 0,
             'duration_hours': 0, 'status': 'on_duty_not_driving', 'notes': '', 'route_pct': 0,
             'start_time': '06:00', 'end_time': '06:00', 'miles_at_event': 0,
             'datetime_start': '', 'datetime_end': ''},
            {'type': 'driving', 'label': 'Driving', 'start_hour': 0, 'end_hour': 8,
             'duration_hours': 8, 'status': 'driving', 'notes': '', 'route_pct': 0.5,
             'start_time': '06:00', 'end_time': '14:00', 'miles_at_event': 440,
             'datetime_start': '', 'datetime_end': ''},
            {'type': 'rest', 'label': '10-Hour Rest', 'start_hour': 8, 'end_hour': 18,
             'duration_hours': 10, 'status': 'sleeper_berth', 'notes': '', 'route_pct': 0.5,
             'start_time': '14:00', 'end_time': '00:00 (Day 2)', 'miles_at_event': 440,
             'datetime_start': '', 'datetime_end': ''},
        ]

    def test_generates_at_least_one_log(self):
        logs = generate_eld_logs(self._make_simple_timeline())
        self.assertGreater(len(logs), 0)

    def test_each_log_has_24_hours(self):
        logs = generate_eld_logs(self._make_simple_timeline())
        for log in logs:
            total = sum(s['duration_hours'] for s in log['segments'])
            self.assertAlmostEqual(total, 24.0, places=1)

    def test_log_has_required_fields(self):
        logs = generate_eld_logs(self._make_simple_timeline())
        log = logs[0]
        self.assertIn('day', log)
        self.assertIn('date', log)
        self.assertIn('segments', log)
        self.assertIn('totals', log)


class APIEndpointTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_missing_fields_returns_400(self):
        resp = self.client.post(
            '/api/trips/plan/',
            data=json.dumps({'current_location': 'Chicago, IL'}),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 400)

    def test_invalid_cycle_hours_returns_400(self):
        resp = self.client.post(
            '/api/trips/plan/',
            data=json.dumps({
                'current_location': 'Chicago, IL',
                'pickup_location': 'Dallas, TX',
                'dropoff_location': 'Los Angeles, CA',
                'cycle_used_hours': 75,  # Over 70
            }),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 400)

    def test_empty_location_returns_400(self):
        resp = self.client.post(
            '/api/trips/plan/',
            data=json.dumps({
                'current_location': '',
                'pickup_location': 'Dallas, TX',
                'dropoff_location': 'Los Angeles, CA',
                'cycle_used_hours': 0,
            }),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 400)
