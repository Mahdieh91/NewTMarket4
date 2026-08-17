from django.db import transaction

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from products.models import Product
from needs.models import Need
from .models import MatchResult


# ============================================================
# Persian Stopwords
# ============================================================

PERSIAN_STOPWORDS = [
    'و', 'به', 'از', 'برای', 'این', 'آن', 'با', 'تا', 'را', 'که',
    'در', 'نظیر', 'مثل', 'یک', 'یك', 'بر', 'روی', 'بین', 'برابر',
    'پس', 'بعد', 'جلوی', 'نزدیک', 'حدود', 'مانند', 'چون', 'چنان',
    'ولی', 'اما', 'اگر', 'هر', 'همه', 'همواره', 'همیشه', 'هیچ',
    'گاهی', 'بسیار', 'خیلی', 'اندك', 'کم', 'كم', 'بیش', 'حداقل',
    'حداكثر', 'حداکثر', 'نه', 'یا', 'البته', 'بلکه', 'بلكه',
    'حتی', 'خصوصاً', 'مخصوصاً', 'علی‌الخصوص', 'بالاخص', 'بخصوص',
    'صرفاً', 'فقط', 'تنها', 'به جز', 'جز', 'غیر از', 'سایر',
    'دیگر', 'برخی', 'چند', 'چندین', 'تعدادی', 'هرگونه', 'هرچند',
    'چنانچه', 'چنانکه', 'همانطور', 'همانگونه', 'همانند', 'همچون',
    'همچنین', 'همين', 'همین', 'هنگامی', 'زمانی', 'آنگاه', 'آنجا',
    'اینجا', 'كجا', 'کجا', 'چرا', 'چطور', 'چگونه', 'آیا', 'آره',
    'بله', 'خیر', 'است', 'بود', 'می‌شود', 'شد', 'شده', 'می‌دهد',
    'داد', 'داده', 'ندارد', 'دارد', 'داریم', 'دارند', 'داشته',
    'شود', 'شویم', 'شوند', 'گردد', 'گشت', 'می‌گردد', 'نمی‌شود'
]


# ============================================================
# Smart Matcher
# ============================================================

