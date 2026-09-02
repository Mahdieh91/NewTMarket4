# trl_assessment/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import TRLAssessment
from .serializers import TRLAssessmentCreateSerializer
from .trl_logic import calculate_trl_from_answers


class TRLAssessmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TRLAssessmentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        answers = data.get('answers', {})
        supply_id = data.get('supply_id')

        # محاسبه TRL - حتی اگر همه سوالات پاسخ داده نشده باشند
        result = calculate_trl_from_answers(answers)

        # ایجاد ارزیابی
        assessment = TRLAssessment.objects.create(
            user=request.user,
            supply_id=supply_id if supply_id else None,
            answers=answers,
            trl=result['trl'],
            status=result['status']
        )

        # به‌روزرسانی Supply در صورت وجود
        if supply_id:
            try:
                from products.models import Supply
                supply = Supply.objects.get(id=supply_id, seller=request.user)
                supply.trl = str(result['trl'])
                supply.trl_assessed = True
                supply.save(update_fields=['trl', 'trl_assessed'])
            except Supply.DoesNotExist:
                pass

        return Response({
            'assessment_id': assessment.id,
            'trl': assessment.trl,
            'status': assessment.status,
            'message': 'ارزیابی TRL با موفقیت ذخیره شد.'
        }, status=status.HTTP_201_CREATED)