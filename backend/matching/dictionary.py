# matching/dictionary.py

"""
Petrochemical Domain Dictionary
===============================

لایه دانش دامنه‌ای سیستم Matching برای صنعت پتروشیمی.

وظایف اصلی:

1. نرمال‌سازی متن فارسی و انگلیسی
2. شناسایی مفاهیم تخصصی پتروشیمی
3. پوشش مترادف‌های فارسی و انگلیسی
4. پوشش شکل‌های مختلف نوشتاری
5. پوشش غلط‌های املایی رایج
6. تبدیل عبارت‌های مختلف به مفهوم استاندارد
7. استخراج مفاهیم از Need و Supply
8. محاسبه شباهت مفهومی
9. استخراج سیگنال‌های ریسک
10. تولید risk_level به صورت Rule-Based

این فایل مستقل از مدل‌های Django است و می‌تواند
مستقیماً توسط Matching Engine استفاده شود.
"""

from __future__ import annotations

import re
from difflib import SequenceMatcher
from typing import Dict, List, Set, Tuple


# ============================================================
# 1. Petrochemical Vocabulary
# ============================================================

PETROCHEMICAL_TERMS: Dict[str, List[str]] = {

    # ========================================================
    # Process Units
    # ========================================================

    "distillation": [
        "تقطیر",
        "برج تقطیر",
        "ستون تقطیر",
        "واحد تقطیر",
        "فرآیند تقطیر",
        "فرایند تقطیر",
        "تقطیر صنعتی",
        "تقطیرات",
        "distillation",
        "distillation column",
        "distillation tower",
        "distillation unit",
        "fractional distillation",
        "distilation",
        "distillation colum",
        "distilation column",
        "تقطير",
        "برج تقطير",
        "ستون تقطير",
    ],

    "fractionation": [
        "تفکیک",
        "تفکیک برشی",
        "جداسازی برش ها",
        "جداسازی برش‌ها",
        "فرکشنیشن",
        "فرکشن",
        "فراکشنیشن",
        "fractionation",
        "fractionator",
        "fractionation unit",
        "fractional separation",
    ],

    "separation": [
        "جداسازی",
        "واحد جداسازی",
        "فرآیند جداسازی",
        "فرایند جداسازی",
        "سپریشن",
        "separation",
        "separation unit",
        "gas separation",
        "liquid separation",
        "separator",
        "separation process",
    ],

    "furnace": [
        "کوره",
        "کوره صنعتی",
        "کوره فرآیندی",
        "کوره فرایندی",
        "کوره پتروشیمی",
        "کوره پالایشگاهی",
        "کوره حرارتی",
        "کوره فرآیندی",
        "هیتر فرآیندی",
        "هیتر فرایندی",
        "گرمکن فرآیندی",
        "گرمکن فرایندی",
        "کوره گازی",
        "کوره نفتی",
        "furnace",
        "process furnace",
        "industrial furnace",
        "process heater",
        "process heating",
        "fired heater",
        "fired furnace",
        "furnance",
        "furnase",
        "furnece",
        "کوره فرایندی",
    ],

    "heat_exchanger": [
        "مبدل حرارتی",
        "مبدل",
        "مبدل گرمایی",
        "مبدل حرارتی صنعتی",
        "مبدل پوسته و لوله",
        "مبدل پوسته لوله",
        "مبدل پوسته‌لوله",
        "مبدل حرارتی پوسته لوله",
        "مبدل صفحه ای",
        "مبدل صفحه‌ای",
        "مبدل حرارتی صفحه ای",
        "مبدل حرارتی صفحه‌ای",
        "heat exchanger",
        "heat exchenger",
        "heat-exchanger",
        "heat exchanger unit",
        "shell and tube",
        "shell tube exchanger",
        "plate heat exchanger",
        "heat recovery exchanger",
    ],

    "compressor": [
        "کمپرسور",
        "کمپرسور گاز",
        "کمپرسور صنعتی",
        "کمپرسور فرآیندی",
        "کمپرسور فرایندی",
        "فشرده ساز",
        "فشرده‌ساز",
        "تراکم",
        "واحد تراکم",
        "کمپرس",
        "compression",
        "compressor",
        "gas compressor",
        "industrial compressor",
        "process compressor",
        "compression unit",
        "compresssor",
        "compresor",
        "compressorr",
        "کمپرسورر",
        "کمپرسور گاز",
    ],

    "pump": [
        "پمپ",
        "پمپ صنعتی",
        "پمپ فرآیندی",
        "پمپ فرایندی",
        "پمپ سانتریفیوژ",
        "پمپ گریز از مرکز",
        "پمپ انتقال",
        "پمپ خوراک",
        "پمپ فرآیند",
        "پمپ سیال",
        "pump",
        "process pump",
        "industrial pump",
        "centrifugal pump",
        "transfer pump",
        "feed pump",
        "pump unit",
        "پمپپ",
        "پمب",
        "pummp",
        "pmp",
    ],

    "reactor": [
        "راکتور",
        "راکتور صنعتی",
        "راکتور پتروشیمی",
        "راکتور شیمیایی",
        "واکنشگاه",
        "راکتور فرآیندی",
        "راکتور فرایندی",
        "واحد راکتور",
        "reactor",
        "chemical reactor",
        "process reactor",
        "reactor unit",
        "reaction unit",
        "reaktor",
        "reactror",
        "reacter",
        "راکتورر",
    ],

    "boiler": [
        "بویلر",
        "دیگ بخار",
        "دیگ بخار صنعتی",
        "مولد بخار",
        "واحد تولید بخار",
        "boiler",
        "steam boiler",
        "industrial boiler",
        "steam generator",
        "boiler unit",
        "بویلرر",
    ],

    "cooling_system": [
        "سیستم خنک کننده",
        "سیستم خنک‌کننده",
        "خنک کننده",
        "خنک‌کننده",
        "برج خنک کننده",
        "برج خنک‌کننده",
        "کولینگ تاور",
        "برج کولینگ",
        "سیستم کولینگ",
        "cooling system",
        "cooling tower",
        "cooling unit",
        "cooling water",
        "cooling water system",
        "cooler",
    ],

    "separator": [
        "سپراتور",
        "جداکننده",
        "جدا ساز",
        "جدا‌ساز",
        "separator",
        "gas separator",
        "liquid separator",
        "vessel separator",
    ],

    "tank": [
        "مخزن",
        "مخزن ذخیره",
        "مخزن فرآیندی",
        "مخزن فرایندی",
        "تانک",
        "مخزن تحت فشار",
        "storage tank",
        "process tank",
        "tank",
        "pressure vessel",
    ],

    "pipeline": [
        "خط لوله",
        "لوله انتقال",
        "خط انتقال",
        "پایپینگ",
        "لوله کشی",
        "لوله‌کشی",
        "pipeline",
        "pipe line",
        "piping",
        "process piping",
        "transfer line",
    ],

    # ========================================================
    # Petrochemical Operations
    # ========================================================

    "petrochemical": [
        "پتروشیمی",
        "صنعت پتروشیمی",
        "مجتمع پتروشیمی",
        "صنایع پتروشیمی",
        "شرکت پتروشیمی",
        "پتروشمی",
        "پتروشیمیی",
        "پترو شیمی",
        "petrochemical",
        "petro chemical",
        "petrochemichal",
        "petrochem",
        "petrochemical industry",
        "petrochemical complex",
        "petrochemical plant",
    ],

    "refinery": [
        "پالایشگاه",
        "پالایشگاه نفت",
        "پالایشگاه گاز",
        "مجتمع پالایشگاهی",
        "refinery",
        "oil refinery",
        "gas refinery",
        "refining plant",
    ],

    "process_unit": [
        "واحد فرآیندی",
        "واحد فرایندی",
        "واحد فرآیند",
        "واحد فرایند",
        "فرآیند صنعتی",
        "فرایند صنعتی",
        "واحد عملیاتی",
        "واحد تولید",
        "process unit",
        "process plant",
        "process system",
        "operating unit",
    ],

    "production_line": [
        "خط تولید",
        "خط تولید صنعتی",
        "خط تولید پتروشیمی",
        "خط تولید کارخانه",
        "لاین تولید",
        "production line",
        "production system",
        "manufacturing line",
        "production plant",
    ],

    # ========================================================
    # Energy
    # ========================================================

    "energy": [
        "انرژی",
        "مصرف انرژی",
        "مصرف سوخت",
        "مصرف گاز",
        "مصرف گاز طبیعی",
        "سوخت",
        "سوخت مصرفی",
        "بهینه سازی انرژی",
        "بهینه‌سازی انرژی",
        "مدیریت انرژی",
        "راندمان انرژی",
        "بهره وری انرژی",
        "بهره‌وری انرژی",
        "کاهش مصرف انرژی",
        "کاهش مصرف سوخت",
        "کاهش مصرف گاز",
        "مصرف برق",
        "برق مصرفی",
        "energy",
        "energy consumption",
        "fuel consumption",
        "natural gas",
        "energy efficiency",
        "energy optimization",
        "energy management",
        "energy saving",
        "fuel optimization",
        "energey",
        "enrgy",
        "energyy",
        "مصرف انرژِی",
        "بهینه سازی انرژِی",
    ],

    "combustion": [
        "احتراق",
        "فرآیند احتراق",
        "فرایند احتراق",
        "سیستم احتراق",
        "بهینه سازی احتراق",
        "بهینه‌سازی احتراق",
        "احتراق صنعتی",
        "مشعل",
        "مشعل صنعتی",
        "برنر",
        "burner",
        "combustion",
        "combustion system",
        "industrial combustion",
        "combustion optimization",
        "combustion control",
    ],

    "steam": [
        "بخار",
        "بخار صنعتی",
        "بخار فرآیندی",
        "بخار فرایندی",
        "شبکه بخار",
        "سیستم بخار",
        "تولید بخار",
        "مصرف بخار",
        "steam",
        "process steam",
        "steam system",
        "steam network",
        "steam generation",
        "steam consumption",
    ],

    "electricity": [
        "برق",
        "مصرف برق",
        "توان",
        "توان الکتریکی",
        "انرژی الکتریکی",
        "electricity",
        "power consumption",
        "electrical energy",
        "electrical power",
    ],

    # ========================================================
    # Process Control
    # ========================================================

    "process_control": [
        "کنترل فرآیند",
        "کنترل فرایند",
        "کنترل فرآیندی",
        "کنترل فرایندی",
        "کنترل صنعتی",
        "کنترل پیشرفته",
        "کنترل پیشرفته فرآیند",
        "کنترل پیشرفته فرایند",
        "سیستم کنترل",
        "اتوماسیون فرآیند",
        "اتوماسیون فرایند",
        "کنترل دما",
        "کنترل فشار",
        "کنترل جریان",
        "کنترل سطح",
        "APC",
        "MPC",
        "DCS",
        "PLC",
        "PID",
        "process control",
        "advanced process control",
        "advanced control",
        "process automation",
        "distributed control system",
        "programmable logic controller",
        "model predictive control",
        "proccess control",
        "process controll",
        "process contorl",
    ],

    "instrumentation": [
        "ابزار دقیق",
        "ابزار دقیق صنعتی",
        "ابزار دقیق فرآیندی",
        "ابزار دقیق فرایندی",
        "اندازه گیری",
        "اندازه‌گیری",
        "سنسور",
        "حسگر",
        "ترانسمیتر",
        "فلومتر",
        "فشارسنج",
        "دماسنج",
        "instrumentation",
        "process instrumentation",
        "industrial instrumentation",
        "sensor",
        "sensors",
        "transmitter",
        "flow meter",
        "pressure sensor",
        "temperature sensor",
    ],

    "monitoring": [
        "پایش",
        "پایش صنعتی",
        "پایش فرآیند",
        "پایش فرایند",
        "مانیتورینگ",
        "نظارت",
        "سیستم پایش",
        "سیستم مانیتورینگ",
        "پایش وضعیت",
        "پایش آنلاین",
        "پایش لحظه ای",
        "پایش لحظه‌ای",
        "monitoring",
        "process monitoring",
        "industrial monitoring",
        "condition monitoring",
        "online monitoring",
        "real time monitoring",
    ],

    # ========================================================
    # AI / Digitalization
    # ========================================================

    "ai": [
        "هوش مصنوعی",
        "هوش مصنوعی صنعتی",
        "هوش مصنوعی در صنعت",
        "یادگیری ماشین",
        "یادگیری ماشینی",
        "یادگیری عمیق",
        "شبکه عصبی",
        "شبکه عصبی مصنوعی",
        "مدل هوشمند",
        "الگوریتم هوشمند",
        "ماشین لرنینگ",
        "دیپ لرنینگ",
        "machine learning",
        "deep learning",
        "artificial intelligence",
        "AI",
        "ML",
        "DL",
        "neural network",
        "artificial neural network",
        "intelligent model",
        "machine lerning",
        "machin learning",
        "artifical intelligence",
        "artificial inteligence",
        "هوش مصنوعیی",
    ],

    "digital_twin": [
        "دوقلوی دیجیتال",
        "دوقلوی دیجیتالی",
        "دوقلو دیجیتال",
        "دوقلوی مجازی",
        "digital twin",
        "digital twins",
        "virtual twin",
        "digitaltwin",
        "digital twn",
        "دوقلوی دیجیتالل",
    ],

    "digitalization": [
        "دیجیتالی سازی",
        "دیجیتال سازی",
        "دیجیتالی‌سازی",
        "دیجیتال‌سازی",
        "تحول دیجیتال",
        "هوشمندسازی",
        "اتوماسیون هوشمند",
        "صنعت هوشمند",
        "کارخانه هوشمند",
        "digitalization",
        "digital transformation",
        "smart manufacturing",
        "industrial digitalization",
        "digital transformation",
    ],

    "predictive_maintenance": [
        "نگهداری پیش‌بینانه",
        "نگهداری پیش بینانه",
        "نگهداری پیشبینانه",
        "تعمیرات پیش‌بینانه",
        "تعمیرات پیش بینانه",
        "نگهداری و تعمیرات پیش‌بینانه",
        "پیش‌بینی خرابی",
        "پیش بینی خرابی",
        "پیشبینی خرابی",
        "تشخیص خرابی",
        "پیش‌بینی عیب",
        "پیش بینی عیب",
        "نگهداری مبتنی بر وضعیت",
        "predictive maintenance",
        "predictive maintenance system",
        "failure prediction",
        "fault prediction",
        "condition based maintenance",
        "predictive maintenence",
        "predictiv maintenance",
    ],

    "fault_detection": [
        "تشخیص خرابی",
        "تشخیص خطا",
        "تشخیص عیب",
        "شناسایی خرابی",
        "شناسایی خطا",
        "کشف خرابی",
        "کشف خطا",
        "fault detection",
        "fault diagnosis",
        "fault identification",
        "anomaly detection",
        "abnormality detection",
    ],

    "optimization": [
        "بهینه سازی",
        "بهینه‌سازی",
        "بهینه سازی فرآیند",
        "بهینه‌سازی فرآیند",
        "بهینه سازی فرایند",
        "بهینه‌سازی فرایند",
        "بهینه سازی تولید",
        "بهینه‌سازی تولید",
        "بهینه سازی مصرف",
        "بهینه‌سازی مصرف",
        "بهینه سازی عملیاتی",
        "بهینه‌سازی عملیاتی",
        "optimization",
        "process optimization",
        "production optimization",
        "operational optimization",
        "optimization model",
    ],

    # ========================================================
    # Emission / Environment
    # ========================================================

    "emission": [
        "آلایندگی",
        "آلودگی",
        "انتشار",
        "انتشار آلاینده",
        "انتشار گاز",
        "گازهای گلخانه‌ای",
        "گازهای گلخانه ای",
        "آلاینده‌های صنعتی",
        "آلاینده های صنعتی",
        "انتشار کربن",
        "کاهش آلایندگی",
        "کاهش انتشار",
        "emission",
        "emissions",
        "industrial emission",
        "greenhouse gas",
        "greenhouse gases",
        "GHG",
        "CO2",
        "carbon dioxide",
        "الایندگی",
        "الودگی",
        "emmisions",
        "emissiong",
    ],

    "carbon": [
        "کربن",
        "ردپای کربن",
        "کاهش کربن",
        "کاهش انتشار کربن",
        "کربن دی اکسید",
        "دی اکسید کربن",
        "دی‌اکسید کربن",
        "carbon",
        "carbon footprint",
        "carbon reduction",
        "carbon dioxide",
        "CO2",
    ],

    "environment": [
        "محیط زیست",
        "محیط‌زیست",
        "زیست محیطی",
        "زیست‌محیطی",
        "پایداری محیط زیست",
        "sustainability",
        "environment",
        "environmental",
        "environmental impact",
    ],

    # ========================================================
    # Safety
    # ========================================================

    "safety": [
        "ایمنی",
        "ایمنی صنعتی",
        "ایمنی فرآیند",
        "ایمنی فرایند",
        "ایمنی پتروشیمی",
        "حفاظت صنعتی",
        "مدیریت ایمنی",
        "ایمنی عملیاتی",
        "process safety",
        "safety",
        "industrial safety",
        "safety management",
        "operational safety",
    ],

    "hazard": [
        "خطر",
        "ریسک",
        "خطرات",
        "خطرات صنعتی",
        "خطر فرآیندی",
        "خطر فرایندی",
        "ارزیابی خطر",
        "ارزیابی ریسک",
        "ریسک عملیاتی",
        "خطر انفجار",
        "خطر آتش",
        "hazard",
        "industrial hazard",
        "process hazard",
        "risk assessment",
        "hazard assessment",
        "operational risk",
    ],

    "explosion": [
        "انفجار",
        "خطر انفجار",
        "مواد منفجره",
        "انفجاری",
        "explosion",
        "explosive",
        "explosion risk",
    ],

    "fire": [
        "آتش",
        "آتش سوزی",
        "آتش‌سوزی",
        "حریق",
        "خطر آتش",
        "fire",
        "fire hazard",
        "fire risk",
        "fire protection",
    ],

    # ========================================================
    # Maintenance
    # ========================================================

    "maintenance": [
        "نگهداری",
        "تعمیرات",
        "نگهداری و تعمیرات",
        "نت",
        "تعمیر و نگهداری",
        "نگهداری تجهیزات",
        "تعمیرات تجهیزات",
        "تعمیرات صنعتی",
        "maintenance",
        "equipment maintenance",
        "industrial maintenance",
        "repair and maintenance",
        "O&M",
        "operation and maintenance",
    ],

    "equipment": [
        "تجهیزات",
        "تجهیزات صنعتی",
        "تجهیزات فرآیندی",
        "تجهیزات فرایندی",
        "تجهیزات پتروشیمی",
        "ماشین آلات",
        "ماشین‌آلات",
        "تجهیزات عملیاتی",
        "equipment",
        "industrial equipment",
        "process equipment",
        "petrochemical equipment",
        "machinery",
        "operational equipment",
    ],

    # ========================================================
    # Materials / Chemicals
    # ========================================================

    "polymer": [
        "پلیمر",
        "پلیمرها",
        "مواد پلیمری",
        "محصول پلیمری",
        "پلیمری",
        "polymer",
        "polymers",
        "polymeric material",
        "polymeric",
    ],

    "ethylene": [
        "اتیلن",
        "اتیلن گاز",
        "اتیلن گازی",
        "ethylene",
        "ethylene gas",
    ],

    "propylene": [
        "پروپیلن",
        "پروپیلن گاز",
        "پروپیلن گازی",
        "propylene",
        "propylene gas",
    ],

    "methanol": [
        "متانول",
        "متانول صنعتی",
        "methanol",
        "industrial methanol",
    ],

    "ammonia": [
        "آمونیاک",
        "امونیاک",
        "آمونیاک صنعتی",
        "ammonia",
        "industrial ammonia",
    ],

    "urea": [
        "اوره",
        "اوره صنعتی",
        "urea",
        "industrial urea",
    ],

    "gas": [
        "گاز",
        "گاز طبیعی",
        "گاز خوراک",
        "گاز سوخت",
        "گاز صنعتی",
        "natural gas",
        "feed gas",
        "fuel gas",
        "industrial gas",
        "gas",
    ],

    # ========================================================
    # Production / Performance
    # ========================================================

    "production": [
        "تولید",
        "تولید صنعتی",
        "تولید پتروشیمی",
        "ظرفیت تولید",
        "نرخ تولید",
        "افزایش تولید",
        "کاهش تولید",
        "production",
        "industrial production",
        "petrochemical production",
        "production capacity",
        "production rate",
        "production increase",
    ],

    "efficiency": [
        "راندمان",
        "بازده",
        "کارایی",
        "بهره‌وری",
        "بهره وری",
        "راندمان فرآیند",
        "راندمان فرایند",
        "بهبود راندمان",
        "بهبود بهره وری",
        "process efficiency",
        "efficiency",
        "performance efficiency",
        "operational efficiency",
    ],

    "capacity": [
        "ظرفیت",
        "ظرفیت تولید",
        "ظرفیت عملیاتی",
        "ظرفیت کارخانه",
        "ظرفیت واحد",
        "افزایش ظرفیت",
        "کاهش ظرفیت",
        "capacity",
        "production capacity",
        "operating capacity",
        "plant capacity",
        "capacity increase",
    ],

    "quality": [
        "کیفیت",
        "کیفیت محصول",
        "کنترل کیفیت",
        "بهبود کیفیت",
        "مشخصات محصول",
        "quality",
        "product quality",
        "quality control",
        "quality improvement",
        "product specification",
    ],

    "downtime": [
        "توقف تولید",
        "توقف خط",
        "توقف واحد",
        "زمان توقف",
        "خواب خط",
        "خواب تجهیزات",
        "downtime",
        "production downtime",
        "plant downtime",
        "equipment downtime",
        "shutdown",
    ],

    # ========================================================
    # Advanced Petrochemical Concepts
    # ========================================================

    "process_simulation": [
        "شبیه سازی فرآیند",
        "شبیه‌سازی فرآیند",
        "شبیه سازی فرایند",
        "شبیه‌سازی فرایند",
        "مدلسازی فرآیند",
        "مدل سازی فرآیند",
        "شبیه سازی صنعتی",
        "process simulation",
        "process modeling",
        "process modelling",
        "plant simulation",
    ],

    "soft_sensor": [
        "سنسور نرم",
        "سنسور مجازی",
        "حسگر نرم",
        "حسگر مجازی",
        "soft sensor",
        "virtual sensor",
        "soft sensing",
    ],

    "anomaly_detection": [
        "تشخیص ناهنجاری",
        "شناسایی ناهنجاری",
        "کشف ناهنجاری",
        "تشخیص رفتار غیرعادی",
        "anomaly detection",
        "abnormal behavior detection",
        "outlier detection",
    ],

    "forecasting": [
        "پیش بینی",
        "پیش‌بینی",
        "پیش بینی تولید",
        "پیش‌بینی تولید",
        "پیش بینی مصرف",
        "پیش‌بینی مصرف",
        "پیش بینی تقاضا",
        "پیش‌بینی تقاضا",
        "forecasting",
        "prediction",
        "production forecasting",
        "demand forecasting",
    ],
}


