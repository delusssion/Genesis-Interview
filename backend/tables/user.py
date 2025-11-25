from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import String, Integer

from database import Base


class UserTable(Base):
    __tablename__ = "user"

    uid: Mapped[str] = mapped_column(Integer, primary_key=True)
    nickname: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)