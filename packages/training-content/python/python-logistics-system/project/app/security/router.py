from fastapi import APIRouter, HTTPException, status

from app.security.container import authentication_service
from app.security.dependencies import CurrentUserDependency
from app.security.schemas import CurrentUser, LoginRequest, RegisterRequest, TokenResponse
from app.security.service import AuthenticationError


router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest) -> TokenResponse:
    return authentication_service.register(request)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest) -> TokenResponse:
    try:
        return authentication_service.login(request)
    except AuthenticationError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error)) from error


@router.get("/me", response_model=CurrentUser)
async def current_user(user: CurrentUserDependency) -> CurrentUser:
    return user
