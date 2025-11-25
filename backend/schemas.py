from typing import Literal, Optional
from pydantic import BaseModel, Field


class ChatMessageSchema(BaseModel):
    message: str


class UserLoginSchema(BaseModel):
    nickname: str = Field(min_length=4)
    password: str = Field(min_length=8)


class UserRegisterSchema(UserLoginSchema):
    confirm_password: str = Field(min_length=8)


class StartInterviewSchema(BaseModel):
    track: Literal["backend", "frontend", "data", "ml"]
    level: Literal["junior", "medium", "senior"]
    preferred_language: Literal["typescript", "python", "go"]
    user_id: str
    locale: Optional[str]
