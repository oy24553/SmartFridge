from rest_framework import serializers


class MenuRequestSerializer(serializers.Serializer):
    days = serializers.IntegerField(default=1, min_value=1, max_value=7)
    meals_per_day = serializers.IntegerField(default=2, min_value=1, max_value=5)
    language = serializers.ChoiceField(choices=["zh", "en"], default="en")


class ParseItemsRequestSerializer(serializers.Serializer):
    text = serializers.CharField()


class SuggestShoppingRequestSerializer(serializers.Serializer):
    days = serializers.IntegerField(default=3, min_value=1, max_value=14)
    language = serializers.ChoiceField(choices=["zh", "en"], default="en")
    create = serializers.BooleanField(default=False)


class AssistantRequestSerializer(serializers.Serializer):
    message = serializers.CharField()
    language = serializers.ChoiceField(choices=["zh", "en"], default="en")
    execute = serializers.BooleanField(default=True)
