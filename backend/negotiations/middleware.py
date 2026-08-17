from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import (
    InvalidToken,
    AuthenticationFailed,
)


class JWTAuthMiddleware:
    """
    JWT authentication middleware for Django Channels.

    The browser cannot set an arbitrary Authorization header
    when creating a native WebSocket connection.

    Therefore the frontend sends:

        new WebSocket(
            url,
            ["jwt", accessToken]
        )

    The access token is received through the
    Sec-WebSocket-Protocol header.

    The validated Django user is then stored in:

        scope["user"]
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(
        self,
        scope,
        receive,
        send,
    ):
        scope = dict(scope)

        user = await self.authenticate(scope)

        scope["user"] = user

        # -------------------------------------------------
        # Remember the negotiated subprotocol.
        #
        # The first protocol sent by frontend is "jwt".
        # We return "jwt" during accept().
        #
        # The actual JWT is NEVER returned to frontend.
        # -------------------------------------------------

        scope["jwt_subprotocol"] = (
            "jwt"
            if self.has_jwt_protocol(scope)
            else None
        )

        return await self.inner(
            scope,
            receive,
            send,
        )

    # =====================================================
    # AUTHENTICATION
    # =====================================================

    async def authenticate(self, scope):

        raw_token = self.get_token(scope)

        if not raw_token:
            return AnonymousUser()

        try:

            return await self.get_user_from_token(
                raw_token
            )

        except (
            InvalidToken,
            AuthenticationFailed,
            Exception,
        ):

            return AnonymousUser()

    # =====================================================
    # GET TOKEN
    # =====================================================

    def get_token(self, scope):
        """
        Expected browser WebSocket call:

            new WebSocket(
                url,
                ["jwt", accessToken]
            )

        ASGI exposes this as:

            sec-websocket-protocol
        """

        headers = dict(
            scope.get("headers", [])
        )

        protocol_header = headers.get(
            b"sec-websocket-protocol"
        )

        if protocol_header:

            try:

                protocols = [
                    item.strip()
                    for item in protocol_header
                    .decode("latin1")
                    .split(",")
                ]

            except UnicodeDecodeError:

                protocols = []

            # Expected:
            #
            # ["jwt", "<access-token>"]

            if len(protocols) >= 2:

                if protocols[0].lower() == "jwt":

                    token = protocols[1].strip()

                    if token:
                        return token

        # -------------------------------------------------
        # Optional fallback:
        #
        # If the frontend later uses:
        #
        # ?token=<access_token>
        #
        # this middleware can still authenticate it.
        #
        # We don't use this in our final frontend because
        # putting JWT in the URL is less desirable.
        # -------------------------------------------------

        query_string = (
            scope.get(
                "query_string",
                b"",
            )
            .decode(
                "utf-8",
                errors="ignore",
            )
        )

        if query_string:

            query_params = parse_qs(
                query_string
            )

            token_values = (
                query_params.get("token")
                or query_params.get("access")
                or query_params.get(
                    "access_token"
                )
            )

            if token_values:

                token = (
                    token_values[0]
                    .strip()
                )

                if token:
                    return token

        return None

    # =====================================================
    # JWT PROTOCOL
    # =====================================================

    def has_jwt_protocol(self, scope):

        headers = dict(
            scope.get("headers", [])
        )

        protocol_header = headers.get(
            b"sec-websocket-protocol"
        )

        if not protocol_header:
            return False

        try:

            protocols = [
                item.strip().lower()
                for item in protocol_header
                .decode("latin1")
                .split(",")
            ]

            return (
                len(protocols) >= 2
                and protocols[0] == "jwt"
            )

        except UnicodeDecodeError:

            return False

    # =====================================================
    # DATABASE USER
    # =====================================================

    @database_sync_to_async
    def get_user_from_token(
        self,
        raw_token,
    ):
        """
        Use the exact same SimpleJWT authentication
        backend already configured in REST_FRAMEWORK.
        """

        authentication = JWTAuthentication()

        validated_token = (
            authentication.get_validated_token(
                raw_token.encode("utf-8")
            )
        )

        user = authentication.get_user(
            validated_token
        )

        if not user or not user.is_active:
            raise AuthenticationFailed(
                "User is not active."
            )

        return user