# ============================================================
# 2. Normalization
# ============================================================

PETROCHEMICAL_NORMALIZATION = {
    "ي": "ی",
    "ى": "ی",
    "ك": "ک",

    "\u200c": " ",
    "\u200f": " ",
    "\u200e": " ",

    "ـ": "",

    "أ": "ا",
    "إ": "ا",
    "ٱ": "ا",

    "ؤ": "و",
    "ئ": "ی",
}


def normalize_petrochemical_text(text: str) -> str:
    """
    نرمال‌سازی متن فارسی و انگلیسی.

    این تابع باعث می‌شود مثلاً:

    بهینه‌سازی
    بهینه سازی
    بهینه‌سازی

    تا حد زیادی به یک شکل تبدیل شوند.
    """

    if not text:
        return ""

    text = str(text).lower().strip()

    for old, new in PETROCHEMICAL_NORMALIZATION.items():
        text = text.replace(old, new)

    # یکسان‌سازی dash
    text = text.replace("-", " ")
    text = text.replace("_", " ")

    # حذف علائم غیرضروری
    text = re.sub(r"[،؛,:.!؟?()\[\]{}\"'«»]", " ", text)

    # چند فاصله متوالی
    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ============================================================
# 3. Term Index
# ============================================================

def _build_term_index() -> Dict[str, Set[str]]:
    """
    برای هر مفهوم، نسخه نرمال‌شده تمام عبارت‌ها را ایجاد می‌کند.
    """

    index = {}

    for concept, terms in PETROCHEMICAL_TERMS.items():
        index[concept] = {
            normalize_petrochemical_text(term)
            for term in terms
            if normalize_petrochemical_text(term)
        }

    return index


