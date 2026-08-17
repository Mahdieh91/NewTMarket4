import json
import traceback

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .models import Negotiation, Message
from .services.message_filter import (
    validate_negotiation_message,
)


class NegotiationAccessError(Exception):
    pass


class NegotiationStateError(Exception):
    pass


class NegotiationConsumer(
    AsyncWebsocketConsumer
):

    async def connect(self):

        self.nego_id = (
            self.scope[
                'url_route'
            ][
                'kwargs'
            ][
                'nego_id'
            ]
        )

        self.room_group_name = (
            f'negotiation_{self.nego_id}'
        )

        self.user = self.scope.get(
            'user'
        )

        if (
            not self.user
            or not self.user.is_authenticated
        ):
            await self.close(
                code=4001
            )
            return

        if not await self.has_access():
            await self.close(
                code=4003
            )
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )

        subprotocol = (
            'jwt'
            if self.scope.get(
                'jwt_authenticated'
            )
            else None
        )

        await self.accept(
            subprotocol=subprotocol
        )

        print(
            f'✅ WebSocket connected: '
            f'user={self.user.id} '
            f'negotiation={self.nego_id}'
        )

    async def disconnect(
        self,
        close_code,
    ):

        if hasattr(
            self,
            'room_group_name'
        ):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name,
            )

    async def receive(
        self,
        text_data,
    ):

        try:

            data = json.loads(
                text_data
            )

            message_type = data.get(
                'type',
                'message'
            )

            if (
                message_type
                == 'message'
            ):
                await self.handle_message(
                    data
                )

            elif (
                message_type
                == 'status_update'
            ):
                await self.handle_status_update(
                    data
                )

            else:

                await self.send_error(
                    'نوع درخواست نامعتبر است.'
                )

        except json.JSONDecodeError:

            await self.send_error(
                'داده ارسال شده معتبر نیست.'
            )

        except Exception as e:

            print(
                f'❌ WebSocket error: {e}'
            )

            traceback.print_exc()

            await self.send_error(
                'خطای داخلی سرور.'
            )

    async def handle_message(
        self,
        data,
    ):

        text = str(
            data.get(
                'text',
                ''
            )
        ).strip()

        validation = (
            validate_negotiation_message(
                text
            )
        )

        if not validation.allowed:

            await self.send_error(
                validation.reason
                or
                'ارسال پیام مجاز نیست.'
            )

            return

        try:

            message_data = (
                await self.save_message(
                    text
                )
            )

        except NegotiationAccessError:

            await self.send_error(
                'شما عضو این مذاکره نیستید.'
            )

            return

        except NegotiationStateError as e:

            await self.send_error(
                str(e)
            )

            return

        except Negotiation.DoesNotExist:

            await self.send_error(
                'مذاکره پیدا نشد.'
            )

            return

        except Exception as e:

            print(
                f'❌ Save message error: {e}'
            )

            traceback.print_exc()

            await self.send_error(
                'خطا در ذخیره پیام.'
            )

            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type':
                    'chat_message',

                'message': message_data,
            },
        )

    async def handle_status_update(
        self,
        data,
    ):

        new_status = data.get(
            'status'
        )

        allowed = {
            'accepted',
            'rejected',
            'contracted',
        }

        if new_status not in allowed:

            await self.send_error(
                'وضعیت معتبر نیست.'
            )

            return

        try:

            negotiation = (
                await self.update_status(
                    new_status
                )
            )

        except NegotiationAccessError:

            await self.send_error(
                'شما عضو این مذاکره نیستید.'
            )

            return

        except NegotiationStateError as e:

            await self.send_error(
                str(e)
            )

            return

        except Negotiation.DoesNotExist:

            await self.send_error(
                'مذاکره پیدا نشد.'
            )

            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type':
                    'status_updated',

                'status':
                    negotiation.status,
            },
        )

    async def chat_message(
        self,
        event,
    ):

        await self.send(
            text_data=json.dumps(
                event['message'],
                ensure_ascii=False,
            )
        )

    async def status_updated(
        self,
        event,
    ):

        await self.send(
            text_data=json.dumps(
                {
                    'type':
                        'status_updated',

                    'status':
                        event['status'],
                },
                ensure_ascii=False,
            )
        )

    async def send_error(
        self,
        message,
    ):

        await self.send(
            text_data=json.dumps(
                {
                    'type':
                        'error',

                    'error':
                        message,
                },
                ensure_ascii=False,
            )
        )

    @database_sync_to_async
    def has_access(self):

        try:

            negotiation = (
                Negotiation.objects.get(
                    id=self.nego_id
                )
            )

        except Negotiation.DoesNotExist:

            return False

        return (
            negotiation.buyer_id
            == self.user.id

            or

            negotiation.supplier_id
            == self.user.id
        )

    @database_sync_to_async
    def save_message(
        self,
        text,
    ):

        negotiation = (
            Negotiation.objects.get(
                id=self.nego_id
            )
        )

        # -------------------------------------------------
        # دوباره بررسی دسترسی
        # -------------------------------------------------

        if self.user.id not in {
            negotiation.buyer_id,
            negotiation.supplier_id,
        }:

            raise NegotiationAccessError()

        # -------------------------------------------------
        # مذاکره بسته
        # -------------------------------------------------

        if negotiation.status in {
            'rejected',
            'contracted',
        }:

            raise NegotiationStateError(
                'این مذاکره به پایان رسیده است.'
            )

        # -------------------------------------------------
        # Save real message
        # -------------------------------------------------

        message = Message.objects.create(
            negotiation=negotiation,
            sender=self.user,
            text=text,
        )

        # -------------------------------------------------
        # First message
        # -------------------------------------------------

        if negotiation.status == 'created':

            negotiation.status = (
                'in_progress'
            )

            negotiation.save(
                update_fields=[
                    'status',
                    'updated_at',
                ]
            )

        return {
            'type':
                'message',

            'id':
                message.id,

            'negotiation_id':
                negotiation.id,

            'sender_id':
                message.sender_id,

            'sender_name':
                (
                    message.sender.get_full_name()
                    or message.sender.username
                ),

            'text':
                message.text,

            'timestamp':
                message.timestamp.isoformat(),

            'file':
                (
                    message.file.url
                    if message.file
                    else None
                ),

            'file_name':
                message.file_name,

        }

    @database_sync_to_async
    def update_status(
        self,
        new_status,
    ):

        negotiation = (
            Negotiation.objects.get(
                id=self.nego_id
            )
        )

        if self.user.id not in {
            negotiation.buyer_id,
            negotiation.supplier_id,
        }:

            raise NegotiationAccessError()

        # -----------------------------------------------
        # وضعیت نهایی rejected/contracted
        # -----------------------------------------------

        if negotiation.status in {
            'rejected',
            'contracted',
        }:

            raise NegotiationStateError(
                'این مذاکره قبلاً به پایان رسیده است.'
            )

        # -----------------------------------------------
        # contracted فقط supplier
        # -----------------------------------------------

        if (
            new_status == 'contracted'
            and
            negotiation.supplier_id
            != self.user.id
        ):

            raise NegotiationAccessError()

        negotiation.status = (
            new_status
        )

        negotiation.save(
            update_fields=[
                'status',
                'updated_at',
            ]
        )

        return negotiation