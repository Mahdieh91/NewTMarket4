import re
import unicodedata
from dataclasses import dataclass
from typing import Optional


@dataclass
class MessageValidationResult:
    allowed: bool
    reason: Optional[str] = None


# ---------------------------------------------------------
# Persian / Arabic digits -> English
# ---------------------------------------------------------

PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"
ENGLISH_DIGITS = "0123456789"

DIGIT_TRANSLATION = str.maketrans(
    PERSIAN_DIGITS + ARABIC_DIGITS,
    ENGLISH_DIGITS + ENGLISH_DIGITS,
)


def normalize_digits(text: str) -> str:
    return text.translate(DIGIT_TRANSLATION)


# ---------------------------------------------------------
# Unicode normalization
# ---------------------------------------------------------

def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text or "")
    text = normalize_digits(text)

    # Arabic variants
    text = text.replace("ي", "ی")
    text = text.replace("ى", "ی")
    text = text.replace("ك", "ک")

    return text


# ---------------------------------------------------------
# Create a compact version for detecting obfuscated numbers
# ---------------------------------------------------------

def compact_for_contact_detection(text: str) -> str:
    text = normalize_text(text)

    # Remove common separators between digits
    text = re.sub(
        r"(?<=\d)[\s\-_./\\|():]+(?=\d)",
        "",
        text,
    )

    return text


# ---------------------------------------------------------
# Phone detection
# ---------------------------------------------------------

IRAN_PHONE_PATTERNS = [
    # 09131234567
    r"(?<!\d)09\d{9}(?!\d)",

    # +989131234567
    r"(?<!\d)\+989\d{9}(?!\d)",

    # 00989131234567
    r"(?<!\d)00989\d{9}(?!\d)",

    # 989131234567
    r"(?<!\d)989\d{9}(?!\d)",
]


def contains_phone_number(text: str) -> bool:
    normalized = compact_for_contact_detection(text)

    for pattern in IRAN_PHONE_PATTERNS:
        if re.search(pattern, normalized):
            return True

    # -----------------------------------------------------
    # Catch spaced / separated numbers.
    #
    # Example:
    # 0 9 1 3 1 2 3 4 5 6 7
    # -----------------------------------------------------

    digit_runs = re.findall(r"\d(?:[\s\-_/\\.]?\d){6,}", normalize_text(text))

    for run in digit_runs:
        digits = re.sub(r"\D", "", run)

        if len(digits) == 11 and digits.startswith("09"):
            return True

        if len(digits) == 13 and digits.startswith("989"):
            return True

        if len(digits) == 14 and digits.startswith("00989"):
            return True

    return False


# ---------------------------------------------------------
# Email
# ---------------------------------------------------------

EMAIL_PATTERN = re.compile(
    r"(?<![\w.+-])"
    r"[A-Za-z0-9._%+-]+"
    r"@"
    r"[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
    r"(?![\w.-])",
    re.IGNORECASE,
)


def contains_email(text: str) -> bool:
    return bool(EMAIL_PATTERN.search(normalize_text(text)))


# ---------------------------------------------------------
# URLs
# ---------------------------------------------------------

URL_PATTERN = re.compile(
    r"(?i)"
    r"(?:https?://|www\.)"
    r"[^\s]+"
)


DOMAIN_PATTERN = re.compile(
    r"(?i)"
    r"(?<![@\w])"
    r"(?:"
    r"t\.me/"
    r"|telegram\.me/"
    r"|telegram\.dog/"
    r"|instagram\.com/"
    r"|instagr\.am/"
    r"|wa\.me/"
    r"|whatsapp\.com/"
    r"|linkedin\.com/"
    r"|facebook\.com/"
    r"|x\.com/"
    r"|twitter\.com/"
    r")"
)


def contains_url_or_social_link(text: str) -> bool:
    normalized = normalize_text(text)

    return bool(
        URL_PATTERN.search(normalized)
        or DOMAIN_PATTERN.search(normalized)
    )


# ---------------------------------------------------------
# Social platforms / communication services
# ---------------------------------------------------------

