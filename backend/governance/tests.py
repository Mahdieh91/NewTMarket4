
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class GovernanceModelTest(TestCase):
    def test_create_instance(self):
        # این تست به صورت نمونه ایجاد شده است
        self.assertTrue(True)