class SmartMatcher:

    # --------------------------------------------------------
    # Final scoring weights
    # --------------------------------------------------------
    #
    # مجموع = 1.0
    #
    # متن به دلیل داشتن اطلاعات غنی در Need و Product
    # بیشترین وزن را دارد.
    #

    W_INDUSTRY = 0.25
    W_TEXT = 0.50
    W_TRL = 0.10
    W_MRL = 0.05
    W_BUDGET = 0.10

    # --------------------------------------------------------
    # Product field weights
    # --------------------------------------------------------

    FIELD_WEIGHTS = {
        'title': 3,
        'short_description': 2,
        'problem_solved': 3,
        'technical_specs': 3,
        'competitive_advantage': 1,
        'full_description': 1,
    }

    # --------------------------------------------------------
    # Need field weights
    # --------------------------------------------------------

    NEED_FIELD_WEIGHTS = {
        'title': 3,
        'description': 3,
        'current_status': 1,
        'expected_outcome': 3,
        'constraints': 2,
        'evaluation_criteria': 2,
    }

    # ========================================================
    # Text normalization
    # ========================================================

    @staticmethod
    def normalize_text(text):
        """
        نرمال‌سازی متن فارسی.

        این مرحله فقط برای کاهش اختلاف‌های نوشتاری انجام می‌شود
        و هیچ تغییری در معنای متن ایجاد نمی‌کند.
        """

        if text is None:
            return ''

        text = str(text)

        replacements = {
            'ي': 'ی',
            'ى': 'ی',
            'ك': 'ک',
            'ة': 'ه',
            'ۀ': 'ه',
            'ؤ': 'و',
            'إ': 'ا',
            'أ': 'ا',
            'ٱ': 'ا',
            '‌': ' ',
            '\n': ' ',
            '\r': ' ',
            '\t': ' ',
        }

        for old, new in replacements.items():
            text = text.replace(old, new)

        # حذف HTMLهای ساده در RichTextField
        import re

        text = re.sub(r'<[^>]+>', ' ', text)

        # حذف فاصله‌های تکراری
        text = ' '.join(text.split())

        return text.strip()

    # ========================================================
    # Build weighted Product text
    # ========================================================

    @classmethod
    def build_product_text(cls, product):
        """
        ایجاد متن وزن‌دهی‌شده برای Product.

        اهمیت فیلدهای مختلف با تکرار کنترل‌شده مشخص می‌شود.

        Title                  × 3
        Short Description      × 2
        Problem Solved         × 3
        Technical Specs        × 3
        Competitive Advantage  × 1
        Full Description       × 1
        """

        fields = {
            'title': getattr(product, 'title', None),
            'short_description': getattr(
                product,
                'short_description',
                None
            ),
            'problem_solved': getattr(
                product,
                'problem_solved',
                None
            ),
            'technical_specs': getattr(
                product,
                'technical_specs',
                None
            ),
            'competitive_advantage': getattr(
                product,
                'competitive_advantage',
                None
            ),
            'full_description': getattr(
                product,
                'full_description',
                None
            ),
        }

        parts = []

        for field_name, weight in cls.FIELD_WEIGHTS.items():

            value = fields.get(field_name)

            if not value:
                continue

            value = cls.normalize_text(value)

            if not value:
                continue

            parts.extend([value] * weight)

        return ' '.join(parts)

    # ========================================================
    # Build weighted Need text
    # ========================================================

    @classmethod
    def build_need_text(cls, need):
        """
        ایجاد متن وزن‌دهی‌شده برای Need.

        Need دارای چند فیلد مهم برای توصیف مسئله است و
        همه آنها در Matching استفاده می‌شوند.
        """

        fields = {
            'title': getattr(need, 'title', None),
            'description': getattr(need, 'description', None),
            'current_status': getattr(
                need,
                'current_status',
                None
            ),
            'expected_outcome': getattr(
                need,
                'expected_outcome',
                None
            ),
            'constraints': getattr(
                need,
                'constraints',
                None
            ),
            'evaluation_criteria': getattr(
                need,
                'evaluation_criteria',
                None
            ),
        }

        parts = []

        for field_name, weight in cls.NEED_FIELD_WEIGHTS.items():

            value = fields.get(field_name)

            if not value:
                continue

            value = cls.normalize_text(value)

            if not value:
                continue

            parts.extend([value] * weight)

        return ' '.join(parts)

    # ========================================================
    # Industry similarity
    # ========================================================

    @staticmethod
    def calculate_industry_score(product, need):
        """
        محاسبه تطابق صنعت.

        1.0 = صنعت کاملاً یکسان
        0.6 = زیرمجموعه صنعت مشترک
        0.0 = عدم تطابق
        """

        product_industry = getattr(
            product,
            'industry',
            None
        )

        need_industry = getattr(
            need,
            'industry',
            None
        )

        if not product_industry or not need_industry:
            return None, None

        if product_industry == need_industry:
            return (
                1.0,
                'صنعت محصول با صنعت مورد نیاز یکسان است'
            )

        product_parent = getattr(
            product_industry,
            'parent',
            None
        )

        need_parent = getattr(
            need_industry,
            'parent',
            None
        )

        if (
            product_parent is not None
            and need_parent is not None
            and product_parent == need_parent
        ):
            return (
                0.6,
                'محصول و نیاز در زیرمجموعه یک صنعت مشترک قرار دارند'
            )

        return (
            0.0,
            'تطابق مستقیم صنعتی مشاهده نشد'
        )

    # ========================================================
    # TRL similarity
    # ========================================================

    @staticmethod
    def calculate_trl_score(product, need):
        """
        محاسبه TRL.

        نکته مهم:
        Need در مدل واقعی فعلی فیلد TRL ندارد.

        بنابراین این معیار در نسخه فعلی غیرفعال است و
        هیچ مقدار ساختگی برای Need تولید نمی‌شود.
        """

        if not hasattr(need, 'trl'):
            return None, None

        product_trl = getattr(
            product,
            'trl',
            None
        )

        need_trl = getattr(
            need,
            'trl',
            None
        )

        if product_trl is None or need_trl is None:
            return None, None

        try:
            product_trl = float(product_trl)
            need_trl = float(need_trl)

            score = max(
                0.0,
                1.0 - abs(product_trl - need_trl) / 8.0
            )

            if product_trl >= need_trl:
                reason = (
                    'سطح آمادگی فناوری محصول '
                    'نیاز موردنظر را پوشش می‌دهد'
                )
            else:
                reason = (
                    'سطح آمادگی فناوری محصول '
                    'پایین‌تر از سطح مورد انتظار است'
                )

            return score, reason

        except (TypeError, ValueError):
            return None, None

    # ========================================================
    # MRL similarity
    # ========================================================

    @staticmethod
    def calculate_mrl_score(product, need):
        """
        محاسبه MRL.

        Need فعلی فیلد MRL ندارد.
        بنابراین این معیار در وضعیت فعلی پروژه فعال نمی‌شود.
        """

        if not hasattr(need, 'mrl'):
            return None, None

        product_mrl = getattr(
            product,
            'mrl',
            None
        )

        need_mrl = getattr(
            need,
            'mrl',
            None
        )

        if product_mrl is None or need_mrl is None:
            return None, None

        try:
            product_mrl = float(product_mrl)
            need_mrl = float(need_mrl)

            score = max(
                0.0,
                1.0 - abs(product_mrl - need_mrl) / 8.0
            )

            if product_mrl >= need_mrl:
                reason = (
                    'سطح آمادگی بازار محصول '
                    'نیاز موردنظر را پوشش می‌دهد'
                )
            else:
                reason = (
                    'سطح آمادگی بازار محصول '
                    'پایین‌تر از سطح مورد انتظار است'
                )

            return score, reason

        except (TypeError, ValueError):
            return None, None

    # ========================================================
    # Budget similarity
    # ========================================================

    @staticmethod
    def calculate_budget_score(product, need):
        """
        محاسبه تناسب قیمت محصول با بودجه Need.

        1.0 = قیمت در محدوده بودجه
        0.0 = اختلاف بسیار زیاد با بودجه
        """

        budget = getattr(
            need,
            'budget',
            None
        )

        price = getattr(
            product,
            'price',
            None
        )

        if budget is None or price is None:
            return None, None

        try:
            budget = float(budget)
            price = float(price)

        except (TypeError, ValueError):
            return None, None

        if budget <= 0:
            return None, None

        if price <= budget:
            return (
                1.0,
                'قیمت محصول در محدوده بودجه مورد نیاز است'
            )

        excess_ratio = (
            (price - budget) / budget
        )

        score = max(
            0.0,
            1.0 - excess_ratio
        )

        return (
            score,
            'قیمت محصول بالاتر از بودجه مورد نیاز است'
        )

    # ========================================================
    # Active weight normalization
    # ========================================================

    @classmethod
    def normalize_weights(cls, active_criteria):
        """
        بازتوزیع وزن معیارهای فعال.

        اگر یک معیار به دلیل نبود داده قابل محاسبه نباشد،
        وزن آن حذف شده و وزن معیارهای موجود مجدداً نرمال می‌شود.
        """

        all_weights = {
            'industry': cls.W_INDUSTRY,
            'text': cls.W_TEXT,
            'trl': cls.W_TRL,
            'mrl': cls.W_MRL,
            'budget': cls.W_BUDGET,
        }

        active_total = sum(
            all_weights.get(name, 0.0)
            for name in active_criteria
        )

        if active_total <= 0:
            return {}

        return {
            name: all_weights[name] / active_total
            for name in active_criteria
            if name in all_weights
        }

    # ========================================================
    # Explanation
    # ========================================================

    @staticmethod
    def generate_explanation(
        industry_score,
        text_score,
        trl_score,
        mrl_score,
        budget_score,
    ):
        """
        تولید توضیح قابل فهم برای Dashboard.
        """

        strengths = []
        weaknesses = []

        # ----------------------------------------------------
        # Industry
        # ----------------------------------------------------

        if industry_score is not None:

            if industry_score >= 0.8:
                strengths.append(
                    'تطابق کامل صنعت'
                )

            elif industry_score >= 0.5:
                strengths.append(
                    'ارتباط نزدیک صنعتی'
                )

            elif industry_score == 0:
                weaknesses.append(
                    'تطابق مستقیم صنعتی مشاهده نشد'
                )

        # ----------------------------------------------------
        # Text
        # ----------------------------------------------------

        if text_score >= 0.75:

            strengths.append(
                'تطابق بالای موضوعی و محتوایی'
            )

        elif text_score >= 0.50:

            strengths.append(
                'تطابق مناسب محتوای محصول و نیاز'
            )

        elif text_score < 0.25:

            weaknesses.append(
                'تشابه محتوایی پایین'
            )

        # ----------------------------------------------------
        # TRL
        # ----------------------------------------------------

        if trl_score is not None:

            if trl_score >= 0.85:

                strengths.append(
                    'سطح فناوری کاملاً مناسب'
                )

            elif trl_score < 0.50:

                weaknesses.append(
                    'TRL پایین‌تر از سطح مورد انتظار'
                )

        # ----------------------------------------------------
        # MRL
        # ----------------------------------------------------

        if mrl_score is not None:

            if mrl_score >= 0.85:

                strengths.append(
                    'سطح آمادگی بازار مناسب'
                )

            elif mrl_score < 0.50:

                weaknesses.append(
                    'MRL پایین‌تر از سطح مورد انتظار'
                )

        # ----------------------------------------------------
        # Budget
        # ----------------------------------------------------

        if budget_score is not None:

            if budget_score >= 0.95:

                strengths.append(
                    'قیمت در محدوده بودجه'
                )

            elif budget_score < 0.50:

                weaknesses.append(
                    'قیمت بالاتر از بودجه'
                )

        # ----------------------------------------------------
        # Final explanation
        # ----------------------------------------------------

        explanation_parts = []

        if strengths:
            explanation_parts.append(
                'نقاط قوت: ' +
                '، '.join(strengths)
            )

        if weaknesses:
            explanation_parts.append(
                'نقاط ضعف: ' +
                '، '.join(weaknesses)
            )

        if not explanation_parts:

            explanation_parts.append(
                'تطابق بر اساس معیارهای موجود محاسبه شده است'
            )

        return ' | '.join(
            explanation_parts
        )

    # ========================================================
    # Recommended actions
    # ========================================================

    @staticmethod
    def generate_recommended_actions(
        industry_score,
        text_score,
        trl_score,
        mrl_score,
        budget_score,
    ):
        """
        تولید اقدامات پیشنهادی برای Dashboard.

        این بخش صرفاً Rule-Based است و هیچ متن ساختگی
        یا مدل زبانی خارجی ایجاد نمی‌کند.
        """

        actions = []

        if industry_score is not None:

            if industry_score < 0.5:
                actions.append(
                    'بررسی سازگاری محصول با صنعت مورد نیاز'
                )

        if text_score < 0.40:
            actions.append(
                'بررسی دقیق‌تر مشخصات فنی و مسئله مورد نیاز'
            )

        if trl_score is not None:

            if trl_score < 0.60:
                actions.append(
                    'بررسی امکان ارتقای سطح آمادگی فناوری'
                )

        if mrl_score is not None:

            if mrl_score < 0.60:
                actions.append(
                    'بررسی آمادگی بازار و ظرفیت عرضه محصول'
                )

        if budget_score is not None:

            if budget_score < 0.60:
                actions.append(
                    'بررسی امکان اصلاح قیمت یا شرایط مالی'
                )

        if not actions:
            actions.append(
                'محصول از نظر معیارهای موجود گزینه مناسبی برای بررسی بیشتر است'
            )

        return ' | '.join(actions)

    # ========================================================
    # Main Matching
    # ========================================================

    @classmethod
    @transaction.atomic
    def match_need_to_products(cls, need_id):
        """
        تطبیق Need با Productهای منتشرشده.

        Pipeline:

        Need
          ↓
        Product Corpus
          ↓
        Field-Weighted TF-IDF
          ↓
        Cosine Similarity
          ↓
        Industry
          ↓
        TRL / MRL / Budget
          ↓
        Dynamic Weighted Scoring
          ↓
        Explanation
          ↓
        MatchResult
        """

        # ----------------------------------------------------
        # دریافت Need
        # ----------------------------------------------------

        try:
            need = (
                Need.objects
                .select_related('industry')
                .get(id=need_id)
            )

        except Need.DoesNotExist:

            return []

        # ----------------------------------------------------
        # Productهای قابل تطبیق
        # ----------------------------------------------------

        products = list(
            Product.objects
            .filter(status='published')
            .select_related(
                'seller',
                'industry'
            )
        )

        # ----------------------------------------------------
        # اگر Product وجود نداشت
        # ----------------------------------------------------

        if not products:

            MatchResult.objects.filter(
                need=need
            ).delete()

            return []

        # ----------------------------------------------------
        # Build Product Corpus
        # ----------------------------------------------------

        product_texts = [
            cls.build_product_text(product)
            for product in products
        ]

        # ----------------------------------------------------
        # Build Need Document
        # ----------------------------------------------------

        need_text = cls.build_need_text(
            need
        )

        # ----------------------------------------------------
        # TF-IDF
        # ----------------------------------------------------

        documents = (
            product_texts +
            [need_text]
        )

        text_similarities = [
            0.0
            for _ in products
        ]

        try:

            vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                max_features=5000,
                stop_words=PERSIAN_STOPWORDS,
                sublinear_tf=True,
            )

            tfidf_matrix = (
                vectorizer.fit_transform(
                    documents
                )
            )

            product_matrix = (
                tfidf_matrix[:-1]
            )

            need_vector = (
                tfidf_matrix[-1]
            )

            if (
                product_matrix.shape[1] > 0
                and need_vector.shape[1] > 0
            ):

                similarities = cosine_similarity(
                    need_vector,
                    product_matrix
                )[0]

                text_similarities = [
                    max(
                        0.0,
                        min(
                            1.0,
                            float(value)
                        )
                    )
                    for value in similarities
                ]

        except (
            ValueError,
            TypeError,
            AttributeError
        ):

            text_similarities = [
                0.0
                for _ in products
            ]

        # ----------------------------------------------------
        # Calculate each Product
        # ----------------------------------------------------

        results = []

        for index, product in enumerate(products):

            text_score = (
                text_similarities[index]
            )

            # ----------------------------------------------
            # Industry
            # ----------------------------------------------

            (
                industry_score,
                industry_reason
            ) = cls.calculate_industry_score(
                product,
                need
            )

            # ----------------------------------------------
            # TRL
            # ----------------------------------------------

            (
                trl_score,
                trl_reason
            ) = cls.calculate_trl_score(
                product,
                need
            )

            # ----------------------------------------------
            # MRL
            # ----------------------------------------------

            (
                mrl_score,
                mrl_reason
            ) = cls.calculate_mrl_score(
                product,
                need
            )

            # ----------------------------------------------
            # Budget
            # ----------------------------------------------

            (
                budget_score,
                budget_reason
            ) = cls.calculate_budget_score(
                product,
                need
            )

            # ----------------------------------------------
            # Active criteria
            # ----------------------------------------------

            active_criteria = [
                'text'
            ]

            if industry_score is not None:
                active_criteria.append(
                    'industry'
                )

            if trl_score is not None:
                active_criteria.append(
                    'trl'
                )

            if mrl_score is not None:
                active_criteria.append(
                    'mrl'
                )

            if budget_score is not None:
                active_criteria.append(
                    'budget'
                )

            # ----------------------------------------------
            # Normalize weights
            # ----------------------------------------------

            weights = cls.normalize_weights(
                active_criteria
            )

            # ----------------------------------------------
            # Final score
            # ----------------------------------------------

            score = 0.0

            score += (
                weights.get('text', 0.0)
                * text_score
            )

            if industry_score is not None:

                score += (
                    weights.get('industry', 0.0)
                    * industry_score
                )

            if trl_score is not None:

                score += (
                    weights.get('trl', 0.0)
                    * trl_score
                )

            if mrl_score is not None:

                score += (
                    weights.get('mrl', 0.0)
                    * mrl_score
                )

            if budget_score is not None:

                score += (
                    weights.get('budget', 0.0)
                    * budget_score
                )

            # جلوگیری از خروج امتیاز از بازه
            score = max(
                0.0,
                min(
                    1.0,
                    score
                )
            )

            # ----------------------------------------------
            # Explanation
            # ----------------------------------------------

            reason = cls.generate_explanation(
                industry_score=industry_score,
                text_score=text_score,
                trl_score=trl_score,
                mrl_score=mrl_score,
                budget_score=budget_score,
            )

            # ----------------------------------------------
            # Recommended actions
            # ----------------------------------------------

            recommended_actions = (
                cls.generate_recommended_actions(
                    industry_score=industry_score,
                    text_score=text_score,
                    trl_score=trl_score,
                    mrl_score=mrl_score,
                    budget_score=budget_score,
                )
            )

            results.append({
                'product': product,
                'score': round(score, 4),
                'text_score': round(
                    text_score,
                    4
                ),
                'industry_score': (
                    round(
                        industry_score,
                        4
                    )
                    if industry_score is not None
                    else None
                ),
                'trl_score': (
                    round(
                        trl_score,
                        4
                    )
                    if trl_score is not None
                    else None
                ),
                'mrl_score': (
                    round(
                        mrl_score,
                        4
                    )
                    if mrl_score is not None
                    else None
                ),
                'budget_score': (
                    round(
                        budget_score,
                        4
                    )
                    if budget_score is not None
                    else None
                ),
                'reason': reason,
                'recommended_actions': (
                    recommended_actions
                ),
            })

        # ----------------------------------------------------
        # Ranking
        # ----------------------------------------------------

        results.sort(
            key=lambda item: (
                item['score'],
                item['text_score']
            ),
            reverse=True
        )

        # ----------------------------------------------------
        # Replace previous matches
        # ----------------------------------------------------

        MatchResult.objects.filter(
            need=need
        ).delete()

        # ----------------------------------------------------
        # Save Top 20
        # ----------------------------------------------------

        match_objects = []

        for item in results[:20]:

            match_objects.append(
                MatchResult(
                    need=need,
                    product=item['product'],
                    score=item['score'],
                    reason=item['reason'],
                    recommended_actions=(
                        item['recommended_actions']
                    ),
                )
            )

        if match_objects:

            MatchResult.objects.bulk_create(
                match_objects
            )

        return results