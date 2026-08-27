from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def root_health_view(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'SpotterELD Trip Planner API',
        'version': '1.0.0',
        'endpoints': {
            'plan_trip': '/api/trips/plan/'
        }
    })

urlpatterns = [
    path('', root_health_view, name='root-health'),
    path('health/', root_health_view, name='health'),
    path('admin/', admin.site.urls),
    path('api/', include('trips.urls')),
]

