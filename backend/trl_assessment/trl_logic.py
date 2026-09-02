# trl_assessment/trl_logic.py

TRL_QUESTIONS = {
    1: ['trl1_q1', 'trl1_q2', 'trl1_q3', 'trl1_q4'],
    2: ['trl2_q1', 'trl2_q2', 'trl2_q3', 'trl2_q4', 'trl2_q5', 'trl2_q6'],
    3: ['trl3_q1', 'trl3_q2', 'trl3_q3', 'trl3_q4', 'trl3_q5', 'trl3_q6', 'trl3_q7', 'trl3_q8'],
    4: ['trl4_q1', 'trl4_q2', 'trl4_q3', 'trl4_q4', 'trl4_q5', 'trl4_q6', 'trl4_q7', 'trl4_q8'],
    5: ['trl5_q1', 'trl5_q2', 'trl5_q3', 'trl5_q4', 'trl5_q5', 'trl5_q6', 'trl5_q7', 'trl5_q8'],
    6: ['trl6_q1', 'trl6_q2', 'trl6_q3', 'trl6_q4', 'trl6_q5', 'trl6_q6', 'trl6_q7', 'trl6_q8', 'trl6_q9'],
    7: ['trl7_q1', 'trl7_q2', 'trl7_q3', 'trl7_q4', 'trl7_q5', 'trl7_q6', 'trl7_q7', 'trl7_q8', 'trl7_q9'],
    8: ['trl8_q1', 'trl8_q2', 'trl8_q3', 'trl8_q4', 'trl8_q5', 'trl8_q6', 'trl8_q7', 'trl8_q8', 'trl8_q9'],
    9: ['trl9_q1', 'trl9_q2', 'trl9_q3', 'trl9_q4', 'trl9_q5', 'trl9_q6', 'trl9_q7', 'trl9_q8'],
}


def calculate_trl_from_answers(answers):
    """
    answers: دیکشنری {question_id: {'value': 'yes'|'no'|'partial'|'unknown', 'evidence': ...}}
    بازگشت: {'trl': int, 'status': str}

    سوالات پاسخ‌داده‌نشده به‌عنوان 'no' در نظر گرفته می‌شوند.
    """
    highest = 0

    for level in range(1, 10):
        qids = TRL_QUESTIONS[level]
        all_yes = True

        for qid in qids:
            # اگر سوال پاسخ داده نشده یا پاسخ آن 'yes' نیست
            if qid not in answers or answers[qid].get('value') != 'yes':
                all_yes = False
                break

        if all_yes:
            highest = level
        else:
            break

    status = f"معیارهای TRL ۱ تا {highest} احراز شده‌اند." if highest > 0 else "هیچ سطحی احراز نشده است."
    return {'trl': highest, 'status': status}