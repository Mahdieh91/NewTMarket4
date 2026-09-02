// src/components/AssessmentResult.tsx
import { AssessmentResult as AssessmentResultType } from '@/lib/trl/types';
import { useRouter } from 'next/navigation';

export default function AssessmentResult({
  result,
  title,
  returnUrl,
}: {
  result: AssessmentResultType | null;
  title: string;
  returnUrl?: string;
}) {
  const router = useRouter();

  // فقط اگر result وجود نداشته باشد، چیزی نمایش نده
  if (!result) return null;

  const level = result.trl ?? result.mrl ?? 0;

  const handleGoBack = () => {
    if (!returnUrl) {
      router.back();
      return;
    }

    try {
      const [path, existingQuery] = returnUrl.split('?');
      const params = new URLSearchParams(existingQuery || '');
      params.set('trl', String(level));
      params.set('trl_assessed', 'true');

      const assessmentId = typeof window !== 'undefined'
        ? localStorage.getItem('last_trl_assessment_id')
        : null;
      if (assessmentId) {
        params.set('trl_assessment_id', assessmentId);
      }

      const finalUrl = path + '?' + params.toString();
      router.push(finalUrl);
    } catch (error) {
      console.error('Error in handleGoBack:', error);
      router.back();
    }
  };

  return (
    <div className="trl-result-container">
      <h2 style={{ marginBottom: '0.5rem' }}>نتیجه ارزیابی {title}</h2>
      
      <div className="trl-badge">
        <span className="trl-number">{title} {level}</span>
        <p>{result.status}</p>
      </div>

      {result.achievedLevels && result.achievedLevels.length > 0 && (
        <div className="trl-achieved">
          <h4>سطوح احراز شده:</h4>
          <ul>
            {result.achievedLevels.map((item) => (
              <li key={item.level}>
                <strong>{title} {item.level}:</strong> {item.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== دکمه بازگشت - همیشه نمایش داده می‌شود ===== */}
      <div style={{ 
        marginTop: '2rem', 
        textAlign: 'center',
        paddingTop: '1.5rem',
        borderTop: '2px solid #e5e7eb'
      }}>
        <button
          onClick={handleGoBack}
          style={{
            padding: '0.9rem 2.5rem',
            background: 'linear-gradient(135deg, #1E3A8A, #14B8A6)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: '1.1rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(30, 58, 138, 0.3)',
            width: '100%',
            maxWidth: '400px',
            letterSpacing: '0.5px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(30, 58, 138, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(30, 58, 138, 0.3)';
          }}
        >
          ↩️ بازگشت به ثبت عرضه
          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '400', opacity: 0.8, marginTop: '2px' }}>
            با کلیک، مقدار {title} به‌صورت خودکار در فرم ثبت اعمال می‌شود
          </span>
        </button>
      </div>
    </div>
  );
}