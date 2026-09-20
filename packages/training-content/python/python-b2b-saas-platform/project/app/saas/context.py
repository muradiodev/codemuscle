from contextlib import contextmanager
from contextvars import ContextVar, Token
from collections.abc import Iterator


_current_tenant: ContextVar[str | None] = ContextVar("current_tenant", default=None)


class TenantContext:
    @staticmethod
    def current() -> str:
        tenant_id = _current_tenant.get()
        if tenant_id is None:
            raise RuntimeError("No tenant is bound to the current context")
        return tenant_id

    @staticmethod
    @contextmanager
    def bind(tenant_id: str) -> Iterator[None]:
        token: Token[str | None] = _current_tenant.set(tenant_id)
        try:
            yield
        finally:
            _current_tenant.reset(token)
