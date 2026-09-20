from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt

from app.config import Settings
from app.security.models import PlatformUser
from app.security.passwords import hash_password, verify_password
from app.security.repository import UserRepository
from app.security.schemas import LoginRequest, RegisterRequest, TokenResponse


class AuthenticationError(ValueError):
    pass


class AuthenticationService:
    def __init__(self, repository: UserRepository, settings: Settings) -> None:
        self._repository = repository
        self._settings = settings

    def register(self, request: RegisterRequest) -> TokenResponse:
        user = PlatformUser(
            id=str(uuid4()),
            username=request.username,
            password_hash=hash_password(request.password),
            email=str(request.email),
            display_name=request.display_name,
            job_title=request.job_title,
            locale=request.locale,
        )
        return self._issue(self._repository.save(user))

    def login(self, request: LoginRequest) -> TokenResponse:
        user = self._repository.find_by_username(request.username)
        if user is None or not user.enabled or not verify_password(request.password, user.password_hash):
            raise AuthenticationError("Invalid username or password")
        return self._issue(user)

    def decode(self, token: str) -> dict[str, object]:
        return jwt.decode(
            token,
            self._settings.jwt_secret,
            algorithms=[self._settings.jwt_algorithm],
            options={"require": ["exp", "iat", "sub"]},
        )

    def _issue(self, user: PlatformUser) -> TokenResponse:
        issued_at = datetime.now(UTC)
        expires_at = issued_at + timedelta(minutes=self._settings.access_token_minutes)
        claims = {
            "sub": user.username,
            "user_id": user.id,
            "display_name": user.display_name,
            "roles": sorted(user.roles),
            "iat": issued_at,
            "exp": expires_at,
        }
        token = jwt.encode(claims, self._settings.jwt_secret, algorithm=self._settings.jwt_algorithm)
        return TokenResponse(
            access_token=token,
            expires_at=expires_at,
            username=user.username,
            display_name=user.display_name,
            roles=set(user.roles),
        )
