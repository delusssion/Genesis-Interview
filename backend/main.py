from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routes.chat import router as router_chat
from routes.user import router as router_user
from routes.tasks import router as router_tasks
from routes.telemetry import router as router_telemetry
from config import FRONTEND_ORIGIN
from database import db
from models import UserModel, SessionsModel


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

app.include_router(router_user)
app.include_router(router_chat)
app.include_router(router_tasks)
app.include_router(router_telemetry)


@app.get("/health")
def health():
    return {"status": "ok"}
