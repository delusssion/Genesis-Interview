from fastapi import Depends, HTTPException, Response
from fastapi.routing import APIRouter
from sqlalchemy import select, or_
from pwdlib.hashers.argon2 import Argon2Hasher

from auth import decode_token, encode_token
from dependencies import sessionDep, get_access_token, get_refresh_token
from schemas import UserLoginSchema, UserRegisterSchema
from models import UserModel


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


@router.post("/logout")
async def auth_post_logout(response: Response):
    cookie_params = {"httponly": True, "samesite": "lax"}
    response.delete_cookie("access_token", **cookie_params)
    response.delete_cookie("refresh_token", **cookie_params)
    return {"success": True}


@router.get("/refresh")
async def auth_get_refresh(
    response: Response, refresh_token=Depends(get_refresh_token)
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token not found")

    payload = decode_token(refresh_token)

    if payload:
        uid = payload.get("sub")

        new_access_token = encode_token("access_token", uid)
        new_refresh_token = encode_token("refresh_token", uid)

        cookie_params = {"httponly": True, "samesite": "lax"}
        response.set_cookie("access_token", new_access_token, **cookie_params)
        response.set_cookie("refresh_token", new_refresh_token, **cookie_params)

        return {"success": True}
    else:
        return {"success": False, "detail": "Token is invalid or expired"}


@router.post("/register")
async def auth_post_register(user_register: UserRegisterSchema, session: sessionDep):
    if user_register.password != user_register.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing_nick = await session.execute(
        select(UserModel).where(UserModel.nickname == user_register.nickname)
    )
    if existing_nick.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409, detail="User with such nickname already registered"
        )

    existing_email = await session.execute(
        select(UserModel).where(UserModel.email == user_register.email)
    )
    if existing_email.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409, detail="User with such email already registered"
        )

    hashed_password = hasher.hash(user_register.password)
    user = UserModel(
        nickname=user_register.nickname,
        email=user_register.email,
        password=hashed_password,
    )

    session.add(user)
    await session.commit()

    return {"success": True}


@router.post("/login")
async def auth_post_login(user_login: UserLoginSchema, response: Response, session: sessionDep):
    query = select(UserModel).where(
        or_(UserModel.nickname == user_login.identifier, UserModel.email == user_login.identifier)
    )
    result = await session.execute(query)

    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=401, detail="Пользователь с таким ником или email не найден"
        )

    if not hasher.verify(user_login.password, user.password):
        raise HTTPException(status_code=401, detail="Неверный пароль")

    access_token = encode_token("access_token", user.uid)
    refresh_token = encode_token("refresh_token", user.uid)

    cookie_params = {"httponly": True, "samesite": "lax"}
    response.set_cookie("access_token", access_token, **cookie_params)
    response.set_cookie("refresh_token", refresh_token, **cookie_params)

    return {"success": True}
