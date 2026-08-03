# users/views.py
from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import User
from .serializers import UserSerializer, RegisterSerializer

# ============================================================
# ViewSet برای مدیریت کاربران (CRUD)
# ============================================================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'kyc_status', 'is_legal']
    search_fields = ['username', 'email', 'company_name', 'expertise']
    ordering_fields = '__all__'

# ============================================================
# دریافت اطلاعات کاربر جاری (لاگین‌شده)
# ============================================================
class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

# ============================================================
# ثبت‌نام کاربر جدید
# ============================================================
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'ثبت‌نام با موفقیت انجام شد.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)