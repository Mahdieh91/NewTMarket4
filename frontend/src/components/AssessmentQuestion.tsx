// frontend/components/AssessmentQuestion.tsx
'use client';
import { AnswerValue } from '@/lib/trl/types';

interface Props {
  id: string;
  text: string;
  value: AnswerValue | '';
  onChange: (id: string, value: AnswerValue) => void;
  onEvidenceChange?: (id: string, evidence: string) => void;
}

const OPTIONS: { value: AnswerValue; label: string }[] = [
  { value: 'yes', label: '✅ بله' },
  { value: 'no', label: '❌ خیر' },
  { value: 'partial', label: '🟡 تاحدی' },
  { value: 'unknown', label: '⚪ نامشخص' },
];

export default function AssessmentQuestion({ id, text, value, onChange, onEvidenceChange }: Props) {
  return (
    <div className="trl-question">
      <p className="trl-question-text">{text}</p>
      <div className="trl-options">
        {OPTIONS.map((opt) => (
          <label key={opt.value} className="trl-option">
            <input
              type="radio"
              name={id}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(id, opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
      {onEvidenceChange && (
        <div className="trl-evidence">
          <input
            type="text"
            placeholder="توضیح یا آدرس شاهد (اختیاری)"
            onChange={(e) => onEvidenceChange(id, e.target.value)}
            className="trl-evidence-input"
          />
        </div>
      )}
    </div>
  );
}