PETROCHEMICAL_TERM_INDEX = _build_term_index()


# ============================================================
# 4. Concept Lookup
# ============================================================

def get_petrochemical_concepts(text: str) -> List[str]:
    """
    مفاهیم پتروشیمی موجود در متن را استخراج می‌کند.

    مثال:

    ورودی:
        بهینه سازی مصرف انرژی کوره و مبدل حرارتی

    خروجی:
        [
            energy,
            furnace,
            heat_exchanger
        ]
    """

    normalized_text = normalize_petrochemical_text(text)

    if not normalized_text:
        return []

    concepts = []

    for concept, terms in PETROCHEMICAL_TERM_INDEX.items():

        for term in terms:

            if _term_exists(normalized_text, term):
                concepts.append(concept)
                break

    return concepts


def _term_exists(text: str, term: str) -> bool:
    """
    بررسی می‌کند عبارت در متن وجود دارد یا خیر.

    برای عبارت‌های فارسی و انگلیسی از مرزبندی مناسب
    استفاده می‌شود تا False Positive کمتر شود.
    """

    if not term:
        return False

    if term in text:
        return True

    return False


# ============================================================
# 5. Concept Details
# ============================================================

def get_concept_matches(text: str) -> Dict[str, List[str]]:
    """
    مشخص می‌کند هر Concept با کدام عبارت واقعی Match شده است.

    مثال:

    {
        "furnace": ["کوره فرآیندی"],
        "energy": ["مصرف انرژی"]
    }
    """

    normalized_text = normalize_petrochemical_text(text)

    result = {}

    if not normalized_text:
        return result

    for concept, terms in PETROCHEMICAL_TERM_INDEX.items():

        matched_terms = []

        for term in terms:

            if _term_exists(normalized_text, term):
                matched_terms.append(term)

        if matched_terms:
            result[concept] = matched_terms

    return result


