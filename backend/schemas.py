from typing import Literal, Optional
from pydantic import BaseModel, Field, EmailStr


class ChatMessageSchema(BaseModel):
    message: str


class ChatSendSchema(ChatMessageSchema):
    session_id: int


class UserLoginSchema(BaseModel):
    identifier: str = Field(min_length=3)
    password: str = Field(min_length=8)


class UserRegisterSchema(BaseModel):
    email: EmailStr
    nickname: str = Field(min_length=4)
    password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)


class StartInterviewSchema(BaseModel):
    track: Literal["backend", "frontend", "data", "ml", "devops", "mobile"]
    level: Literal["junior", "middle", "senior"]
    preferred_language: Literal[
        "typescript",
        "javascript",
        "python",
        "go",
        "java",
        "cpp",
        "csharp",
        "shell",
    ]
    duration_minutes: int = Field(default=15, ge=5, le=240)
    locale: Optional[str]


class TaskRequestSchema(BaseModel):
    session_id: int
    level: Literal["junior", "medium", "senior"]


class RunRequestSchema(BaseModel):
    session_id: int
    task_id: str
    language: Literal[
        "typescript",
        "javascript",
        "python",
        "go",
        "java",
        "cpp",
        "csharp",
        "shell",
    ]
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
