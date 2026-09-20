from app.config import settings
from app.security.repository import UserRepository
from app.security.service import AuthenticationService


user_repository = UserRepository()
authentication_service = AuthenticationService(user_repository, settings)
