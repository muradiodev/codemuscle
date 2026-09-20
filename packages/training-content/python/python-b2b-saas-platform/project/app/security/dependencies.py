from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError

from app.security.container import authentication_service
from app.security.schemas import CurrentUser


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> CurrentUser:
    try:
        claims = authentication_service.decode(token)
        return CurrentUser(
            id=str(claims["user_id"]),
            username=str(claims["sub"]),
            display_name=str(claims["display_name"]),
            roles=set(claims.get("roles", [])),
        )
    except (InvalidTokenError, KeyError, TypeError) as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error


CurrentUserDependency = Annotated[CurrentUser, Depends(get_current_user)]
