// src/app/trl/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TRL_QUESTIONS } from '@/data/trlQuestions';
import { Answer, AnswerValue, AssessmentResult as AssessmentResultType } from '@/lib/trl/types';
import { calculateTRL } from '@/lib/trl/calculateTRL';
import AssessmentQuestion from '@/components/AssessmentQuestion';
import AssessmentResult from '@/components/AssessmentResult';
import { useAuthStore } from '@/store/auth-store';

// ===== کامپوننت Toast =====
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'warning' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-50 border-emerald-500 text-emerald-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    warning: 'bg-amber-50 border-amber-500 text-amber-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800',
  };

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  return (
    <div
      className={`fixed top-6 right-6 max-w-md z-50 p-4 pr-6 rounded-2xl border-r-4 shadow-xl animate-slide-down ${colors[type]}`}
      style={{ direction: 'rtl' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{icons[type]}</span>
        <p className="text-sm leading-relaxed flex-1">{message}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
      </div>
    </div>
  );
}

// ===== دکمه‌های ناوبری شناور =====
function FloatingNavButtons({ onScrollTop, onScrollBottom }: { onScrollTop: () => void; onScrollBottom: () => void }) {
  const [showButtons, setShowButtons] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const isNearBottom = scrollY + windowHeight >= documentHeight - 300;
      const isNearTop = scrollY < 200;
      setShowButtons(!isNearTop || !isNearBottom);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-2">
      <button onClick={onScrollTop} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-110" title="رفتن به بالای صفحه">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
      </button>
      <button onClick={onScrollBottom} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-110" title="پرش به پایین فرم">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>
      </button>
    </div>
  );
}

