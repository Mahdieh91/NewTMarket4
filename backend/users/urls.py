# ============================================================
# users/views.py (قسمت CaptchaChallengeView)
# ============================================================

class CaptchaChallengeView(APIView):
    """
    GET /api/users/captcha/challenge/
    ایجاد چالش جدید و ذخیره در session
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # اطمینان از وجود session
        if not request.session.session_key:
            request.session.create()
        session_key = request.session.session_key
        question = MathCaptcha.create_challenge(session_key)
        return Response({'question': question})