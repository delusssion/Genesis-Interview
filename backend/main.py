from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routes.openai import router as router_openai


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting app...")
    yield
    print("Closing app...")


app = FastAPI(
    version="0.1", description="VibeCode Jam: собеседование будущего", lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"],
)

app.include_router(router_openai)
