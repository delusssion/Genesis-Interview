from typing import AsyncGenerator
from sqlalchemy.ext.asyncio.engine import create_async_engine
from sqlalchemy.ext.asyncio.session import async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from config import URL_DATABASE


class Base(DeclarativeBase):
    pass


class Database:

    def __init__(self, url_database: str) -> None:
        self.engine = create_async_engine(url=url_database)
        self.session = async_sessionmaker(bind=self.engine, expire_on_commit=False)

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        async with self.session() as ses:
            yield ses

    async def create_tables(self) -> None:
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)


db = None
if URL_DATABASE is not None:
    db = Database(url_database=URL_DATABASE)
