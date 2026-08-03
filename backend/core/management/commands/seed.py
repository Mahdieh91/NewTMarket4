
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from industries.models import IndustryCategory

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed initial data for the platform'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')
        
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@tmarket.ir', 'admin123')
            self.stdout.write('Admin created: admin/admin123')
        
        industries = [
            'نفت و گاز', 'پتروشیمی', 'فولاد و معدن', 'سلامت',
            'کشاورزی', 'حمل‌ونقل', 'خودروسازی', 'انرژی',
            'فناوری اطلاعات', 'محیط زیست'
        ]
        for name in industries:
            IndustryCategory.objects.get_or_create(name=name)
            self.stdout.write(f'Industry created: {name}')
        
        self.stdout.write(self.style.SUCCESS('Data seeded successfully!'))
