
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None:
        response.data = {
            'status': 'error',
            'message': response.data.get('detail', 'خطایی رخ داده است'),
            'errors': response.data.get('errors', {}),
            'status_code': response.status_code
        }
    
    return response
