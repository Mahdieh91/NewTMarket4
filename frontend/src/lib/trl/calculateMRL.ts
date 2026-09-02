// src/lib/trl/calculateMRL.ts
import { Answer, AnswerValue, AssessmentResult } from './types';
import { MRL_QUESTIONS } from '@/data/mrlQuestions';

// توضیحات سطوح MRL بر اساس استانداردهای صنعتی (سطح ۱ تا ۱۰)
const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: 'شناسایی اولیه تأثیرات تولید بر فناوری.',
  2: 'مفهوم تولید و کاربردهای آن فرموله شده است.',
  3: 'مفهوم تولید با تحلیل یا آزمایش اثبات شده است.',
  4: 'قابلیت‌های تولید در محیط آزمایشگاهی تأیید شده است.',
  5: 'تولید قطعات کلیدی در محیط مرتبط با تولید واقعی انجام شده است.',
  6: 'تولید زیرسیستم‌ها در محیطی شبیه‌سازی‌شده از تولید واقعی انجام شده است.',
  7: 'تولید سیستم کامل در محیط شبیه‌سازی‌شده از عملیات واقعی انجام شده است.',
  8: 'تولید در محیط عملیاتی واقعی با کیفیت و هزینه قابل قبول انجام شده است.',
  9: 'تولید در مقیاس کامل آزمایشی با موفقیت انجام شده است.',
  10: 'تولید کامل و پذیرفته‌شده در حال اجرا با فرآیندهای بهبود مستمر است.',
};

export function calculateMRL(answers: Answer[]): AssessmentResult {
  const answerMap = new Map<string, AnswerValue>();
  answers.forEach((a) => answerMap.set(a.questionId, a.value));

  let highestMRL = 0;
  const achieved: number[] = [];

  // MRL دارای ۱۰ سطح است
  for (let level = 1; level <= 10; level++) {
    const levelQuestions = MRL_QUESTIONS[level]?.questions || [];
    if (levelQuestions.length === 0) continue;

    const allYes = levelQuestions.every((q) => answerMap.get(q.id) === 'yes');
    if (allYes) {
      highestMRL = level;
      achieved.push(level);
    } else {
      break; // سطوح بالاتر نیز محقق نشده‌اند
    }
  }

  const nextLevel = highestMRL < 10 ? highestMRL + 1 : null;
  let failedCriteria: { questionId: string; text: string; answer: AnswerValue }[] = [];
  let suggestions: string[] = [];

  if (nextLevel) {
    const nextQuestions = MRL_QUESTIONS[nextLevel]?.questions || [];
    failedCriteria = nextQuestions
      .map((q) => ({
        questionId: q.id,
        text: q.text,
        answer: answerMap.get(q.id) || 'unknown',
      }))
      .filter((item) => item.answer !== 'yes');

    suggestions = [
      'برای معیارهای نامحقق، فرآیندهای تولید را بهبود دهید.',
      'مدارک و شواهد مستند برای ادعاهای تولیدی خود تهیه کنید.',
      'در صورت نیاز با کارشناسان تولید و صنعت مشورت کنید.',
    ];
  }

  const achievedLevels = achieved.map((lvl) => ({
    level: lvl,
    description: LEVEL_DESCRIPTIONS[lvl] || '',
  }));

  return {
    mrl: highestMRL,  // استفاده از فیلد mrl در نتیجه
    status: highestMRL > 0 ? `معیارهای MRL ۱ تا ${highestMRL} احراز شده‌اند.` : 'هیچ سطحی احراز نشده است.',
    nextLevel,
    failedCriteria,
    suggestions,
    achievedLevels,
  };
}