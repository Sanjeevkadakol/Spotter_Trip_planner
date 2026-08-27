from django.db import models
import json

class TripRequest(models.Model):
    """Optional model to log trip requests for analytics."""
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    cycle_used_hours = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    result_summary = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.current_location} → {self.pickup_location} → {self.dropoff_location}"

    class Meta:
        ordering = ['-created_at']
