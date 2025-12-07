from typing import Literal, Optional
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import String, Integer, JSON

from database import Base


class UserModel(Base):
    __tablename__ = "user"

    uid: Mapped[str] = mapped_column(Integer, primary_key=True)
    nickname: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)


class SessionsModel(Base):
    __tablename__ = "session"

    session_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    track: Mapped[Literal["backend", "frontend", "data", "ml", "devops", "mobile"]] = mapped_column(String, nullable=False)
    level: Mapped[Literal["junior", "medium", "senior"]] = mapped_column(String, nullable=False)
    preferred_language: Mapped[
        Literal["typescript", "javascript", "python", "go", "java", "cpp", "csharp", "shell"]
    ] = mapped_column(String, nullable=False)
    locale: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=15)
    history: Mapped[list] = mapped_column(JSON, default=[], nullable=False)
    current_task: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    state: Mapped[str] = mapped_column(String, nullable=False)


class TelemetryEventModel(Base):
    __tablename__ = "telemetry_event"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    at: Mapped[str] = mapped_column(String, nullable=False)
    meta: Mapped[Optional[str]] = mapped_column(String, nullable=True)
