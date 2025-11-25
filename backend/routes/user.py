from fastapi import Depends, HTTPException, Response
from fastapi.routing import APIRouter
from sqlalchemy import select
from pwdlib.hashers.argon2 import Argon2Hasher

from auth import decode_token, encode_token
from dependencies import sessionDep, get_access_token, get_refresh_token
from schemas.user_auth import UserLoginSchema, UserRegisterSchema
from models.user import UserModel


router = APIRouter(prefix="/auth", tags=["Auth"])

hasher = Argon2Hasher()


@router.get("/me")
async def auth_get_me(access_token=Depends(get_access_token)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token not found")

    payload = decode_token(access_token)

    if payload:
        return {"success": True}
    else:
        return {"success": False, "detail": "Token is invalid or expired"}


@router.get("/refresh")
async def auth_get_refresh(
    response: Response, refresh_token=Depends(get_refresh_token)
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


@router.post("/register")
async def auth_post_register(user_register: UserRegisterSchema, session: sessionDep):
    query = select(UserModel).where(UserModel.nickname == user_register.nickname)
    result = await session.execute(query)

    existing_user = result.scalar_one_or_none()
    if existing_user is not None:
        raise HTTPException(
            status_code=401, detail="User with such nickname already registered"
        )

    hashed_password = hasher.hash(user_register.password)
    user = UserModel(nickname=user_register.nickname, password=hashed_password)

    session.add(user)
    await session.commit()

    return {"success": True}


@router.post("/login")
async def auth_post_login(
    user_login: UserLoginSchema, response: Response, session: sessionDep
):
    query = select(UserModel).where(UserModel.nickname == user_login.nickname)
    result = await session.execute(query)

    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=401, detail="User with such nickname doesnt exist"
        )

    if not hasher.verify(user_login.password, user.password):
        raise HTTPException(status_code=401, detail="Wrong password")

    access_token = encode_token("access_token", user.uid)
    refresh_token = encode_token("refresh_token", user.uid)

    response.set_cookie("access_token", access_token)
    response.set_cookie("refresh_token", refresh_token)

    return {"success": True}