SOCIAL_KEYWORDS = [
    "telegram",
    "تلگرام",

    "whatsapp",
    "واتساپ",
    "واتس اپ",

    "instagram",
    "اینستاگرام",

    "linkedin",
    "لینکدین",

    "facebook",
    "فیسبوک",
    "فیس بوک",

    "twitter",
    "توییتر",

    "signal",
    "سیگنال",

    "discord",
    "دیسکورد",

    "skype",
    "اسکایپ",
]


def contains_social_platform(text: str) -> bool:
    normalized = normalize_text(text).lower()

    # Remove spaces only for a second detection pass
    compact = re.sub(r"\s+", "", normalized)

    for keyword in SOCIAL_KEYWORDS:
        keyword = keyword.lower()

        if keyword in normalized:
            return True

        if keyword.replace(" ", "") in compact:
            return True

    return False


# ---------------------------------------------------------
# Contact-oriented phrases
# ---------------------------------------------------------

CONTACT_PHRASES = [
    "شماره تماس",
    "شماره موبایل",
    "شماره تلفن",
    "تلفن من",
    "موبایل من",
    "تماس بگیر",
    "تماس بگیرید",
    "با من تماس",
    "ایمیل من",
    "ایمیل بزن",
    "ایمیل کنید",

    "contact me",
    "call me",
    "my phone",
    "my number",
    "my email",
    "email me",
    "phone number",
]


def contains_contact_phrase(text: str) -> bool:
    normalized = normalize_text(text).lower()

    return any(
        phrase.lower() in normalized
        for phrase in CONTACT_PHRASES
    )


# ---------------------------------------------------------
# Bank / payment information
# ---------------------------------------------------------

CARD_NUMBER_PATTERN = re.compile(
    r"(?<!\d)"
    r"(?:\d[\s-]?){16}"
    r"(?!\d)"
)


SHEBA_PATTERN = re.compile(
    r"(?i)\bIR\d{24}\b"
)


def contains_payment_information(text: str) -> bool:
    normalized = normalize_text(text)

    if CARD_NUMBER_PATTERN.search(normalized):
        return True

    if SHEBA_PATTERN.search(normalized):
        return True

    payment_words = [
        "شماره کارت",
        "شماره شبا",
        "شماره حساب",
        "کارت بانکی",
        "bank account",
        "iban",
        "card number",
    ]

    lower_text = normalized.lower()

    return any(
        word.lower() in lower_text
        for word in payment_words
    )


# ---------------------------------------------------------
# Main validator
# ---------------------------------------------------------

def validate_negotiation_message(
    text: str,
) -> MessageValidationResult:

    text = text or ""

    if not text.strip():
        return MessageValidationResult(
            allowed=False,
            reason="متن پیام نمی‌تواند خالی باشد.",
        )

    if len(text) > 5000:
        return MessageValidationResult(
            allowed=False,
            reason="طول پیام نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد.",
        )

    if contains_phone_number(text):
        return MessageValidationResult(
            allowed=False,
            reason="ارسال شماره تلفن و اطلاعات تماس در مذاکره مجاز نیست.",
        )

    if contains_email(text):
        return MessageValidationResult(
            allowed=False,
            reason="ارسال آدرس ایمیل در مذاکره مجاز نیست.",
        )

    if contains_url_or_social_link(text):
        return MessageValidationResult(
            allowed=False,
            reason="ارسال لینک خارجی یا لینک شبکه‌های اجتماعی مجاز نیست.",
        )

    if contains_social_platform(text):
        return MessageValidationResult(
            allowed=False,
            reason="تبادل اطلاعات شبکه‌های اجتماعی و پیام‌رسان‌ها مجاز نیست.",
        )

    if contains_contact_phrase(text):
        return MessageValidationResult(
            allowed=False,
            reason="تبادل اطلاعات تماس خارج از پلتفرم مجاز نیست.",
        )

    if contains_payment_information(text):
        return MessageValidationResult(
            allowed=False,
            reason="ارسال اطلاعات بانکی در پیام مذاکره مجاز نیست.",
        )

    return MessageValidationResult(
        allowed=True,
    )