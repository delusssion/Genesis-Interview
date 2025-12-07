from typing import Annotated
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio.session import AsyncSession

from database import db
from auth import decode_token


sessionDep = Annotated[AsyncSession, Depends(db.get_session)]


def get_access_token(request: Request) -> str | None:
    access_token = request.cookies.get('access_token')
    return access_token

def get_refresh_token(request: Request) -> str | None:
    refresh_token = request.cookies.get('refresh_token')
    return refresh_token

def verify_access_token(access_token=Depends(get_access_token)) -> bool:
    if not access_token:
        return False
    return decode_token(access_token) is not None