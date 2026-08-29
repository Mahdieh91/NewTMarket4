# negotiations/contact_filter.py
import re
import unicodedata


PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"
ENGLISH_DIGITS = "0123456789"

DIGIT_TRANSLATION = str.maketrans(
    PERSIAN_DIGITS + ARABIC_DIGITS,
    ENGLISH_DIGITS + ENGLISH_DIGITS
)


CONTACT_KEYWORDS = [
    # فارسی
    "شماره تماس",
    "شماره تلفن",
    "شماره موبایل",
    "شماره همراه",
    "ایمیل",
    "ایمیل من",
    "تلگرام",
    "واتساپ",
    "واتس اپ",
    "واتس‌اپ",
    "اینستاگرام",
    "اینستا",
    "لینکدین",
    "لینکدین",
    "شبکه اجتماعی",

    # English
    "phone",
    "telephone",
    "mobile",
    "email",
    "e-mail",
    "telegram",
    "whatsapp",
    "instagram",
    "linkedin",
    "social media",
]


SOCIAL_DOMAINS = [
    "instagram.com",
    "www.instagram.com",
    "t.me",
    "telegram.me",
    "telegram.org",
    "wa.me",
    "whatsapp.com",
    "linkedin.com",
    "facebook.com",
    "twitter.com",
    "x.com",
]


def normalize_digits(text: str) -> str:
    return text.translate(DIGIT_TRANSLATION)


def normalize_unicode(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"[\u200b-\u200f\u202a-\u202e\ufeff]", "", text)
    return text


def normalized_text(text: str) -> str:
    text = normalize_unicode(text)
    text = normalize_digits(text)
    return text.lower()


def compact_text(text: str) -> str:
    text = normalized_text(text)
    return re.sub(
        r"[\s\-_./\\(),،؛;:+*#=|]+",
        "",
        text
    )


def contains_contact_keyword(text: str) -> bool:
    normalized = normalized_text(text)
    for keyword in CONTACT_KEYWORDS:
        if keyword in normalized:
            return True
    return False


def contains_social_domain(text: str) -> bool:
    normalized = normalized_text(text)
    for domain in SOCIAL_DOMAINS:
        if domain in normalized:
            return True
    return False


def contains_email(text: str) -> bool:
    normalized = normalized_text(text)
    email_pattern = r"(?<![\w.-])[\w.+-]+@[\w-]+(?:\.[\w-]+)+(?![\w.-])"
    if re.search(email_pattern, normalized):
        return True
    email_compact = re.sub(r"\s+", "", normalized)
    if re.search(email_pattern, email_compact):
        return True
    email_dot_words = re.sub(r"\s*(?:dot|نقطه)\s*", ".", normalized)
    if re.search(email_pattern, email_dot_words):
        return True
    return False


def extract_digit_sequences(text: str):
    normalized = normalize_digits(normalize_unicode(text))
    sequences = re.findall(r"(?:\d[\d\s\-_().+/]*\d|\d+)", normalized)
    return sequences


def normalize_phone_candidate(value: str) -> str:
    value = normalize_digits(normalize_unicode(value))
    digits = re.sub(r"\D", "", value)
    if digits.startswith("0098"):
        digits = "0" + digits[4:]
    elif digits.startswith("98") and len(digits) >= 11:
        digits = "0" + digits[2:]
    return digits


def contains_phone_number(text: str) -> bool:
    for candidate in extract_digit_sequences(text):
        digits = normalize_phone_candidate(candidate)
        if re.fullmatch(r"09\d{9}", digits):
            return True
        if re.fullmatch(r"0\d{9,10}", digits):
            return True
        if 10 <= len(digits) <= 15 and digits.startswith(("0", "9")):
            if len(set(digits)) > 2:
                return True
    compact = compact_text(text)
    if re.search(r"09\d{9}", compact):
        return True
    if re.search(r"98\d{10}", compact):
        return True
    return False


def contains_social_handle(text: str) -> bool:
    normalized = normalized_text(text)
    if re.search(r"@[a-zA-Z0-9_.]{3,}", normalized):
        return True
    social_words = [
        "instagram", "telegram", "whatsapp", "linkedin",
        "اینستاگرام", "اینستا", "تلگرام", "واتساپ", "واتس اپ", "لینکدین"
    ]
    compact = compact_text(normalized)
    for word in social_words:
        if word in normalized or word in compact:
            return True
    return False


def validate_message_text(text: str):
    if not text or not text.strip():
        return "متن پیام نمی‌تواند خالی باشد."
    if len(text) > 5000:
        return "متن پیام نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد."
    if contains_email(text):
        return "ارسال آدرس ایمیل در مذاکره مجاز نیست."
    if contains_phone_number(text):
        return "ارسال شماره تلفن یا شماره موبایل در مذاکره مجاز نیست."
    if contains_social_domain(text):
        return "ارسال لینک یا آدرس شبکه‌های اجتماعی در مذاکره مجاز نیست."
    if contains_social_handle(text):
        return "ارسال شناسه یا اکانت شبکه‌های اجتماعی در مذاکره مجاز نیست."
    if contains_contact_keyword(text):
        return "تبادل اطلاعات تماس در این مرحله از مذاکره مجاز نیست."
    return None


# ------------------------------------------------------------
# تابع جدید برای سازگاری با سریالایزر و کانسیومر
# ------------------------------------------------------------
def validate_negotiation_message(text: str):
    error = validate_message_text(text)
    if error:
        return {'allowed': False, 'reason': error}
    return {'allowed': True, 'reason': None}