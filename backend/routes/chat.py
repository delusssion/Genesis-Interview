from fastapi import Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.routing import APIRouter
from sqlalchemy import select, update
## Удалён импорт OpenAI, используется только Scibox
import httpx
from pydantic import BaseModel
import asyncio
import json

from schemas import ChatMessageSchema, StartInterviewSchema
from models import SessionsModel
from config import BASE_URL, SCIBOX_API_KEY, SCIBOX_BASE_URL
from prompts import INTERVIEWER_PROMPT, INTERVIEWER_STAGE_PROMPTS
from dependencies import verify_access_token, sessionDep


router = APIRouter(tags=["Chat"])

## Удалён клиент OpenAI, используется только Scibox


@router.post("/interview/start")
async def interview_start(
    data: StartInterviewSchema,
    session: sessionDep,
    is_token_valid=Depends(verify_access_token),
):

    if not is_token_valid:
        raise HTTPException(
            status_code=401, detail="Access token not found or invalid or expired"
        )

    try:
        new_session = SessionsModel(
            track=data.track,
            level=data.level,
            preferred_language=data.preferred_language,
            locale=data.locale,
            state="idle",
        )
        session.add(new_session)
        await session.commit()
        await session.refresh(new_session)

        return {"success": True, "session_id": new_session.session_id}
    except:
        return {"success": False}


## Удалён старый SSE-чат на OpenAI, остался только Scibox и обычные endpoints


@router.post("/chat/send")
async def chat_send(
    session_id: int,
    chat_message: ChatMessageSchema,
    session: sessionDep,
    is_token_valid=Depends(verify_access_token),
):

    if not is_token_valid:
        raise HTTPException(
            status_code=401, detail="Access token not found or invalid or expired"
        )

    try:
        db_ses = await session.execute(
            select(SessionsModel).where(SessionsModel.session_id == session_id)
        )
        ses = db_ses.scalar_one_or_none()
        if ses is None:
            raise HTTPException(status_code=404, detail="Session not found")

        ses_history = ses.history or []
        ses_history.append(
            json.dumps(
                {"role": "user", "content": chat_message.message}, ensure_ascii=False
            )
        )

        query = (
            update(SessionsModel)
            .where(SessionsModel.session_id == session_id)
            .values(history=ses_history)
        )
        await session.execute(query)
        await session.commit()

        return {"success": True}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



class SciboxRequest(BaseModel):
    message: str
    conversation_history: list[dict] = []


@router.post("/chat/scibox")
async def chat_scibox(
    payload: SciboxRequest,
    is_token_valid=Depends(verify_access_token),
):
    if not is_token_valid:
        raise HTTPException(status_code=401, detail="Access token not found or invalid or expired")

    if not SCIBOX_API_KEY:
        raise HTTPException(status_code=500, detail="SCIBOX_API_KEY not configured")

    # choose model by simple heuristics
    msg_lower = (payload.message or "").lower()
    model = "qwen3-32b-awq"
    if "код" in msg_lower or "программир" in msg_lower or "коде" in msg_lower:
        model = "qwen3-coder-30b-a3b-instruct-fp8"

    headers = {
        "Authorization": f"Bearer {SCIBOX_API_KEY}",
        "Content-Type": "application/json",
    }

    # build messages for Scibox
    prompt_messages = [
        {"role": "system", "content": "Ты профессиональный технический интервьюер. Ты должен задавать вопросы по программированию и оценивать ответы кандидата. Отвечай кратко и ясно, но профессионально."}
    ]
    for m in payload.conversation_history:
        try:
            role = m.get("role", "user")
            content = m.get("content", "")
        except Exception:
            role = "user"
            content = str(m)
        prompt_messages.append({"role": role, "content": content})

    prompt_messages.append({"role": "user", "content": payload.message})

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{SCIBOX_BASE_URL}/v1/chat/completions",
                headers=headers,
                json={
                    "model": model,
                    "messages": prompt_messages,
                    "temperature": 0.7,
                    "max_tokens": 500,
                },
            )

            if resp.status_code != 200:
                text = await resp.aread() if hasattr(resp, "aread") else resp.text
                raise HTTPException(status_code=resp.status_code, detail=f"Scibox error: {text}")

            result = resp.json()
            ai_response = ""
            try:
                ai_response = result["choices"][0]["message"]["content"]
            except Exception:
                ai_response = str(result)

            return {"response": ai_response, "model_used": model}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
