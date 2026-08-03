
from django.db.models import Count, Sum
from products.models import Product
from needs.models import Need
from contracts.models import Contract
from .models import KPI, MarketTrend

class MarketAnalytics:
    @staticmethod
    def update_market_trends():
        total_products = Product.objects.filter(status='published').count()
        total_needs = Need.objects.filter(status='published').count()
        total_contracts = Contract.objects.filter(status='signed').count()

        trend_data = {
            'total_products': total_products,
            'total_needs': total_needs,
            'total_contracts': total_contracts,
        }

        KPI.objects.create(
            name='تعداد محصولات',
            value=total_products,
            category='revenue'
        )
        KPI.objects.create(
            name='تعداد نیازها',
            value=total_needs,
            category='revenue'
        )
        KPI.objects.create(
            name='تعداد قراردادها',
            value=total_contracts,
            category='conversion'
        )
        return trend_data
