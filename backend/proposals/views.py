# proposals/views.py
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from .models import Proposal
from .serializers import ProposalSerializer
from needs.models import Need
from products.models import Supply


class ProposalViewSet(viewsets.ModelViewSet):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'need', 'supply', 'sender']
    search_fields = ['title', 'technical_description', 'terms']
    ordering_fields = ['created_at', 'price', 'delivery_time']

    def perform_create(self, serializer):
        # بررسی وجود need و supply
        need_id = self.request.data.get('need')
        supply_id = self.request.data.get('supply')

        if need_id:
            try:
                need = Need.objects.get(id=need_id)
            except Need.DoesNotExist:
                raise serializers.ValidationError({'need': 'نیاز مورد نظر یافت نشد.'})

        if supply_id:
            try:
                supply = Supply.objects.get(id=supply_id)
            except Supply.DoesNotExist:
                raise serializers.ValidationError({'supply': 'عرضه مورد نظر یافت نشد.'})

        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """دانلود فایل پروپوزال"""
        proposal = self.get_object()
        if not proposal.file:
            return Response(
                {'error': 'هیچ فایلی برای این پروپوزال وجود ندارد.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # بررسی دسترسی: فقط فرستنده، گیرنده (صاحب نیاز) و مدیران می‌توانند دانلود کنند
        user = request.user
        if not (user == proposal.sender or user == proposal.need.buyer or user.is_staff):
            return Response(
                {'error': 'شما مجوز دانلود این فایل را ندارید.'},
                status=status.HTTP_403_FORBIDDEN
            )

        response = FileResponse(
            proposal.file.open('rb'),
            as_attachment=True,
            filename=proposal.file.name.split('/')[-1]
        )
        return response

    @action(detail=False, methods=['post'])
    def upload(self, request):
        """آپلود فایل برای پروپوزال موجود"""
        proposal_id = request.data.get('proposal_id')
        file = request.FILES.get('file')

        if not proposal_id:
            return Response(
                {'error': 'proposal_id الزامی است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not file:
            return Response(
                {'error': 'فایل الزامی است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            proposal = Proposal.objects.get(id=proposal_id)
        except Proposal.DoesNotExist:
            return Response(
                {'error': 'پروپوزال یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # بررسی دسترسی: فقط فرستنده یا مدیر می‌توانند فایل آپلود کنند
        if not (request.user == proposal.sender or request.user.is_staff):
            return Response(
                {'error': 'شما مجوز آپلود فایل برای این پروپوزال را ندارید.'},
                status=status.HTTP_403_FORBIDDEN
            )

        proposal.file = file
        proposal.save()

        serializer = self.get_serializer(proposal)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def my_proposals(self, request):
        """دریافت پروپوزال‌های ارسالی کاربر جاری"""
        proposals = Proposal.objects.filter(sender=request.user)
        serializer = self.get_serializer(proposals, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def for_my_needs(self, request):
        """دریافت پروپوزال‌هایی که برای نیازهای کاربر جاری ارسال شده‌اند"""
        proposals = Proposal.objects.filter(need__buyer=request.user)
        serializer = self.get_serializer(proposals, many=True)
        return Response(serializer.data)