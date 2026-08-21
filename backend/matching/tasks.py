# ============================================================
# matching/tasks.py - Celery Tasks
# ============================================================

from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_matching_task(self, matching_request_id):
    """
    Task Celery برای پردازش تطبیق در پس‌زمینه
    """
    try:
        # ایمپورت داینامیک برای جلوگیری از circular import
        from .views import process_matching_sync
        process_matching_sync(matching_request_id)
        logger.info(f'✅ Task تطبیق {matching_request_id} با موفقیت انجام شد.')
        return {'status': 'completed', 'request_id': matching_request_id}
        
    except Exception as e:
        logger.error(f'❌ خطا در Task تطبیق {matching_request_id}: {e}')
        
        # اگر خطا داشت، دوباره تلاش کن
        try:
            self.retry(exc=e, countdown=60)  # 60 ثانیه بعد دوباره تلاش کن
        except Exception as retry_error:
            logger.error(f'❌ Task تطبیق {matching_request_id} پس از ۳ تلاش ناموفق بود: {retry_error}')
            raise