from typing import Literal, Optional
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import String, Integer, ARRAY

from database import Base


class UserModel(Base):
    __tablename__ = "user"

    uid: Mapped[str] = mapped_column(Integer, primary_key=True)
    nickname: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)


class SessionsModel(Base):
    __tablename__ = "session"

    session_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    track: Mapped[Literal["backend", "frontend", "data", "ml"]] = mapped_column(String, nullable=False)
    level: Mapped[Literal["junior", "medium", "senior"]] = mapped_column(String, nullable=False)
    preferred_language: Mapped[Literal["typescript", "python", "go"]] = mapped_column(String, nullable=False)
    locale: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    history: Mapped[list[str]] = mapped_column(ARRAY(String), default=[], nullable=False)
    current_task: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    state: Mapped[str] = mapped_column(String, nullable=False)