export default function TRLPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return') || '/supply/register';
  const supplyId = searchParams.get('supply_id');

  const { isAuthenticated, accessToken } = useAuthStore();

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [result, setResult] = useState<AssessmentResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [mounted, setMounted] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      showToast('برای ذخیره ارزیابی، ابتدا وارد حساب کاربری خود شوید.', 'warning');
    }
  }, [mounted, isAuthenticated]);

  const getAnswerValue = (questionId: string): AnswerValue | '' => {
    const found = answers.find((a) => a.questionId === questionId);
    return found?.value || '';
  };

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      if (existing) {
        return prev.map((a) => (a.questionId === questionId ? { ...a, value } : a));
      }
      return [...prev, { questionId, value }];
    });
  };

  const handleEvidenceChange = (questionId: string, evidence: string) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      if (existing) {
        return prev.map((a) => (a.questionId === questionId ? { ...a, evidence } : a));
      }
      return [...prev, { questionId, value: 'unknown', evidence }];
    });
  };

  const selectAllForLevel = (level: number, value: AnswerValue) => {
    const levelQuestions = TRL_QUESTIONS[level]?.questions || [];
    setAnswers((prev) => {
      const newAnswers = [...prev];
      levelQuestions.forEach((q) => {
        const existing = newAnswers.find((a) => a.questionId === q.id);
        if (existing) {
          existing.value = value;
        } else {
          newAnswers.push({ questionId: q.id, value });
        }
      });
      return newAnswers;
    });
    const label = value === 'yes' ? 'بله' : value === 'no' ? 'خیر' : value === 'partial' ? 'تاحدی' : 'نامشخص';
    showToast(`همه سوالات سطح ${level} به "${label}" تنظیم شدند`, 'info');
  };

  const isLevelComplete = (level: number): boolean => {
    const levelQuestions = TRL_QUESTIONS[level]?.questions || [];
    return levelQuestions.every((q) => {
      const ans = answers.find((a) => a.questionId === q.id);
      return ans && ans.value !== '';
    });
  };

  const getLevelStatus = (level: number): { answered: number; total: number } => {
    const levelQuestions = TRL_QUESTIONS[level]?.questions || [];
    const answered = levelQuestions.filter((q) => {
      const ans = answers.find((a) => a.questionId === q.id);
      return ans && ans.value !== '';
    }).length;
    return { answered, total: levelQuestions.length };
  };

  const toggleLevel = (level: number) => {
    setExpandedLevels((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const scrollToTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const scrollToSubmit = () => submitButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !accessToken) {
      showToast('لطفاً ابتدا وارد حساب کاربری خود شوید.', 'error');
      return;
    }

    if (!agreed) {
      showToast('لطفاً تأییدیه صحت اطلاعات را علامت بزنید.', 'warning');
      document.querySelector('.trl-confirmation-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const level1Questions = TRL_QUESTIONS[1]?.questions.map(q => q.id) || [];
    const answeredIds = answers.map(a => a.questionId);
    const missingLevel1 = level1Questions.filter(id => !answeredIds.includes(id));
    if (missingLevel1.length > 0) {
      showToast('لطفاً به همه سوالات سطح ۱ (TRL 1) پاسخ دهید.', 'error');
      return;
    }

    setLoading(true);

    const answersPayload: Record<string, { value: string; evidence?: string }> = {};
    answers.forEach((a) => {
      answersPayload[a.questionId] = { value: a.value };
      if (a.evidence) answersPayload[a.questionId].evidence = a.evidence;
    });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const body: any = { answers: answersPayload };
      if (supplyId) body.supply_id = parseInt(supplyId);

      const response = await fetch(`${API_URL}/trl/assess/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401) {
          showToast('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.', 'error');
          setLoading(false);
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ذخیره ارزیابی');
      }

      const data = await response.json();
      const quickResult = calculateTRL(answers);
      setResult(quickResult);
      localStorage.setItem('last_trl_assessment_id', String(data.assessment_id));
      
      // ===== نمایش پیام موفقیت =====
      showToast(` TRL: ${data.trl}`, 'success');
      
    } catch (error: any) {
      showToast(error.message || 'خطا در ارتباط با سرور', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="trl-page-container" dir="rtl">
        <div className="trl-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ marginTop: '1rem', color: '#6b7a8f' }}>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trl-page-container" dir="rtl" ref={topRef}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <FloatingNavButtons onScrollTop={scrollToTop} onScrollBottom={scrollToSubmit} />

      <div className="trl-card">
        <div className="trl-header">
          <h1 className="trl-title">ارزیابی سطح آمادگی فناوری</h1>
          <p className="trl-subtitle">Technology Readiness Level (TRL)</p>
          <div className="trl-badge-info"><span>⚡ فقط سوالات سطح ۱ اجباری هستند</span></div>
          {!isAuthenticated && (
            <div className="trl-auth-warning">
              ⚠️ برای ذخیره ارزیابی،{' '}
              <button
                onClick={() => router.push(`/login?next=/trl?return=${encodeURIComponent(returnUrl)}`)}
                className="trl-login-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}
              >
                وارد حساب کاربری
              </button>{' '}
              شوید.
            </div>
          )}
        </div>

        <div className="trl-intro">
          <div className="trl-intro-box">
            <div className="trl-intro-icon">📋</div>
            <div>
              <h3>راهنمای تکمیل ارزیابی</h3>
              <p>سطح آمادگی فناوری (TRL) به‌عنوان یکی از معیارهای معتبر بین‌المللی، میزان بلوغ فناوری را از مرحله‌ی پژوهش‌های بنیادین تا استقرار عملیاتی مورد سنجش قرار می‌دهد.</p>
              <p><strong>این ارزیابی صرفاً بر مبنای وضعیت عینی، مستند و فعلی فناوری قابل پذیرش است. هرگونه ادعای غیرمستند، برآوردی یا مبتنی بر برنامه‌های آتی، مبنای ارزیابی قرار نخواهد گرفت.</strong></p>
              <div className="trl-responsibility">
                <strong>مسئولیت کامل صحت، جامعیت، قابلیت استناد و به‌روزبودن اطلاعات و مستندات ارائه‌شده، بر عهده‌ی ارائه‌دهنده‌ی فناوری بوده و هرگونه عواقب ناشی از اطلاعات نادرست یا گمراه‌کننده، متوجه ارائه‌دهنده خواهد بود.</strong>
              </div>
            </div>
          </div>

          <div className={`trl-confirmation-box ${!agreed ? 'border-red-500 border-2' : ''}`}>
            <label className="trl-confirmation-label">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="trl-confirmation-checkbox"
              />
              <div>
                <strong>تعهد و تأیید صحت اطلاعات <span style={{ color: '#dc2626' }}>*</span></strong>
                <p className="trl-confirmation-text">
                  با انتخاب این گزینه، من به‌عنوان نماینده‌ی قانونی ارائه‌دهنده‌ی فناوری، تأیید می‌کنم که:
                  <br />
                  <span style={{ display: 'block', marginTop: '0.5rem' }}>
                    ۱. تمامی پاسخ‌های ثبت‌شده در این فرم، مبتنی بر <strong>وضعیت واقعی، کنونی و مستند</strong> فناوری است.
                  </span>
                  <span style={{ display: 'block' }}>
                    ۲. هیچ‌یک از پاسخ‌ها مبتنی بر پیش‌بینی، برنامه‌های آتی یا ادعای فاقد شواهد کافی نمی‌باشد.
                  </span>
                  <span style={{ display: 'block' }}>
                    ۳. در صورت درخواست، <strong>مدارک و شواهد</strong> پشتیبان هر پاسخ، قابل ارائه خواهد بود.
                  </span>
                  <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                    ⚠️ تخلف از هر یک از بندهای فوق، موجب بی‌اعتباری این ارزیابی و پیگرد قانونی وفق مقررات خواهد شد.
                  </span>
                  <span style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.8rem', color: '#dc2626', fontWeight: 'bold' }}>
                    (این گزینه برای ثبت ارزیابی الزامی است)
                  </span>
                </p>
              </div>
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="trl-form">
          {Object.entries(TRL_QUESTIONS).map(([level, levelData]) => {
            const levelNum = parseInt(level);
            const { answered, total } = getLevelStatus(levelNum);
            const isComplete = isLevelComplete(levelNum);
            const isExpanded = expandedLevels[levelNum] !== false;
            const isRequired = levelNum === 1;
            const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

            return (
              <div key={level} className={`trl-level-card ${isComplete ? 'complete' : ''} ${isRequired ? 'required' : ''}`}>
                <div className="trl-level-header" onClick={() => toggleLevel(levelNum)}>
                  <div className="trl-level-info">
                    <span className={`trl-level-number ${isComplete ? 'complete' : ''}`}>{levelNum}</span>
                    <span className="trl-level-label">{levelData.label}</span>
                    {isRequired && <span className="trl-required-badge">اجباری</span>}
                    {isComplete && <span className="trl-complete-badge">✓ کامل</span>}
                  </div>
                  <div className="trl-level-stats">
                    <div className="trl-progress-bar">
                      <div className="trl-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className={`trl-level-status ${isComplete ? 'complete' : 'incomplete'}`}>{answered}/{total}</span>
                    <button type="button" className="trl-level-toggle" onClick={(e) => { e.stopPropagation(); toggleLevel(levelNum); }}>{isExpanded ? '−' : '+'}</button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="trl-level-content">
                    <div className="trl-bulk-actions">
                      <span className="trl-bulk-label">انتخاب گروهی:</span>
                      <button type="button" className="trl-bulk-btn trl-bulk-yes" onClick={() => selectAllForLevel(levelNum, 'yes')}>✅ بله</button>
                      <button type="button" className="trl-bulk-btn trl-bulk-no" onClick={() => selectAllForLevel(levelNum, 'no')}>❌ خیر</button>
                      <button type="button" className="trl-bulk-btn trl-bulk-partial" onClick={() => selectAllForLevel(levelNum, 'partial')}>🟡 تاحدی</button>
                      <button type="button" className="trl-bulk-btn trl-bulk-unknown" onClick={() => selectAllForLevel(levelNum, 'unknown')}>⚪ نامشخص</button>
                    </div>

                    <div className="trl-questions">
                      {levelData.questions.map((q) => (
                        <AssessmentQuestion
                          key={q.id}
                          id={q.id}
                          text={q.text}
                          value={getAnswerValue(q.id)}
                          onChange={handleAnswerChange}
                          onEvidenceChange={handleEvidenceChange}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button
            ref={submitButtonRef}
            type="submit"
            disabled={loading}
            className={`trl-submit-btn ${loading ? 'disabled' : ''}`}
          >
            {loading ? (
              <><span className="trl-spinner" /> در حال ذخیره...</>
            ) : (
              ' ثبت ارزیابی'
            )}
          </button>
        </form>

        <AssessmentResult result={result} title="TRL" returnUrl={returnUrl} />
      </div>
    </div>
  );
}