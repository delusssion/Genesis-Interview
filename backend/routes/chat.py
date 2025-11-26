from fastapi import Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.routing import APIRouter
from sqlalchemy import select, update
## Удалён импорт OpenAI, используется только Scibox
import httpx
from pydantic import BaseModel
import asyncio
import json

from schemas import ChatMessageSchema, StartInterviewSchema, ChatSendSchema
from models import SessionsModel
from config import SCIBOX_API_KEY, SCIBOX_BASE_URL
from prompts import INTERVIEWER_PROMPT, INTERVIEWER_STAGE_PROMPTS
from dependencies import verify_access_token, sessionDep


router = APIRouter(tags=["Chat"])

## Удалён клиент OpenAI, используется только Scibox
SCIBOX_CHAT_URL = f"{SCIBOX_BASE_URL.rstrip('/')}/v1/chat/completions"


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
            duration_minutes=data.duration_minutes,
            state="idle",
        )
        session.add(new_session)
        await session.commit()
        await session.refresh(new_session)

        return {"success": True, "session_id": new_session.session_id}
    except:
        return {"success": False}


## Удалён старый SSE-чат на OpenAI, остался только Scibox и обычные endpoints


def _parse_history(raw_history: list[str]) -> list[dict]:
    parsed = []
    for item in raw_history or []:
        try:
            parsed.append(json.loads(item))
        except Exception:
            parsed.append({"role": "user", "content": item})
    return parsed


@router.get("/chat/stream")
async def chat_stream(
    session_id: int,
    request: Request,
    session: sessionDep,
    is_token_valid=Depends(verify_access_token),
):
    if not is_token_valid:
        raise HTTPException(
            status_code=401, detail="Access token not found or invalid or expired"
        )

    ses = await session.get(SessionsModel, session_id)
    if ses is None:
        raise HTTPException(status_code=404, detail="Session not found")

    history = _parse_history(ses.history)

    context_prompt = (
        "Контекст интервью: "
        f"направление {ses.track}, "
        f"уровень {ses.level}, "
        f"язык/стек {ses.preferred_language}, "
        f"длительность {ses.duration_minutes} минут. "
        "Сохраняй формат JSON с полями message и next_state. "
        "Отвечай кратко, без служебных тегов."
    )

    # Build messages with system prompts + history
    messages = [
        {"role": "system", "content": INTERVIEWER_PROMPT},
        {"role": "system", "content": context_prompt},
        {
            "role": "system",
            "content": INTERVIEWER_STAGE_PROMPTS.get(ses.state or "idle", ""),
        },
    ]
    for msg in history:
        role = msg.get("role") or "user"
        content = msg.get("content") or ""
        messages.append({"role": role, "content": content})

    async def event_generator():
        # typing event
        yield "event: typing\ndata: {}\n\n"

        headers = {
            "Authorization": f"Bearer {SCIBOX_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "qwen3-32b-awq",
            "messages": messages,
            "stream": True,
            "max_tokens": 600,
            "temperature": 0.7,
        }

        final_text = ""
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    SCIBOX_CHAT_URL,
                    headers=headers,
                    json=payload,
                ) as resp:
                    if resp.status_code != 200:
                        detail = await resp.aread()
                        raise HTTPException(
                            status_code=resp.status_code,
                            detail=f"Scibox error: {detail}",
                        )

                    async for raw_line in resp.aiter_lines():
                        if await request.is_disconnected():
                            break
                        if not raw_line or not raw_line.startswith("data:"):
                            continue
                        data = raw_line.removeprefix("data:").strip()
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            delta = chunk["choices"][0]["delta"].get("content")
                        except Exception:
                            delta = None
                        if delta:
                            final_text += delta
                            payload_delta = json.dumps({"delta": delta}, ensure_ascii=False)
                            yield f"event: delta\ndata: {payload_delta}\n\n"

        except HTTPException as e:
            error_payload = json.dumps({"error": str(e.detail)}, ensure_ascii=False)
            yield f"event: error\ndata: {error_payload}\n\n"
            return
        except Exception as e:
            error_payload = json.dumps({"error": str(e)}, ensure_ascii=False)
            yield f"event: error\ndata: {error_payload}\n\n"
            return

        final_message = final_text
        try:
            parsed = json.loads(final_text)
            final_message = parsed.get("message", final_text)
            next_state = parsed.get("next_state", ses.state)
        except Exception:
            next_state = ses.state

        # Save assistant reply into history and update state if needed
        try:
            ses_history = ses.history or []
            ses_history.append(json.dumps({"role": "assistant", "content": final_message}, ensure_ascii=False))
            update_values = {"history": ses_history}
            if next_state and next_state != ses.state:
                update_values["state"] = next_state
            query = (
                update(SessionsModel)
                .where(SessionsModel.session_id == ses.session_id)
                .values(**update_values)
            )
            await session.execute(query)
            await session.commit()
        except Exception:
            # don't break response if saving fails
            pass

        final_event = json.dumps({"final": final_message}, ensure_ascii=False)
        yield f"event: final\ndata: {final_event}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post("/chat/send")
async def chat_send(
    payload: ChatSendSchema,
    session: sessionDep,
    is_token_valid=Depends(verify_access_token),
):

    if not is_token_valid:
        raise HTTPException(
            status_code=401, detail="Access token not found or invalid or expired"
        )

    try:
        db_ses = await session.execute(
            select(SessionsModel).where(SessionsModel.session_id == payload.session_id)
        )
        ses = db_ses.scalar_one_or_none()
        if ses is None:
            raise HTTPException(status_code=404, detail="Session not found")

        ses_history = ses.history or []
        ses_history.append(
            json.dumps(
                {"role": "user", "content": payload.message}, ensure_ascii=False
            )
        )

        query = (
            update(SessionsModel)
            .where(SessionsModel.session_id == payload.session_id)
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
