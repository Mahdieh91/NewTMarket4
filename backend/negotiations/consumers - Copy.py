# negotiations/consumers.py
import json
import traceback
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Negotiation, NegotiationMessage

User = get_user_model()

class NegotiationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """برقراری اتصال با احراز هویت کامل"""
        print("🔵 WebSocket connect called")
        
        self.nego_id = self.scope['url_route']['kwargs']['nego_id']
        self.room_group_name = f'negotiation_{self.nego_id}'
        self.user = self.scope.get('user', None)
        
        # ===== بررسی دقیق احراز هویت =====
        if not self.user or not self.user.is_authenticated:
            print(f"❌ User not authenticated: {self.user}")
            await self.close(code=4001)  # کد خطای احراز هویت
            return
        
        print(f"✅ User authenticated: {self.user.username} (ID: {self.user.id})")
        
        # ===== بررسی دسترسی به مذاکره =====
        if not await self.has_access():
            print(f"❌ User {self.user.id} has no access to negotiation {self.nego_id}")
            await self.close(code=4003)  # کد خطای دسترسی
            return
        
        print(f"✅ User has access to negotiation {self.nego_id}")
        
        # ===== اضافه کردن به گروه =====
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print(f"✅ WebSocket connection accepted for user {self.user.id}")

    async def disconnect(self, close_code):
        """قطع اتصال"""
        print(f"🔴 WebSocket disconnected. Code: {close_code}")
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """دریافت پیام از کلاینت"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')
            
            print(f"📩 Received message: {message_type} from user {self.user.id}")
            
            if message_type == 'message':
                text_content = data.get('text', '').strip()
                if not text_content:
                    await self.send(text_data=json.dumps({
                        'error': 'متن پیام نمی‌تواند خالی باشد.'
                    }))
                    return
                
                # ذخیره پیام در دیتابیس
                new_message = await self.save_message(text_content)
                print(f"✅ Message saved: ID {new_message.id}")
                
                # ارسال به همه اعضای گروه
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': {
                            'id': new_message.id,
                            'sender_id': self.user.id,
                            'sender_name': self.user.get_full_name() or self.user.username,
                            'text': new_message.text,
                            'timestamp': new_message.timestamp.isoformat(),
                            'file_url': new_message.file.url if new_message.file else None,
                        }
                    }
                )
                
            elif message_type == 'status_update':
                new_status = data.get('status')
                if new_status in dict(Negotiation.Status.choices):
                    await self.update_status(new_status)
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'status_updated',
                            'status': new_status
                        }
                    )
                    print(f"✅ Status updated to: {new_status}")
                else:
                    await self.send(text_data=json.dumps({
                        'error': f'وضعیت "{new_status}" معتبر نیست.'
                    }))
            
            elif message_type == 'typing':
                # وضعیت تایپ (اختیاری)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_typing',
                        'user_id': self.user.id,
                        'username': self.user.username,
                    }
                )
            
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'داده ارسال شده معتبر نیست.'
            }))
        except Exception as e:
            print(f"❌ Error in receive: {e}")
            traceback.print_exc()
            await self.send(text_data=json.dumps({
                'error': f'خطا: {str(e)}'
            }))

    # ===== متدهای ارسال به کلاینت =====
    async def chat_message(self, event):
        """ارسال پیام جدید به کلاینت"""
        await self.send(text_data=json.dumps(event['message']))
    
    async def status_updated(self, event):
        """ارسال تغییر وضعیت به کلاینت"""
        await self.send(text_data=json.dumps({
            'type': 'status_updated',
            'status': event['status']
        }))
    
    async def user_typing(self, event):
        """ارسال وضعیت تایپ به کلاینت"""
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'username': event['username']
        }))

    # ===== توابع کمکی (دسترسی به دیتابیس) =====
    @database_sync_to_async
    def has_access(self):
        """بررسی دسترسی کاربر به مذاکره"""
        try:
            negotiation = Negotiation.objects.get(id=self.nego_id)
            return self.user in [negotiation.buyer, negotiation.supplier]
        except Negotiation.DoesNotExist:
            print(f"❌ Negotiation {self.nego_id} not found")
            return False
        except Exception as e:
            print(f"❌ Error in has_access: {e}")
            return False

    @database_sync_to_async
    def save_message(self, text_content):
        """ذخیره پیام در دیتابیس"""
        negotiation = Negotiation.objects.get(id=self.nego_id)
        return NegotiationMessage.objects.create(
            negotiation=negotiation,
            sender=self.user,
            text=text_content,
        )

    @database_sync_to_async
    def update_status(self, new_status):
        """به‌روزرسانی وضعیت مذاکره"""
        negotiation = Negotiation.objects.get(id=self.nego_id)
        negotiation.status = new_status
        if new_status in [Negotiation.Status.ACCEPTED, Negotiation.Status.CONTRACTED]:
            negotiation.is_active = False
        negotiation.save()
        return negotiation