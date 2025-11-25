from fastapi import Cookie, HTTPException, Response
from fastapi.routing import APIRouter

from auth import decode_token, encode_token
from dependencies import sessionDep
from schemas.user_auth import UserLoginSchema, UserRegisterSchema


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me")
async def auth_get_me(access_token: str = Cookie(alias="access_token")):
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token not found")

    payload = decode_token(access_token)

    if payload:
        return {"success": True}
    else:
        return {"success": False, "detail": "Token is invalid or expired"}


@router.get("/refresh")
async def auth_get_refresh(
    response: Response, refresh_token: str = Cookie(alias="refresh_token")
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token not found")

    payload = decode_token(refresh_token)

    if payload:
        uid = payload.get("sub")

        new_access_token = encode_token("access", uid)
        new_refresh_token = encode_token("refresh", uid)

        response.set_cookie("access_token", new_access_token)
        response.set_cookie("refresh_token", new_refresh_token)

        return {"success": True}
    else:
        return {"success": False, "detail": "Token is invalid or expired"}


@router.post('/register')
async def auth_post_register(user_register: UserRegisterSchema, response: Response, session: sessionDep):
    ...


@router.post('/login')
async def auth_post_login(user_login: UserLoginSchema, response: Response, session: sessionDep):
    ...