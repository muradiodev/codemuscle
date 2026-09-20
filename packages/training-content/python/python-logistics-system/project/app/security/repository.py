from threading import RLock

from app.exceptions import ConflictError
from app.security.models import PlatformUser


class UserRepository:
    def __init__(self) -> None:
        self._users: dict[str, PlatformUser] = {}
        self._lock = RLock()

    def save(self, user: PlatformUser) -> PlatformUser:
        key = user.username.casefold()
        with self._lock:
            if key in self._users:
                raise ConflictError("Username is already registered")
            self._users[key] = user
        return user

    def find_by_username(self, username: str) -> PlatformUser | None:
        with self._lock:
            return self._users.get(username.casefold())
