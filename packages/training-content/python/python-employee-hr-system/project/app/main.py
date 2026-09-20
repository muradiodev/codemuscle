from fastapi import FastAPI

from app.config import settings
from app.exceptions import install_exception_handlers
from app.security.router import router as auth_router
from app.hr.router import router as domain_router


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="1.0.0")
    install_exception_handlers(app)
    app.include_router(auth_router)
    app.include_router(domain_router)

    @app.get("/health", tags=["system"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": settings.app_name}

    return app


app = create_app()