# ============================================================
# 6. Concept Similarity
# ============================================================

def calculate_concept_similarity(
    text_a: str,
    text_b: str,
) -> float:
    """
    شباهت مفهومی دو متن پتروشیمی.

    خروجی بین 0 و 1 است.

    مثال:

    Need:
        بهینه سازی مصرف انرژی کوره

    Supply:
        سیستم هوشمند کنترل کوره برای کاهش مصرف سوخت

    چون هر دو مفهوم furnace و energy/combustion دارند،
    امتیاز مفهومی بالاتر خواهد بود.
    """

    concepts_a = set(get_petrochemical_concepts(text_a))
    concepts_b = set(get_petrochemical_concepts(text_b))

    if not concepts_a or not concepts_b:
        return 0.0

    intersection = concepts_a.intersection(concepts_b)
    union = concepts_a.union(concepts_b)

    if not union:
        return 0.0

    return round(len(intersection) / len(union), 4)


# ============================================================
# 7. Weighted Concept Similarity
# ============================================================

CONCEPT_WEIGHTS = {
    "petrochemical": 1.5,

    "distillation": 1.3,
    "fractionation": 1.3,
    "separation": 1.2,
    "furnace": 1.5,
    "heat_exchanger": 1.4,
    "compressor": 1.4,
    "pump": 1.2,
    "reactor": 1.5,
    "boiler": 1.3,
    "cooling_system": 1.2,

    "process_control": 1.4,
    "instrumentation": 1.2,
    "monitoring": 1.1,

    "energy": 1.5,
    "combustion": 1.4,
    "steam": 1.2,
    "electricity": 1.1,

    "ai": 1.1,
    "digital_twin": 1.3,
    "digitalization": 1.0,
    "predictive_maintenance": 1.4,
    "fault_detection": 1.3,
    "optimization": 1.3,

    "emission": 1.4,
    "carbon": 1.3,
    "environment": 1.1,

    "safety": 1.5,
    "hazard": 1.5,
    "explosion": 1.7,
    "fire": 1.7,

    "maintenance": 1.2,
    "equipment": 1.1,

    "polymer": 1.2,
    "ethylene": 1.3,
    "propylene": 1.3,
    "methanol": 1.3,
    "ammonia": 1.3,
    "urea": 1.3,

    "production": 1.1,
    "efficiency": 1.2,
    "capacity": 1.0,
    "quality": 1.1,
    "downtime": 1.3,

    "process_simulation": 1.3,
    "soft_sensor": 1.2,
    "anomaly_detection": 1.3,
    "forecasting": 1.1,
}


