from typing import Literal, Optional
from pydantic import BaseModel, Field


class ChatMessageSchema(BaseModel):
    message: str


class UserLoginSchema(BaseModel):
    nickname: str = Field(min_length=4)
    password: str = Field(min_length=8)


class UserRegisterSchema(UserLoginSchema):
    email: str = Field(min_length=5)
    confirm_password: str = Field(min_length=8)


class StartInterviewSchema(BaseModel):
    track: Literal["backend", "frontend", "data", "ml"]
    level: Literal["junior", "middle", "senior"]
    preferred_language: Literal["typescript", "python", "go"]
    locale: Optional[str]


class TaskRequestSchema(BaseModel):
    session_id: int
    level: Literal["junior", "medium", "senior"]


class RunRequestSchema(BaseModel):
    session_id: int
    task_id: str
    language: Literal["typescript", "python", "go"]
    code: str


class TelemetryEventSchema(BaseModel):
    type: Literal[
        "copy",
        "paste",
        "blur",
        "focus",
        "visibility-hidden",
        "visibility-visible",
        "devtools",
    ]
    at: str
    meta: Optional[str] = None


class TelemetryPayloadSchema(BaseModel):
    session_id: int
    events: list[TelemetryEventSchema]
