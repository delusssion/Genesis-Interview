from typing import Any
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone

from config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_ACCESS_TOKEN_EXPIRES_MINUTES, JWT_REFRESH_TOKEN_EXPIRES_DAYS


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, key=JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def encode_token(type: str, uid: int) -> str:
    expiry = datetime.now(timezone.utc)
    if type == 'access_token':
        expiry += timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRES_MINUTES)
    elif type == 'refresh_token':
        expiry += timedelta(days=JWT_REFRESH_TOKEN_EXPIRES_DAYS)
    
    try:
        token = jwt.encode({ 'sub': str(uid), 'exp': expiry }, key=JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return token
    except JWTError:
        return None