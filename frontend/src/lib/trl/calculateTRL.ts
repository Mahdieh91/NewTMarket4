// frontend/lib/trl/calculateTRL.ts
import { Answer, AnswerValue, AssessmentResult } from './types';
import { TRL_QUESTIONS } from '@/data/trlQuestions';

const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: 'اصول پایه علمی مشاهده و گزارش شده‌اند.',
  2: 'مفهوم فناوری و کاربرد عملی آن فرموله شده است.',
  3: 'اثبات مفهوم (Proof of Concept) با تحلیل یا آزمایش نشان داده شده است.',
  4: 'اجزا یا نمونه آزمایشگاهی در محیط آزمایشگاهی اعتبارسنجی شده‌اند.',
  5: 'فناوری در محیط مرتبط با کاربرد واقعی اعتبارسنجی شده است.',
  6: 'نمونه اولیه عملکردی در محیط مرتبط نمایش داده شده است.',
  7: 'نمونه اولیه یکپارچه در محیط عملیاتی واقعی نمایش داده شده است.',
  8: 'سیستم نهایی در محیط عملیاتی اثبات شده است.',
  9: 'فناوری در محیط عملیاتی مستقر و پذیرفته شده است.',
};

export function calculateTRL(answers: Answer[]): AssessmentResult {
  const answerMap = new Map<string, AnswerValue>();
  answers.forEach((a) => answerMap.set(a.questionId, a.value));

  let highestTRL = 0;
  const achieved: number[] = [];

  for (let level = 1; level <= 9; level++) {
    const levelQuestions = TRL_QUESTIONS[level]?.questions || [];
    if (levelQuestions.length === 0) continue;

    const allYes = levelQuestions.every((q) => answerMap.get(q.id) === 'yes');
    if (allYes) {
      highestTRL = level;
      achieved.push(level);
    } else {
      break;
    }
  }

  const nextLevel = highestTRL < 9 ? highestTRL + 1 : null;
  let failedCriteria: { questionId: string; text: string; answer: AnswerValue }[] = [];
  let suggestions: string[] = [];

  if (nextLevel) {
    const nextQuestions = TRL_QUESTIONS[nextLevel]?.questions || [];
    failedCriteria = nextQuestions
      .map((q) => ({
        questionId: q.id,
        text: q.text,
        answer: answerMap.get(q.id) || 'unknown',
      }))
      .filter((item) => item.answer !== 'yes');

    suggestions = [
      'برای معیارهای نامحقق، آزمایش‌های تکمیلی انجام دهید.',
      'مدارک و شواهد مستند برای ادعاهای خود تهیه کنید.',
      'در صورت نیاز با کارشناسان حوزه مشورت کنید.',
    ];
  }

  const achievedLevels = achieved.map((lvl) => ({
    level: lvl,
    description: LEVEL_DESCRIPTIONS[lvl] || '',
  }));

  return {
    trl: highestTRL,
    status: highestTRL > 0 ? `معیارهای TRL ۱ تا ${highestTRL} احراز شده‌اند.` : 'هیچ سطحی احراز نشده است.',
    nextLevel,
    failedCriteria,
    suggestions,
    achievedLevels,
  };
}