def calculate_weighted_concept_similarity(
    text_a: str,
    text_b: str,
) -> float:
    """
    شباهت مفهومی وزن‌دار.

    مفاهیم مهم‌تر پتروشیمی وزن بیشتری دارند.
    """

    concepts_a = set(get_petrochemical_concepts(text_a))
    concepts_b = set(get_petrochemical_concepts(text_b))

    if not concepts_a or not concepts_b:
        return 0.0

    intersection = concepts_a.intersection(concepts_b)

    if not intersection:
        return 0.0

    intersection_weight = sum(
        CONCEPT_WEIGHTS.get(concept, 1.0)
        for concept in intersection
    )

    total_weight = sum(
        CONCEPT_WEIGHTS.get(concept, 1.0)
        for concept in concepts_a.union(concepts_b)
    )

    if total_weight == 0:
        return 0.0

    return round(intersection_weight / total_weight, 4)


# ============================================================
# 8. Important Concept Relationships
# ============================================================

CONCEPT_RELATIONS = {

    "furnace": {
        "related": [
            "energy",
            "combustion",
            "process_control",
            "monitoring",
            "heat_exchanger",
            "emission",
            "optimization",
            "predictive_maintenance",
        ]
    },

    "distillation": {
        "related": [
            "separation",
            "fractionation",
            "energy",
            "heat_exchanger",
            "process_control",
            "optimization",
            "monitoring",
        ]
    },

    "compressor": {
        "related": [
            "energy",
            "monitoring",
            "predictive_maintenance",
            "fault_detection",
            "process_control",
            "equipment",
        ]
    },

    "pump": {
        "related": [
            "energy",
            "maintenance",
            "predictive_maintenance",
            "fault_detection",
            "monitoring",
            "equipment",
        ]
    },

    "reactor": {
        "related": [
            "process_control",
            "temperature",
            "energy",
            "monitoring",
            "safety",
            "optimization",
        ]
    },

    "energy": {
        "related": [
            "furnace",
            "combustion",
            "steam",
            "heat_exchanger",
            "process_control",
            "optimization",
            "emission",
        ]
    },

    "predictive_maintenance": {
        "related": [
            "maintenance",
            "equipment",
            "monitoring",
            "fault_detection",
            "ai",
            "anomaly_detection",
        ]
    },

    "digital_twin": {
        "related": [
            "ai",
            "process_simulation",
            "monitoring",
            "optimization",
            "process_control",
        ]
    },
}


