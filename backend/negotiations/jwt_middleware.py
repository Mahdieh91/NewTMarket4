# negotiations/jwt_middleware.py
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import (
    JWTAuthentication,
)


@database_sync_to_async
def get_user_from_token(token):

    try:

        authentication = (
            JWTAuthentication()
        )

        validated_token = (
            authentication.get_validated_token(
                token
            )
        )

        return authentication.get_user(
            validated_token
        )

    except Exception:

        return AnonymousUser()


class JWTAuthMiddleware(
    BaseMiddleware
):

    async def __call__(
        self,
        scope,
        receive,
        send,
    ):

        scope = dict(
            scope
        )

        protocols = scope.get(
            'subprotocols',
            []
        )

        token = None

        if (
            len(protocols) >= 2
            and
            protocols[0].lower()
            == 'jwt'
        ):

            token = protocols[1]

        if token:

            user = (
                await get_user_from_token(
                    token
                )
            )

            scope['user'] = user

            scope[
                'jwt_authenticated'
            ] = (
                user.is_authenticated
            )

        else:

            scope['user'] = (
                AnonymousUser()
            )

            scope[
                'jwt_authenticated'
            ] = False

        return await super().__call__(
            scope,
            receive,
            send,
        )