from rest_framework import serializers

class TripRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=255)
    pickup_location = serializers.CharField(max_length=255)
    dropoff_location = serializers.CharField(max_length=255)
    cycle_used_hours = serializers.FloatField(min_value=0, max_value=70)

    def validate_current_location(self, value):
        if not value.strip():
            raise serializers.ValidationError("Current location cannot be empty.")
        return value.strip()

    def validate_pickup_location(self, value):
        if not value.strip():
            raise serializers.ValidationError("Pickup location cannot be empty.")
        return value.strip()

    def validate_dropoff_location(self, value):
        if not value.strip():
            raise serializers.ValidationError("Dropoff location cannot be empty.")
        return value.strip()