# ============================================================
# 9. Relation Boost
# ============================================================

def calculate_relation_score(
    concepts_a: Set[str],
    concepts_b: Set[str],
) -> float:
    """
    اگر دو متن Concept مشترک مستقیم نداشته باشند،
    ارتباط مفهومی غیرمستقیم را بررسی می‌کند.

    مثال:

    Need:
        کاهش مصرف انرژی کمپرسور

    Supply:
        سیستم نگهداری پیش‌بینانه کمپرسور

    حتی اگر energy و predictive_maintenance مستقیماً
    مشترک نباشند، ارتباط آن‌ها از طریق compressor
    قابل تشخیص است.
    """

    if not concepts_a or not concepts_b:
        return 0.0

    related_count = 0

    for concept_a in concepts_a:

        relation_data = CONCEPT_RELATIONS.get(
            concept_a,
            {}
        )

        related = set(
            relation_data.get("related", [])
        )

        if related.intersection(concepts_b):
            related_count += 1

    if related_count == 0:
        return 0.0

    return min(
        1.0,
        related_count / max(len(concepts_a), 1)
    )


# ============================================================
# 10. Risk Rules
# ============================================================

"""
Risk Engine

ریسک صرفاً از یک فیلد ثابت نمی‌آید.

از متن Need و Supply سیگنال‌های زیر استخراج می‌شوند:

High Risk:
    انفجار
    حریق
    فشار بالا
    دمای بسیار بالا
    مواد خطرناک
    گاز سمی
    H2S
    flammable
    toxic

Medium Risk:
    تجهیزات فرآیندی
    کمپرسور
    راکتور
    کوره
    فشار
    دما
    کنترل فرآیند
    تعمیرات

Low Risk:
    تحلیل داده
    داشبورد
    گزارش
    نرم‌افزار
    شبیه‌سازی
    مشاوره
"""

HIGH_RISK_TERMS = [
    "انفجار",
    "خطر انفجار",
    "حریق",
    "آتش سوزی",
    "آتش‌سوزی",
    "گاز سمی",
    "مواد سمی",
    "سمی",
    "خطرناک",
    "مواد خطرناک",
    "مواد قابل اشتعال",
    "قابل اشتعال",
    "فشار بسیار بالا",
    "فشار بالا",
    "دمای بسیار بالا",
    "نشتی گاز",
    "نشت گاز",
    "نشت مواد",
    "h2s",
    "hydrogen sulfide",
    "toxic gas",
    "flammable",
    "explosive",
    "explosion",
    "fire hazard",
    "fire risk",
    "high pressure",
    "high temperature",
    "hazardous material",
    "toxic material",
]


