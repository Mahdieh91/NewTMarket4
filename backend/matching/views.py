# ============================================================
# matching/views.py
# ============================================================
# استفاده از Supply به عنوان منبع اصلی
# ============================================================

import json
import logging
import re
import requests
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Max, Min

from .models import MatchResult, MatchingRequest
from .serializers import (
    MatchResultSerializer,
    MatchResultListSerializer,
    MatchResultCreateSerializer,
    MatchResultStatsSerializer,
    MatchingRequestSerializer,
)
from products.models import Supply
from needs.models import Need
from .services import match_need_with_supplies, calculate_match

logger = logging.getLogger(__name__)


class MatchResultViewSet(viewsets.ModelViewSet):
    queryset = MatchResult.objects.select_related(
        'need', 'product', 'product__seller'
    )
    serializer_class = MatchResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        'need',
        'product',
        'status',
        'need__industry',
        'product__category',
    ]

    search_fields = [
        'need__title',
        'need__description',
        'product__title',
        'product__description',
        'reason',
        'recommended_actions',
    ]

    ordering_fields = [
        'score',
        'match_percentage',
        'created_at',
        'product__price',
    ]

    ordering = ['-match_percentage', '-score']

    def get_serializer_class(self):
        if self.action == 'list':
            return MatchResultListSerializer
        elif self.action == 'create':
            return MatchResultCreateSerializer
        elif self.action == 'stats':
            return MatchResultStatsSerializer
        return MatchResultSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_staff:
            queryset = queryset.filter(need__buyer=user)
        return queryset

    @action(detail=False, methods=['get'], url_path='needs/(?P<need_id>[^/.]+)')
    def by_need(self, request, need_id=None):
        try:
            need = get_object_or_404(Need, id=need_id)
            if request.user != need.buyer and not request.user.is_staff:
                return Response(
                    {'detail': 'شما به این نیاز دسترسی ندارید.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            results = self.get_queryset().filter(need=need)
            results = results.order_by('-match_percentage', '-score')
            page = self.paginate_queryset(results)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = self.get_serializer(results, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in by_need for need_id={need_id}: {str(e)}", exc_info=True)
            return Response(
                {'detail': f'خطا در دریافت نتایج: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        user = request.user
        queryset = MatchResult.objects.filter(need__buyer=user)
        total = queryset.count()
        if total == 0:
            return Response({
                'total_matches': 0,
                'average_match_percentage': 0,
                'highest_match_percentage': 0,
                'lowest_match_percentage': 0,
                'high_matches_count': 0,
                'medium_matches_count': 0,
                'low_matches_count': 0,
            })
        stats_data = {
            'total_matches': total,
            'average_match_percentage': queryset.aggregate(Avg('match_percentage'))['match_percentage__avg'] or 0,
            'highest_match_percentage': queryset.aggregate(Max('match_percentage'))['match_percentage__max'] or 0,
            'lowest_match_percentage': queryset.aggregate(Min('match_percentage'))['match_percentage__min'] or 0,
            'high_matches_count': queryset.filter(match_percentage__gte=80).count(),
            'medium_matches_count': queryset.filter(match_percentage__gte=60, match_percentage__lt=80).count(),
            'low_matches_count': queryset.filter(match_percentage__lt=60).count(),
        }
        serializer = MatchResultStatsSerializer(stats_data)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='rate')
    def rate(self, request, pk=None):
        match = self.get_object()
        rating = request.data.get('rating')
        if not rating:
            return Response(
                {'detail': 'لطفاً امتیاز را وارد کنید.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError
        except ValueError:
            return Response(
                {'detail': 'امتیاز باید عددی بین 1 تا 5 باشد.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        match.user_rating = rating
        match.save(update_fields=['user_rating'])
        serializer = self.get_serializer(match)
        return Response(serializer.data)


class MatchingRequestViewSet(viewsets.ModelViewSet):
    queryset = MatchingRequest.objects.select_related('need', 'user')
    serializer_class = MatchingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['need', 'status', 'priority']
    ordering_fields = ['created_at', 'updated_at', 'completed_at', 'total_matches']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_staff:
            queryset = queryset.filter(user=user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='trigger/(?P<need_id>[^/.]+)')
    def trigger_matching(self, request, need_id=None):
        need = get_object_or_404(Need, id=need_id)
        if request.user != need.buyer and not request.user.is_staff:
            return Response(
                {'detail': 'شما به این نیاز دسترسی ندارید.'},
                status=status.HTTP_403_FORBIDDEN
            )
        existing_request = MatchingRequest.objects.filter(
            need=need,
            status__in=['pending', 'processing']
        ).first()
        if existing_request:
            return Response(
                {
                    'detail': 'یک درخواست تطبیق برای این نیاز در حال پردازش است.',
                    'request_id': existing_request.id,
                    'status': existing_request.status,
                },
                status=status.HTTP_409_CONFLICT
            )
        matching_request = MatchingRequest.objects.create(
            need=need,
            user=request.user,
            status='pending'
        )
        try:
            from .tasks import process_matching_task
            process_matching_task.delay(matching_request.id)
            logger.info(f'✅ Task Celery برای نیاز {need.id} ارسال شد (request_id: {matching_request.id})')
        except ImportError:
            logger.warning('⚠️ Celery در دسترس نیست. پردازش به صورت هم‌زمان انجام می‌شود.')
            try:
                process_matching_sync(matching_request.id)
            except Exception as e:
                logger.error(f'❌ خطا در پردازش هم‌زمان: {e}')
                matching_request.mark_failed(str(e))
                return Response(
                    {
                        'detail': f'خطا در پردازش: {str(e)}',
                        'request_id': matching_request.id,
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            logger.error(f'❌ خطا در ارسال Task Celery: {e}')
            matching_request.mark_failed(str(e))
            return Response(
                {
                    'detail': f'خطا در شروع پردازش: {str(e)}',
                    'request_id': matching_request.id,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        serializer = self.get_serializer(matching_request)
        return Response(
            {
                'request_id': matching_request.id,
                'status': 'pending',
                'message': 'فرآیند تطبیق در پس‌زمینه شروع شد. لطفاً بعداً وضعیت را بررسی کنید.',
                'data': serializer.data,
            },
            status=status.HTTP_202_ACCEPTED
        )

    @action(detail=True, methods=['get'], url_path='status')
    def check_status(self, request, pk=None):
        matching_request = self.get_object()
        if request.user != matching_request.user and not request.user.is_staff:
            return Response(
                {'detail': 'شما به این درخواست دسترسی ندارید.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(matching_request)
        response_data = serializer.data
        if matching_request.status == 'completed':
            results_count = MatchResult.objects.filter(need=matching_request.need).count()
            response_data['results_count'] = results_count
        return Response(response_data)


class NeedMatchingViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='matches')
    def get_matches(self, request, pk=None):
        try:
            need = get_object_or_404(Need, pk=pk)
            if request.user != need.buyer and not request.user.is_staff:
                return Response(
                    {'detail': 'شما به این نیاز دسترسی ندارید.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            supplies = Supply.objects.filter(
                status__in=['approved', 'published']
            )
            results = match_need_with_supplies(
                need=need,
                supplies=supplies,
                limit=20,
                petrochemical_only=False
            )
            serialized = []
            for item in results:
                actions = item.get('recommended_actions', [])
                if isinstance(actions, list):
                    actions_str = ' | '.join(actions)
                else:
                    actions_str = str(actions) if actions else ''
                serialized.append({
                    'id': item.get('product_id'),
                    'need': need.id,
                    'product': item.get('product_id'),
                    'score': item.get('match_percentage', 0),
                    'match_percentage': item.get('match_percentage', 0),
                    'reason': item.get('match_reason', ''),
                    'recommended_actions': actions_str,
                    'product_title': item.get('title', ''),
                    'product_description': item.get('description', ''),
                    'product_price': item.get('price'),
                    'product_trl': item.get('trl'),
                    'product_mrl': None,
                    'product_industry': item.get('industry', ''),
                    'product_category': item.get('type', 'product'),
                    'provider': item.get('provider', ''),
                    'status': 'approved',
                    'created_at': None,
                    'updated_at': None,
                })
            return Response(serialized)
        except Exception as e:
            logger.error(f"Error in get_matches for need_id={pk}: {str(e)}", exc_info=True)
            return Response(
                {'detail': f'خطا در دریافت نتایج تطبیق: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================================
# process_matching_sync (یکدست‌سازی شده با calculate_match)
# ============================================================

def process_matching_sync(matching_request_id):
    matching_request = MatchingRequest.objects.get(id=matching_request_id)
    need = matching_request.need
    logger.info(f'🔄 شروع پردازش تطبیق برای نیاز {need.id} (request: {matching_request_id})')
    matching_request.status = 'processing'
    matching_request.save(update_fields=['status'])
    MatchResult.objects.filter(need=need).delete()
    supplies = Supply.objects.filter(status__in=['approved', 'published'])
    logger.info(f'📦 تعداد کل عرضه‌ها: {supplies.count()}')
    if not supplies.exists():
        matching_request.total_matches = 0
        matching_request.mark_completed()
        logger.info(f'⚠️ هیچ عرضه‌ای برای نیاز {need.id} یافت نشد.')
        return
    results = []
    for supply in supplies:
        try:
            # استفاده از calculate_match برای یکدست‌سازی
            match_result = calculate_match(need, supply)
            final_score = match_result['match_percentage']
            if final_score >= 40:
                result = MatchResult(
                    need=need,
                    product=supply,
                    score=final_score,
                    match_percentage=final_score,
                    reason=match_result['match_reason'],
                    recommended_actions=' | '.join(match_result['recommended_actions']),
                    status='approved'
                )
                results.append(result)
        except Exception as e:
            logger.error(f'❌ خطا در پردازش عرضه {supply.id}: {e}')
    with transaction.atomic():
        if results:
            MatchResult.objects.bulk_create(results)
            matching_request.total_matches = len(results)
        else:
            matching_request.total_matches = 0
    matching_request.mark_completed()
    logger.info(
        f'✅ تکمیل تطبیق نیاز {need.id}: '
        f'{len(results)} نتیجه ذخیره شد'
    )