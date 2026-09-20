from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass(frozen=True, slots=True)
class PlatformUser:
    id: str
    username: str
    password_hash: str
    email: str
    display_name: str
    job_title: str | None = None
    locale: str = "en"
    roles: frozenset[str] = frozenset({"user"})
    enabled: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
