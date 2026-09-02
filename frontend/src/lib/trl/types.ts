// frontend/lib/trl/types.ts
export type AnswerValue = 'yes' | 'no' | 'partial' | 'unknown';

export interface Question {
  id: string;
  level: number;
  text: string;
}

export interface Answer {
  questionId: string;
  value: AnswerValue;
  evidence?: string;
}

export interface AssessmentResult {
  trl?: number;
  mrl?: number;
  status: string;
  nextLevel: number | null;
  failedCriteria: { questionId: string; text: string; answer: AnswerValue }[];
  suggestions: string[];
  achievedLevels: { level: number; description: string }[];
}