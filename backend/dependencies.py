from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio.session import AsyncSession

from database import db


sessionDep = Annotated[AsyncSession, Depends(db.get_session)]