MEDIUM_RISK_TERMS = [
    "کوره",
    "راکتور",
    "کمپرسور",
    "مبدل حرارتی",
    "بویلر",
    "پمپ",
    "مخزن",
    "خط لوله",
    "فرآیند",
    "فرایند",
    "کنترل فرآیند",
    "کنترل فرایند",
    "ابزار دقیق",
    "تعمیرات",
    "نگهداری",
    "تجهیزات",
    "فشار",
    "دما",
    "احتراق",
    "گاز",
    "بخار",
    "process equipment",
    "reactor",
    "compressor",
    "furnace",
    "boiler",
    "pump",
    "pipeline",
    "process control",
    "maintenance",
    "equipment",
    "pressure",
    "temperature",
]


LOW_RISK_TERMS = [
    "داشبورد",
    "گزارش",
    "تحلیل داده",
    "تحلیل",
    "مشاوره",
    "آموزش",
    "نرم افزار",
    "نرم‌افزار",
    "نرم افزاری",
    "شبیه سازی",
    "شبیه‌سازی",
    "مدل سازی",
    "مدل‌سازی",
    "پایش داده",
    "پیش بینی",
    "پیش‌بینی",
    "dashboard",
    "report",
    "data analysis",
    "consulting",
    "software",
    "simulation",
    "modeling",
    "forecasting",
]


# ============================================================
# 11. Risk Signal Extraction
# ============================================================

def _count_terms(
    normalized_text: str,
    terms: List[str],
) -> Tuple[int, List[str]]:

    count = 0
    matched = []

    for term in terms:

        normalized_term = normalize_petrochemical_text(term)

        if normalized_term and normalized_term in normalized_text:
            count += 1
            matched.append(normalized_term)

    return count, matched


def get_risk_signals(text: str) -> Dict:
    """
    سیگنال‌های ریسک موجود در متن را استخراج می‌کند.

    خروجی:

    {
        "high": 2,
        "medium": 3,
        "low": 0,
        "high_terms": [...],
        "medium_terms": [...],
        "low_terms": [...]
    }
    """

    normalized_text = normalize_petrochemical_text(text)

    high_count, high_terms = _count_terms(
        normalized_text,
        HIGH_RISK_TERMS,
    )

    medium_count, medium_terms = _count_terms(
        normalized_text,
        MEDIUM_RISK_TERMS,
    )

    low_count, low_terms = _count_terms(
        normalized_text,
        LOW_RISK_TERMS,
    )

    return {
        "high": high_count,
        "medium": medium_count,
        "low": low_count,
        "high_terms": high_terms,
        "medium_terms": medium_terms,
        "low_terms": low_terms,
    }


# ============================================================
# 12. Risk Level
# ============================================================

def calculate_risk_level(text: str) -> str:
    """
    تعیین Rule-Based سطح ریسک.

    خروجی:

        low
        medium
        high
    """

    signals = get_risk_signals(text)

    high = signals["high"]
    medium = signals["medium"]

    # وجود هر سیگنال بسیار خطرناک
    # باعث High Risk می‌شود.
    if high >= 1:
        return "high"

    # چند سیگنال Medium
    if medium >= 2:
        return "medium"

    # یک سیگنال Medium
    if medium == 1:
        return "medium"

    return "low"


# ============================================================
# 13. Risk Score
# ============================================================

def calculate_risk_score(text: str) -> float:
    """
    امتیاز ریسک بین 0 تا 100.

    این امتیاز برای آینده بسیار مفید است
    چون فقط risk_level سه‌حالته نیست.

    High signals:
        +30

    Medium signals:
        +12

    Low signals:
        -5
    """

    signals = get_risk_signals(text)

    score = 0.0

    score += signals["high"] * 30
    score += signals["medium"] * 12
    score -= signals["low"] * 5

    score = max(0.0, min(100.0, score))

    return round(score, 2)


# ============================================================
# 14. Need + Supply Risk
# ============================================================

def calculate_combined_risk(
    need_text: str,
    supply_text: str,
) -> Dict:
    """
    ریسک Need و Supply را با هم بررسی می‌کند.

    برای Matching واقعی بهتر است ریسک فقط از Supply
    گرفته نشود.

    اگر Need خطرناک باشد و Supply نیز خطرناک باشد،
    ریسک نهایی افزایش پیدا می‌کند.
    """

    need_score = calculate_risk_score(need_text)
    supply_score = calculate_risk_score(supply_text)

    combined_score = (
        need_score * 0.55
        +
        supply_score * 0.45
    )

    if combined_score >= 60:
        level = "high"
    elif combined_score >= 25:
        level = "medium"
    else:
        level = "low"

    return {
        "risk_level": level,
        "risk_score": round(combined_score, 2),
        "need_risk_score": need_score,
        "supply_risk_score": supply_score,
        "need_signals": get_risk_signals(need_text),
        "supply_signals": get_risk_signals(supply_text),
    }


# ============================================================
# 15. Risk Penalty for Matching
# ============================================================

def calculate_risk_penalty(
    need_text: str,
    supply_text: str,
) -> float:
    """
    جریمه ریسک برای Match Score.

    خروجی بین 0 و 0.30 است.

    مثال:

    Match = 90%
    Risk Penalty = 0.15

    Final Match:
        90 * (1 - 0.15)
        = 76.5
    """

    risk = calculate_combined_risk(
        need_text,
        supply_text,
    )

    score = risk["risk_score"]

    if score >= 70:
        return 0.30

    if score >= 50:
        return 0.20

    if score >= 30:
        return 0.10

    if score >= 15:
        return 0.05

    return 0.0


