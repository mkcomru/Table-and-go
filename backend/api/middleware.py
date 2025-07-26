# from django.http import JsonResponse
# from django.utils import timezone
# from .models import APIKey
#
#
# class APIKeyMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response
#
#     def __call__(self, request):
#         if not request.path.startswith('/api/'): return self.get_response(request)
#
#         api_key = request.headers.get('X-API-Key')
#         if not api_key:
#             return JsonResponse(
#                 {'error': 'API key is missing'},
#                 status=401
#             )
#
#         try:
#             key_obj = APIKey.objects.get(key=api_key, is_active=True)
#
#             key_obj.last_used = timezone.now()
#             key_obj.save(updated_fields=['last_used'])
#
#             request.api_key = key_obj
#
#             return self.get_response(request)
#         except APIKey.DoesNotExist:
#             return JsonResponse(
#                 {'error': 'Invalid API key'},
#                 status=401
#             )
#
#
#
#
#
#
