from fastapi.routing import APIRouter
from openai import OpenAI

from schemas.user_message import UserMessageSchema
from config import BASE_URL
from prompts import SYSTEM_SETTING_INTERVIEWER, SYSTEM_START_MESSAGE


router = APIRouter(prefix="/openai", tags=["OpenAI"])

client = OpenAI(base_url=BASE_URL)


@router.get("/start", description="User greetings, starting interview")
def openai_start():
    resp = client.chat.completions.create(
        model="qwen3-32b-awq",
        messages=[
            {"role": "system", "content": SYSTEM_SETTING_INTERVIEWER},
            {"role": "system", "content": SYSTEM_START_MESSAGE},
        ],
        temperature=0.4,
        max_tokens=512,
    )

    return {"content": resp.choices[0].message.content}


@router.post("/message", description="Send message to LLM and get answer back")
def openai_message(user_message: UserMessageSchema):
    message = user_message.message
    resp = client.chat.completions.create(
        model="qwen3-32b-awq",
        messages=[
            {"role": "system", "content": SYSTEM_SETTING_INTERVIEWER},
            {"role": "user", "content": message},
        ],
        temperature=0.4,
        max_tokens=4096,
    )

    return {"content": resp.choices[0].message.content}
