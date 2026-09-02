# mrl_assessment/mrl_logic.py

MRL_QUESTIONS = {
    1: ['mrl1_q1', 'mrl1_q2', 'mrl1_q3'],
    2: ['mrl2_q1', 'mrl2_q2', 'mrl2_q3'],
    3: ['mrl3_q1', 'mrl3_q2', 'mrl3_q3'],
    4: ['mrl4_q1', 'mrl4_q2', 'mrl4_q3'],
    5: ['mrl5_q1', 'mrl5_q2', 'mrl5_q3'],
    6: ['mrl6_q1', 'mrl6_q2', 'mrl6_q3'],
    7: ['mrl7_q1', 'mrl7_q2', 'mrl7_q3'],
    8: ['mrl8_q1', 'mrl8_q2', 'mrl8_q3'],
    9: ['mrl9_q1', 'mrl9_q2', 'mrl9_q3'],
    10: ['mrl10_q1', 'mrl10_q2', 'mrl10_q3'],
}


def calculate_mrl_from_answers(answers):
    """
    answers: دیکشنری {question_id: {'value': 'yes'|'no'|'partial'|'unknown', 'evidence': ...}}
    بازگشت: {'mrl': int, 'status': str}

    ✅ سوالات پاسخ‌داده‌نشده به‌عنوان 'no' در نظر گرفته می‌شوند.
    ✅ فقط سوالات سطح ۱ اجباری هستند (بررسی در فرانت‌اند انجام می‌شود).
    """
    highest = 0

    for level in range(1, 11):
        qids = MRL_QUESTIONS[level]
        all_yes = True

        for qid in qids:
            if qid not in answers or answers[qid].get('value') != 'yes':
                all_yes = False
                break

        if all_yes:
            highest = level
        else:
            break

    status = f"معیارهای MRL ۱ تا {highest} احراز شده‌اند." if highest > 0 else "هیچ سطحی احراز نشده است."
    return {'mrl': highest, 'status': status}