# mrl_assessment/admin.py
import json
from django.contrib import admin
from django.utils.safestring import mark_safe
from django.utils.html import format_html
from .models import MRLAssessment


@admin.register(MRLAssessment)
class MRLAssessmentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'supply',
        'mrl',
        'status',
        'created_at',
        'answers_summary',
        'progress_bar'
    )
    list_filter = ('mrl', 'status', 'created_at')
    search_fields = ('user__username', 'supply__title', 'status')
    readonly_fields = (
        'user',
        'supply',
        'answers',
        'mrl',
        'status',
        'created_at',
        'updated_at',
        'answers_pretty',
        'level_breakdown'
    )
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('user', 'supply', 'mrl', 'status')
        }),
        ('وضعیت سطح‌بندی', {
            'fields': ('level_breakdown',),
            'classes': ('wide',)
        }),
        ('پاسخ‌های ثبت‌شده', {
            'fields': ('answers_pretty',),
            'classes': ('collapse',)
        }),
        ('زمان ثبت', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    # ========== متدهای نمایشی کاربرپسند ==========

    def answers_pretty(self, obj):
        """
        نمایش پاسخ‌ها به‌صورت جدولی با رنگ‌بندی و مدرک (evidence)
        """
        if not obj.answers:
            return "پاسخی ثبت نشده است."

        html = '<div style="direction:rtl; font-family: Vazir, Tahoma, sans-serif;">'
        html += '<table style="width:100%; border-collapse:collapse; background:#fafafa;">'
        html += '<tr style="background:#e0e0e0;">'
        html += '<th style="padding:8px; border:1px solid #ddd;">شناسه سوال</th>'
        html += '<th style="padding:8px; border:1px solid #ddd;">مقدار</th>'
        html += '<th style="padding:8px; border:1px solid #ddd;">مدرک</th>'
        html += '</tr>'

        # رنگ‌بندی مقدارها
        color_map = {
            'yes': '#2e7d32',      # سبز تیره
            'no': '#c62828',       # قرمز تیره
            'partial': '#f9a825',  # زرد
            'unknown': '#546e7a'   # خاکستری
        }
        badge_map = {
            'yes': '✅',
            'no': '❌',
            'partial': '⚠️',
            'unknown': '❓'
        }

        # مرتب‌سازی بر اساس سطح (برای خوانایی بهتر)
        sorted_items = sorted(obj.answers.items(), key=lambda x: x[0])

        for qid, data in sorted_items:
            value = data.get('value', 'unknown')
            evidence = data.get('evidence', '')
            color = color_map.get(value, '#000')
            badge = badge_map.get(value, '')
            display_value = f"{badge} {value}" if badge else value

            html += f'''
            <tr>
                <td style="padding:8px; border:1px solid #ddd; font-weight:bold;">{qid}</td>
                <td style="padding:8px; border:1px solid #ddd; color:{color}; font-weight:bold;">{display_value}</td>
                <td style="padding:8px; border:1px solid #ddd;">{evidence or '—'}</td>
            </tr>
            '''

        html += '</table></div>'
        return mark_safe(html)
    answers_pretty.short_description = "مشاهده پاسخ‌ها (جدولی)"

    def answers_summary(self, obj):
        """
        خلاصه آماری پاسخ‌ها با آیکون
        """
        if not obj.answers:
            return "بدون پاسخ"

        total = len(obj.answers)
        yes_count = sum(1 for v in obj.answers.values() if v.get('value') == 'yes')
        no_count = sum(1 for v in obj.answers.values() if v.get('value') == 'no')
        partial_count = sum(1 for v in obj.answers.values() if v.get('value') == 'partial')
        unknown_count = sum(1 for v in obj.answers.values() if v.get('value') == 'unknown')

        return format_html(
            '<span style="color:#2e7d32;">✅ {}</span> '
            '<span style="color:#c62828;">❌ {}</span> '
            '<span style="color:#f9a825;">⚠️ {}</span> '
            '<span style="color:#546e7a;">❓ {}</span> '
            '<span style="color:#333;font-weight:bold;">(مجموع {})</span>',
            yes_count, no_count, partial_count, unknown_count, total
        )
    answers_summary.short_description = "خلاصه پاسخ‌ها"

    def progress_bar(self, obj):
        """
        نوار پیشرفت نشان‌دهنده درصد پاسخ‌های 'yes' نسبت به کل سوالات MRL (۳۰ سوال)
        """
        if not obj.answers:
            return "بدون پاسخ"

        total_questions = 30  # MRL شامل ۱۰ سطح × ۳ سوال = ۳۰
        yes_count = sum(1 for v in obj.answers.values() if v.get('value') == 'yes')
        percent = int((yes_count / total_questions) * 100) if total_questions else 0

        # رنگ نوار بر اساس درصد
        if percent >= 80:
            color = '#4caf50'
        elif percent >= 50:
            color = '#ff9800'
        else:
            color = '#f44336'

        bar = f'''
        <div style="background:#e0e0e0; width:120px; height:20px; border-radius:10px; overflow:hidden; display:inline-block;">
            <div style="background:{color}; width:{percent}%; height:100%; text-align:center; color:white; line-height:20px; font-size:11px; border-radius:10px;">
                {percent}%
            </div>
        </div>
        '''
        return mark_safe(bar)
    progress_bar.short_description = "پیشرفت کلی"

    def level_breakdown(self, obj):
        """
        نمایش وضعیت هر سطح (۱ تا ۱۰) با رنگ‌های سبز/قرمز/زرد
        """
        if not obj.answers:
            return "پاسخی وجود ندارد."

        from .mrl_logic import MRL_QUESTIONS

        html = '<div style="direction:rtl; font-family:Vazir, Tahoma, sans-serif;">'
        html += '<div style="display:flex; flex-wrap:wrap; gap:8px;">'

        for level in range(1, 11):
            qids = MRL_QUESTIONS.get(level, [])
            if not qids:
                continue

            # بررسی کنید که آیا همه سوالات این سطح پاسخ 'yes' دارند؟
            all_yes = all(
                qid in obj.answers and obj.answers[qid].get('value') == 'yes'
                for qid in qids
            )

            # وضعیت سطح
            if all_yes:
                bg = '#4caf50'
                text = '✅ کامل'
            else:
                # بررسی کنید آیا حداقل یک سوال پاسخ داده شده یا نه؟
                any_answered = any(qid in obj.answers for qid in qids)
                if any_answered:
                    bg = '#ff9800'
                    text = '⚠️ ناقص'
                else:
                    bg = '#e0e0e0'
                    text = '⬜ پاسخ داده نشده'

            html += f'''
            <div style="background:{bg}; color:white; padding:6px 12px; border-radius:20px; 
                        font-weight:bold; font-size:14px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                سطح {level} {text}
            </div>
            '''

        html += '</div></div>'
        return mark_safe(html)
    level_breakdown.short_description = "وضعیت سطح‌بندی MRL"

    # ========== محدودیت‌های دسترسی (اختیاری) ==========

    def has_add_permission(self, request):
        return False  # جلوگیری از ایجاد ارزیابی جدید از ادمین

    def has_change_permission(self, request, obj=None):
        return False  # جلوگیری از ویرایش ارزیابی‌ها (اختیاری)