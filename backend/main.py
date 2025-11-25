from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routes.openai import router as router_openai
from config import FRONTEND_ORIGIN
from database import db
from tables.user import UserTable


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.create_tables()
    print("Tables created")
    yield


app = FastAPI(
    version="0.1", description="VibeCode Jam: собеседование будущего", lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"],
)

app.include_router(router_openai)
