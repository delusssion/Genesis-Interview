from fastapi import Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.routing import APIRouter
from sqlalchemy import select, update
from openai import OpenAI
import asyncio
import json

from schemas import ChatMessageSchema, StartInterviewSchema
from models import SessionsModel
from config import BASE_URL
from prompts import INTERVIEWER_PROMPT, INTERVIEWER_STAGE_PROMPTS
from dependencies import verify_access_token, sessionDep


router = APIRouter(tags=["Chat"])

client = OpenAI(base_url=BASE_URL)


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

    def parse_history(raw_history: list[str]) -> list[dict]:
        parsed = []
        for item in raw_history:
            try:
                parsed.append(json.loads(item))
            except Exception:
                parsed.append({"role": "user", "content": item})
        return parsed

    history = parse_history(ses.history)
    last_user_message = (
        next((msg["content"] for msg in reversed(history) if msg.get("role") == "user"), None)
        or "привет"
    )
    llm_msg = json.dumps(
        {
            "history": history,
            "message": last_user_message,
            "cur_state": ses.state,
            "task": ses.current_task,
        },
        ensure_ascii=False,
    )

    async def event_generator():
        try:
            # Event: typing
            yield "event: typing\ndata: {}\n\n"

            stream = client.chat.completions.create(
                model="qwen3-32b-awq",
                messages=[
                    {"role": "system", "content": INTERVIEWER_PROMPT},
                    {"role": "system", "content": INTERVIEWER_STAGE_PROMPTS.get(ses.state, "")},
                    {"role": "user", "content": llm_msg},
                ],
                stream=True,
            )

            final_text = ""
            heartbeat_interval = 10
            last_heartbeat = asyncio.get_event_loop().time()

            for chunk in stream:
                if await request.is_disconnected():
                    break

                delta = chunk.choices[0].delta.content
                if delta:
                    final_text += delta
                    payload = json.dumps({"delta": delta}, ensure_ascii=False)
                    # Event: delta
                    yield f"event: delta\ndata: {payload}\n\n"

                await asyncio.sleep(0)

                now = asyncio.get_event_loop().time()
                if now - last_heartbeat > heartbeat_interval:
                    yield "event: heartbeat\ndata: {}\n\n"
                    last_heartbeat = now

            event = json.dumps({"final": final_text}, ensure_ascii=False)
            # Event: final
            yield f"event: final\ndata: {event}\n\n"

        except Exception as e:
            error_payload = json.dumps({"error": str(e)}, ensure_ascii=False)
            # Event: error
            yield f"event: error\ndata: {error_payload}\n\n"

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
            json.dumps({"role": "user", "content": chat_message.message}, ensure_ascii=False)
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
