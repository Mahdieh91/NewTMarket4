# users/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User

# ============================================================
# سریالایزر کاربر (برای نمایش/ویرایش)
# ============================================================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'role', 'phone', 'kyc_status',
            'company_name', 'expertise', 'address', 'website',
            'first_name', 'last_name', 'national_id', 'is_legal',
            # bio در مدل وجود ندارد – به جای آن experience_summary و سایر فیلدهای واقعی
            'experience_summary', 'activity_domain', 'registration_number',
            'economic_code', 'representative_name'
        )
        extra_kwargs = {'password': {'write_only': True}}

# ============================================================
# سریالایزر ثبت‌نام (با تأیید رمز عبور)
# ============================================================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'national_id',
            'company_name', 'registration_number', 'economic_code',
            'website', 'representative_name', 'role',
            'expertise', 'activity_domain', 'experience_summary',
        )
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "رمز عبور و تکرار آن یکسان نیستند."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            national_id=validated_data.get('national_id', ''),
            company_name=validated_data.get('company_name', ''),
            registration_number=validated_data.get('registration_number', ''),
            economic_code=validated_data.get('economic_code', ''),
            website=validated_data.get('website', ''),
            representative_name=validated_data.get('representative_name', ''),
            role=validated_data.get('role', 'buyer'),
            expertise=validated_data.get('expertise', ''),
            activity_domain=validated_data.get('activity_domain', ''),
            experience_summary=validated_data.get('experience_summary', ''),
        )
        return user

# ============================================================
# کلاس UserBasicSerializer (برای نمایش خلاصه کاربر)
# ============================================================
class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
