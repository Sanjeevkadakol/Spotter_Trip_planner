from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import TripRequestSerializer
from .services.geocoding import geocode
from .services.routing import get_route
from .services.hos import HOSEngine
from .services.stops import assign_stop_coordinates
from .services.eld import generate_eld_logs
import logging

logger = logging.getLogger(__name__)


class PlanTripView(APIView):
    """
    POST /api/trips/plan/
    Takes trip details and returns a complete HOS-compliant driving schedule.
    """

    def post(self, request):
        serializer = TripRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': 'Validation failed', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        current_loc = data['current_location']
        pickup_loc = data['pickup_location']
        dropoff_loc = data['dropoff_location']
        cycle_used = data['cycle_used_hours']

        # Step 1: Geocode all locations
        try:
            current_geo = geocode(current_loc)
            pickup_geo = geocode(pickup_loc)
            dropoff_geo = geocode(dropoff_loc)
        except ValueError as e:
            return Response(
                {'error': f'Geocoding failed: {str(e)}'},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        except Exception as e:
            logger.error(f'Geocoding error: {e}')
            return Response(
                {'error': 'Could not geocode one or more locations. Please check the location names.'},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        # Step 2: Get routes (current→pickup, pickup→dropoff)
        try:
            route_to_pickup = get_route(current_geo, pickup_geo)
            route_to_dropoff = get_route(pickup_geo, dropoff_geo)
        except Exception as e:
            logger.error(f'Routing error: {e}')
            return Response(
                {'error': 'Could not calculate route. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Step 3: Run HOS scheduling engine
        try:
            engine = HOSEngine(cycle_used_hours=cycle_used)
            timeline = engine.plan(
                route_to_pickup=route_to_pickup,
                route_to_dropoff=route_to_dropoff,
                current_geo=current_geo,
                pickup_geo=pickup_geo,
                dropoff_geo=dropoff_geo,
            )
        except Exception as e:
            logger.error(f'HOS engine error: {e}', exc_info=True)
            return Response(
                {'error': f'Schedule calculation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Step 4: Assign geographic coordinates to stops
        combined_geometry = route_to_pickup['geometry'] + route_to_dropoff['geometry']
        stops = assign_stop_coordinates(timeline, combined_geometry)

        # Step 5: Generate ELD logs
        eld_logs = generate_eld_logs(timeline)

        # Build trip summary
        total_miles = route_to_pickup['distance_miles'] + route_to_dropoff['distance_miles']
        driving_events = [e for e in timeline if e['type'] == 'driving']
        total_driving_hours = sum(e['duration_hours'] for e in driving_events)
        rest_events = [e for e in timeline if e['type'] == 'rest']
        fuel_events = [e for e in timeline if e['type'] == 'fuel']
        
        last_event = timeline[-1] if timeline else {}
        total_duration_hours = last_event.get('end_hour', 0)
        cycle_remaining = max(0, 70 - cycle_used - total_driving_hours - 
                              sum(e['duration_hours'] for e in timeline if e['type'] in ('pickup', 'dropoff', 'fuel', 'break')))

        trip_summary = {
            'distance_miles': round(total_miles, 1),
            'distance_to_pickup_miles': round(route_to_pickup['distance_miles'], 1),
            'distance_to_dropoff_miles': round(route_to_dropoff['distance_miles'], 1),
            'total_driving_hours': round(total_driving_hours, 2),
            'total_duration_hours': round(total_duration_hours, 2),
            'driving_days': len(eld_logs),
            'rest_stops': len(rest_events),
            'fuel_stops': len(fuel_events),
            'cycle_hours_used': round(cycle_used, 2),
            'cycle_hours_remaining': round(max(0, 70 - cycle_used - total_driving_hours), 2),
            'avg_speed_mph': 55,
        }

        # Full combined geometry for map
        full_geometry = route_to_pickup['geometry'] + route_to_dropoff['geometry']

        return Response({
            'trip_summary': trip_summary,
            'locations': {
                'current': current_geo,
                'pickup': pickup_geo,
                'dropoff': dropoff_geo,
            },
            'route': {
                'geometry': full_geometry,
                'to_pickup': route_to_pickup['geometry'],
                'to_dropoff': route_to_dropoff['geometry'],
                'distance_miles': round(total_miles, 1),
            },
            'stops': stops,
            'timeline': timeline,
            'eld_logs': eld_logs,
        }, status=status.HTTP_200_OK)
