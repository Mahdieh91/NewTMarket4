
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from products.models import Product
from needs.models import Need
from .models import MatchResult

class SmartMatcher:
    @staticmethod
    def calculate_similarity(text1, text2):
        if not text1 or not text2:
            return 0.0
        try:
            vectorizer = TfidfVectorizer(stop_words=None)
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            return similarity[0][0]
        except:
            return 0.0

    @staticmethod
    def match_need_to_products(need_id):
        try:
            need = Need.objects.get(id=need_id)
            products = Product.objects.filter(status='published')
            results = []

            w_industry = 0.30
            w_text = 0.25
            w_trl = 0.15
            w_mrl = 0.10
            w_budget = 0.10
            w_seller = 0.10

            for product in products:
                score = 0.0
                reasons = []

                if product.industry and need.industry:
                    if product.industry == need.industry:
                        score += w_industry * 1.0
                        reasons.append("صنعت هدف یکسان است")
                    elif product.industry.parent == need.industry.parent:
                        score += w_industry * 0.6
                        reasons.append("زیرمجموعه صنعت هدف است")

                text_product = product.title + " " + product.short_description
                text_need = need.title + " " + need.description
                sim_text = SmartMatcher.calculate_similarity(text_product, text_need)
                score += w_text * sim_text
                reasons.append(f"تشابه متن: {sim_text:.2f}")

                if product.trl:
                    diff_trl = abs(product.trl - 5) / 9.0
                    score += w_trl * (1 - diff_trl)

                if product.mrl:
                    diff_mrl = abs(product.mrl - 4) / 9.0
                    score += w_mrl * (1 - diff_mrl)

                if need.budget and product.price:
                    if product.price <= need.budget:
                        score += w_budget * 1.0
                    else:
                        score += w_budget * max(0, 1 - (product.price - need.budget) / need.budget)

                results.append({
                    'product': product,
                    'score': round(score, 4),
                    'reason': ' | '.join(reasons)
                })

            results.sort(key=lambda x: x['score'], reverse=True)
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
