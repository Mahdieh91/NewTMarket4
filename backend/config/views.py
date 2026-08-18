# config/views.py

from django.http import JsonResponse


def health_check(request):
    return JsonResponse(
        {
            'status': 'ok',
            'service': 'tmarket-api',
        },
        status=200,
    )