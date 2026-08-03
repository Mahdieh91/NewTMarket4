'use client';

import { useEffect, useState } from 'react';
import { Star, CheckCircle, AlertCircle, X, BarChart3 } from 'lucide-react';

interface MatchResult {
  id: number;
  title: string;
  provider: string;
  providerRating: number;
  matchPercentage: number;
  price: string;
  deliveryTime: string;
  trl: number;
  mrl: number;
  riskLevel: string;
  description: string;
}

const allMatches: MatchResult[] = [
  {
    id: 1,
    title: 'سامانه پایش هوشمند کوره',
    provider: 'شرکت فناوران نوین',
    providerRating: 4.8,
    matchPercentage: 94,
    price: '۴۵۰ میلیون تومان',
    deliveryTime: '۴ ماه',
    trl: 8,
    mrl: 7,
    riskLevel: 'low',
    description: 'سامانه مبتنی بر هوش مصنوعی...',
  },
  {
    id: 2,
    title: 'خدمات مشاوره بهینه‌سازی انرژی',
    provider: 'مهندسین مشاور انرژی پویا',
    providerRating: 4.5,
    matchPercentage: 87,
    price: '۳۰۰ میلیون تومان',
    deliveryTime: '۶ ماه',
    trl: 9,
    mrl: 8,
    riskLevel: 'low',
    description: 'خدمات جامع ممیزی انرژی...',
  },
  {
    id: 3,
    title: 'دوقلوی دیجیتال کوره',
    provider: 'هوشمندسازان یزد',
    providerRating: 4.6,
    matchPercentage: 82,
    price: '۸۰۰ میلیون تومان',
    deliveryTime: '۸ ماه',
    trl: 6,
    mrl: 5,
    riskLevel: 'medium',
    description: 'مدل دوقلوی دیجیتال کوره...',
  },
  {
    id: 4,
    title: 'سیستم کنترل پیشرفته APC',
    provider: 'کنترل صنعتی پارس',
    providerRating: 4.3,
    matchPercentage: 76,
    price: '۶۰۰ میلیون تومان',
    deliveryTime: '۵ ماه',
    trl: 9,
    mrl: 9,
    riskLevel: 'medium',
    description: 'سیستم کنترل پیشرفته فرآیند...',
  },
  {
    id: 5,
    title: 'مشاوره تخصصی احتراق صنعتی',
    provider: 'دکتر احمدی',
    providerRating: 4.9,
    matchPercentage: 71,
    price: '۲۰۰ میلیون تومان',
    deliveryTime: '۳ ماه',
    trl: 9,
    mrl: 6,
    riskLevel: 'low',
    description: 'مشاوره تخصصی در زمینه بهینه‌سازی احتراق...',
  },
];

const parsePersianNumber = (str: string): number => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let result = str;
  for (let i = 0; i < persianDigits.length; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), englishDigits[i]);
  }
  return parseInt(result, 10);
};

const extractPriceNumber = (priceStr: string): number => {
  const match = priceStr.match(/[\d۰-۹]+/);
  if (match) {
    return parsePersianNumber(match[0]);
  }
  return 0;
};

export default function ComparePage() {
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [items, setItems] = useState<MatchResult[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('compareList');
    if (saved) {
      try {
        const ids = JSON.parse(saved) as number[];
        setCompareIds(ids);
        const selected = allMatches.filter((m) => ids.includes(m.id));
        setItems(selected);
      } catch {
        localStorage.removeItem('compareList');
      }
    }
  }, []);

  const removeItem = (id: number) => {
    const newIds = compareIds.filter((cid) => cid !== id);
    setCompareIds(newIds);
    localStorage.setItem('compareList', JSON.stringify(newIds));
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (items.length === 0) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-50 flex items-center justify-center"
        style={{ fontFamily: "'Vazir', 'Vazirmatn', Tahoma, sans-serif" }}
      >
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm">
          <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-700 mb-2">موردی برای مقایسه انتخاب نشده</h2>
        </div>
      </main>
    );
  }

  const metrics = [
    { key: 'matchPercentage', label: 'درصد انطباق', unit: '٪', max: 100 },
    { key: 'providerRating', label: 'امتیاز ارائه‌دهنده', unit: '', max: 5 },
    { key: 'trl', label: 'TRL', unit: '/۹', max: 9 },
    { key: 'mrl', label: 'MRL', unit: '/۹', max: 9 },
    { key: 'price', label: 'قیمت (میلیون تومان)', unit: '', max: 1000 },
  ];

  const barColors = [
    'bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6]',
    'bg-gradient-to-r from-[#D4A547] to-[#F59E0B]',
    'bg-gradient-to-r from-[#10B981] to-[#34D399]',
    'bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]',
    'bg-gradient-to-r from-[#EC4899] to-[#F472B6]',
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 p-4 md:p-6"
      style={{ fontFamily: "'Vazir', 'Vazirmatn', Tahoma, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">مقایسه راهکارها</h1>
          </div>
          <span className="text-sm text-slate-500">{items.length} مورد انتخاب شده</span>
        </div>

        {/* جدول مقایسه */}
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="p-4 text-right font-bold text-slate-700 min-w-[160px]">ویژگی</th>
                {items.map((item) => (
                  <th key={item.id} className="p-4 text-center font-bold text-slate-700 min-w-[200px] relative">
                    {item.title}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-2 left-2 text-slate-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-4 font-medium text-slate-600">ارائه‌دهنده</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 text-center">{item.provider}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-600">امتیاز</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star size={14} className="text-[#D4A547] fill-[#D4A547]" />
                      {item.providerRating}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-600">درصد انطباق</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 text-center">
                    <span className={`font-bold ${item.matchPercentage >= 90 ? 'text-emerald-600' : 'text-[#14B8A6]'}`}>
                      {item.matchPercentage}٪
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-600">قیمت</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 text-center">{item.price}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-600">زمان تحویل</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 text-center">{item.deliveryTime}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-600">TRL</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 text-center">{item.trl}/۹</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-600">MRL</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 text-center">{item.mrl}/۹</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-600">ریسک</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 text-center">
                    {item.riskLevel === 'low' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle size={14} /> پایین
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <AlertCircle size={14} /> متوسط
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-600">توضیحات</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 text-xs leading-relaxed">{item.description}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* بخش نمودار میله‌ای */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <BarChart3 size={24} className="text-[#1E3A8A]" />
            نمودار مقایسه
          </h2>

          <div className="space-y-8">
            {metrics.map((metric) => {
              const values = items.map((item) => {
                if (metric.key === 'price') {
                  return extractPriceNumber(item.price);
                }
                return (item as any)[metric.key] as number;
              });

              const maxValue = Math.max(...values, 1);
              const scale = metric.max ? metric.max : maxValue;

              return (
                <div key={metric.key}>
                  <h3 className="text-sm font-extrabold text-slate-700 mb-3">{metric.label}</h3>
                  <div className="space-y-3">
                    {items.map((item, idx) => {
                      const rawValue = metric.key === 'price' ? extractPriceNumber(item.price) : (item as any)[metric.key];
                      const percentWidth = (rawValue / scale) * 100;
                      const displayValue = metric.key === 'price' ? `${rawValue}` : `${rawValue}${metric.unit}`;

                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <span className="w-32 text-xs font-medium text-slate-600 truncate" title={item.title}>
                            {item.title}
                          </span>
                          <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barColors[idx % barColors.length]}`}
                              style={{ width: `${Math.min(percentWidth, 100)}%` }}
                            />
                          </div>
                          <span className="w-16 text-xs font-bold text-slate-700 text-left">{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}