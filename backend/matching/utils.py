from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from products.models import Product
from needs.models import Need
from .models import MatchResult

# لیست جامع کلمات بی‌معنی و پرتکرار فارسی برای افزایش دقت تطابق متنی
PERSIAN_STOPWORDS = [
    'و', 'به', 'از', 'برای', 'این', 'آن', 'با', 'تا', 'را', 'که', 'در', 'نظیر', 'مثل',
    'یك', 'یک', 'بر', 'روی', 'بین', 'برابر', 'پس', 'بعد', 'جلوی', 'نزدیک', 'حدود',
    'مانند', 'چون', 'چنان', 'ولی', 'اما', 'اگر', 'هر', 'همه', 'همواره', 'همیشه',
    'هیچ', 'گاهی', 'بسیار', 'خیلی', 'اندك', 'كم', 'بیش', 'حداقل', 'حداكثر',
    'نه', 'نه تنها', 'نه اینکه', 'نه... نه', 'یا', 'یا این که', 'یا آن که',
    'البته', 'بلكه', 'حتی', 'خصوصاً', 'مخصوصاً', 'علی‌الخصوص',
    'بالاخص', 'بخصوص', 'صرفاً', 'فقط', 'تنها', 'به جز', 'جز',
    'غیر از', 'سایر', 'دیگر', 'برخی', 'چند', 'چندین', 'تعدادی',
    'هرگونه', 'هرچند', 'چنانچه', 'چنانکه', 'همانطور', 'همانگونه',
    'همانند', 'همچون', 'همچنین', 'همين', 'همین', 'هنگامی', 'زمانی',
    'آنگاه', 'آنجا', 'اینجا', 'كجا', 'کجا', 'چرا', 'چطور', 'چگونه',
    'آیا', 'آره', 'بله', 'خیر', 'است', 'بود', 'می‌شود', 'شد', 'شده',
    'می‌دهد', 'داد', 'داده', 'ندارد', 'دارد', 'داریم', 'دارند', 'داشته',
    'شود', 'شویم', 'شوند', 'گردد', 'گشت', 'می‌گردد', 'نمی‌شود'
]

class SmartMatcher:
    @staticmethod
    def calculate_similarity(text1, text2):
        """
        محاسبه شباهت معنایی بین دو رشته متنی با استفاده از TF-IDF و شباهت کسینوسی
        - ngram_range=(1,2): ترکیب کلمات و عبارات دوتایی را درک می‌کند (مثلاً "کوره صنعتی")
        - max_features=1500: برای جلوگیری از افزایش بیش از حد ابعاد ماتریس و حفظ سرعت
        - stop_words: حذف کلمات بی‌معنی فارسی
        """
        if not text1 or not text2:
            return 0.0
        try:
            vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                max_features=1500,
                stop_words=PERSIAN_STOPWORDS
            )
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            return similarity[0][0]
        except Exception:
            return 0.0

    @staticmethod
    def match_need_to_products(need_id):
        """
        دریافت شناسه نیاز، جستجوی محصولات منتشر شده و محاسبه امتیاز تطبیق بر اساس معیارهای وزنی
        """
        try:
            need = Need.objects.get(id=need_id)
            products = Product.objects.filter(status='published')
            results = []

            # تعیین ضرایب وزنی معیارها
            w_industry = 0.30
            w_text = 0.25
            w_trl = 0.15
            w_mrl = 0.10
            w_budget = 0.10
            w_seller = 0.10

            for product in products:
                score = 0.0
                reasons = []

                # 1. معیار تطابق صنعت
                if product.industry and need.industry:
                    if product.industry == need.industry:
                        score += w_industry * 1.0
                        reasons.append("صنعت هدف یکسان است")
                    # در صورت وجود والد مشترک (زیرمجموعه بودن)
                    elif (hasattr(product.industry, 'parent') and 
                          hasattr(need.industry, 'parent') and 
                          product.industry.parent == need.industry.parent):
                        score += w_industry * 0.6
                        reasons.append("زیرمجموعه صنعت هدف است")

                # 2. معیار تشابه متنی با استفاده از NLP
                text_product = product.title + " " + (product.short_description or '')
                text_need = need.title + " " + (need.description or '')
                sim_text = SmartMatcher.calculate_similarity(text_product, text_need)
                score += w_text * sim_text
                reasons.append(f"تشابه متن: {sim_text:.2f}")

                # 3. معیار سطح آمادگی فناوری (TRL) - سطح مبنا: 5
                if product.trl is not None:
                    diff_trl = abs(product.trl - 5) / 9.0
                    score += w_trl * (1 - diff_trl)
                else:
                    score += w_trl * 0.5  # امتیاز نیمی در صورت عدم وجود

                # 4. معیار سطح آمادگی تولید (MRL) - سطح مبنا: 4
                if product.mrl is not None:
                    diff_mrl = abs(product.mrl - 4) / 9.0
                    score += w_mrl * (1 - diff_mrl)
                else:
                    score += w_mrl * 0.5

                # 5. معیار تطابق بودجه
                if need.budget and product.price:
                    # اگر قیمت کمتر یا مساوی بودجه باشد، امتیاز کامل
                    if product.price <= need.budget:
                        score += w_budget * 1.0
                    else:
                        # کاهش خطی بر اساس اختلاف بودجه
                        reduction_factor = max(0, 1 - (product.price - need.budget) / need.budget)
                        score += w_budget * reduction_factor
                elif need.budget and not product.price:
                    score += w_budget * 0.5

                # 6. معیار امتیاز فروشنده (قابل گسترش برای رتبه‌بندی تأمین‌کنندگان)
                # در این نسخه به عنوان یک ظرفیت در نظر گرفته می‌شود
                # (می‌توان از امتیاز میانگین فروشنده یا اعتبار آن استفاده کرد)
                score += w_seller * 0.8  # پیش‌فرض 80% برای فروشندگان معتبر

                results.append({
                    'product': product,
                    'score': round(score, 4),
                    'reason': ' | '.join(reasons)
                })

            # مرتب‌سازی نتایج بر اساس امتیاز (نزولی)
            results.sort(key=lambda x: x['score'], reverse=True)

            # ذخیره‌سازی حداکثر ۲۰ نتیجه برتر در دیتابیس
            # (پاک‌سازی نتایج قبلی برای این نیاز خاص)
            MatchResult.objects.filter(need=need).delete()
            for item in results[:20]:
                MatchResult.objects.create(
                    need=need,
                    product=item['product'],
                    score=item['score'],
                    reason=item['reason']
                )
            return results

        except Need.DoesNotExist:
            return []