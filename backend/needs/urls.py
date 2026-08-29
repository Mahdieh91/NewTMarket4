# ============================================================
# needs/urls.py
# ============================================================

from django.urls import path

from .views import NeedViewSet


urlpatterns = [

    # --------------------------------------------------------
    # لیست نیازها + ایجاد نیاز
    # GET  /api/needs/
    # POST /api/needs/
    # --------------------------------------------------------

    path(
        '',
        NeedViewSet.as_view({
            'get': 'list',
            'post': 'create',
        }),
        name='need-list'
    ),

    # --------------------------------------------------------
    # جزئیات نیاز
    # GET    /api/needs/1/
    # PUT    /api/needs/1/
    # PATCH  /api/needs/1/
    # DELETE /api/needs/1/
    # --------------------------------------------------------

    path(
        '<int:pk>/',
        NeedViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy',
        }),
        name='need-detail'
    ),

    # --------------------------------------------------------
    # تغییر وضعیت
    #
    # POST /api/needs/1/change-status/
    # --------------------------------------------------------

    path(
        '<int:pk>/change-status/',
        NeedViewSet.as_view({
            'post': 'change_status',
        }),
        name='need-change-status'
    ),
]