# ============================================================
# 16. Final Petrochemical Matching Features
# ============================================================

def extract_matching_features(
    need_text: str,
    supply_text: str,
) -> Dict:
    """
    تمام Featureهای Domain Matching را یکجا استخراج می‌کند.

    این تابع نقطه اتصال Dictionary با Matching Engine است.
    """

    need_concepts = set(
        get_petrochemical_concepts(need_text)
    )

    supply_concepts = set(
        get_petrochemical_concepts(supply_text)
    )

    common_concepts = (
        need_concepts.intersection(
            supply_concepts
        )
    )

    concept_similarity = calculate_concept_similarity(
        need_text,
        supply_text,
    )

    weighted_similarity = (
        calculate_weighted_concept_similarity(
            need_text,
            supply_text,
        )
    )

    relation_score = calculate_relation_score(
        need_concepts,
        supply_concepts,
    )

    risk = calculate_combined_risk(
        need_text,
        supply_text,
    )

    risk_penalty = calculate_risk_penalty(
        need_text,
        supply_text,
    )

    return {
        "need_concepts": sorted(need_concepts),
        "supply_concepts": sorted(supply_concepts),
        "common_concepts": sorted(common_concepts),

        "concept_similarity": concept_similarity,
        "weighted_concept_similarity": weighted_similarity,
        "relation_score": round(relation_score, 4),

        "risk_level": risk["risk_level"],
        "risk_score": risk["risk_score"],
        "risk_penalty": risk_penalty,

        "need_risk_score": risk["need_risk_score"],
        "supply_risk_score": risk["supply_risk_score"],

        "need_risk_signals": risk["need_signals"],
        "supply_risk_signals": risk["supply_signals"],
    }


# ============================================================
# 17. Final Match Score
# ============================================================

def calculate_domain_match_score(
    need_text: str,
    supply_text: str,
    base_score: float = 0.0,
) -> Dict:
    """
    امتیاز نهایی Domain-based Matching.

    base_score می‌تواند امتیازی باشد که موتور اصلی Matching
    قبلاً محاسبه کرده است.

    Dictionary سپس آن را با اطلاعات دامنه‌ای تقویت می‌کند.
    """

    features = extract_matching_features(
        need_text,
        supply_text,
    )

    domain_score = (
        features["weighted_concept_similarity"] * 60
        +
        features["relation_score"] * 20
    )

    # اگر Concept مشترک وجود داشته باشد
    if features["common_concepts"]:
        domain_score += 20

    domain_score = min(
        100.0,
        domain_score,
    )

    # ترکیب با امتیاز پایه
    if base_score > 0:
        final_score = (
            base_score * 0.65
            +
            domain_score * 0.35
        )
    else:
        final_score = domain_score

    # اعمال Risk Penalty
    final_score = final_score * (
        1 - features["risk_penalty"]
    )

    final_score = max(
        0.0,
        min(100.0, final_score),
    )

    return {
        **features,
        "domain_match_score": round(
            domain_score,
            2,
        ),
        "final_match_score": round(
            final_score,
            2,
        ),
    }


# ============================================================
# 18. Utility
# ============================================================

def is_petrochemical_related(text: str) -> bool:
    """
    بررسی می‌کند آیا متن اساساً به حوزه پتروشیمی مربوط است یا خیر.
    """

    concepts = get_petrochemical_concepts(text)

    return len(concepts) > 0


def get_concept_label(concept: str) -> str:
    """
    Label فارسی Concept.
    """

    labels = {
        "distillation": "تقطیر",
        "fractionation": "تفکیک",
        "separation": "جداسازی",
        "furnace": "کوره",
        "heat_exchanger": "مبدل حرارتی",
        "compressor": "کمپرسور",
        "pump": "پمپ",
        "reactor": "راکتور",
        "boiler": "بویلر",
        "cooling_system": "سیستم خنک‌کننده",
        "separator": "جداکننده",
        "tank": "مخزن",
        "pipeline": "خط لوله",
        "petrochemical": "پتروشیمی",
        "refinery": "پالایشگاه",
        "process_unit": "واحد فرآیندی",
        "production_line": "خط تولید",
        "energy": "انرژی",
        "combustion": "احتراق",
        "steam": "بخار",
        "electricity": "برق",
        "process_control": "کنترل فرآیند",
        "instrumentation": "ابزار دقیق",
        "monitoring": "پایش",
        "ai": "هوش مصنوعی",
        "digital_twin": "دوقلوی دیجیتال",
        "digitalization": "دیجیتالی‌سازی",
        "predictive_maintenance": "نگهداری پیش‌بینانه",
        "fault_detection": "تشخیص خرابی",
        "optimization": "بهینه‌سازی",
        "emission": "آلایندگی",
        "carbon": "کربن",
        "environment": "محیط زیست",
        "safety": "ایمنی",
        "hazard": "خطر",
        "explosion": "انفجار",
        "fire": "حریق",
        "maintenance": "نگهداری و تعمیرات",
        "equipment": "تجهیزات",
        "polymer": "پلیمر",
        "ethylene": "اتیلن",
        "propylene": "پروپیلن",
        "methanol": "متانول",
        "ammonia": "آمونیاک",
        "urea": "اوره",
        "gas": "گاز",
        "production": "تولید",
        "efficiency": "بهره‌وری",
        "capacity": "ظرفیت",
        "quality": "کیفیت",
        "downtime": "توقف تولید",
        "process_simulation": "شبیه‌سازی فرآیند",
        "soft_sensor": "سنسور نرم",
        "anomaly_detection": "تشخیص ناهنجاری",
        "forecasting": "پیش‌بینی",
    }

    return labels.get(
        concept,
        concept,
    )