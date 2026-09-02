# mrl_assessment/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import MRLAssessment
from .serializers import MRLAssessmentCreateSerializer
from .mrl_logic import calculate_mrl_from_answers


class MRLAssessmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MRLAssessmentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        answers = data.get('answers', {})
        supply_id = data.get('supply_id')

        result = calculate_mrl_from_answers(answers)
        if result is None:
            return Response(
                {'error': 'پاسخ‌ها معتبر نیستند یا همه سوالات پاسخ داده نشده‌اند.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        assessment = MRLAssessment.objects.create(
            user=request.user,
            supply_id=supply_id if supply_id else None,
            answers=answers,
            mrl=result['mrl'],
            status=result['status']
        )

        if supply_id:
            try:
                from products.models import Supply
                supply = Supply.objects.get(id=supply_id, seller=request.user)
                supply.mrl = str(result['mrl'])
                supply.mrl_assessed = True
                supply.save(update_fields=['mrl', 'mrl_assessed'])
            except Supply.DoesNotExist:
                pass

        return Response({
            'assessment_id': assessment.id,
            'mrl': assessment.mrl,
            'status': assessment.status,
            'message': 'ارزیابی MRL با موفقیت ذخیره شد.'
        }, status=status.HTTP_201_CREATED)