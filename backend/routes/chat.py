from fastapi import Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.routing import APIRouter
from sqlalchemy import update
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
    ses_msg = ses.history[-1] if len(ses.history) != 0 else "привет"
    ses_state = ses.state
    ses_task = ses.current_task

    llm_msg = json.dumps({"message": ses_msg, "cur_state": ses_state, "task": ses_task})

    async def event_generator():
        try:
            # Event: typing
            yield "event: typing\ndata: {}\n\n"

            stream = client.chat.completions.create(
                model="qwen3-32b-awq",
                messages=[
                    {"role": "system", "content": INTERVIEWER_PROMPT},
                    {"role": "system", "content": INTERVIEWER_STAGE_PROMPTS[ses_state]},
                    {"role": "user", "content": llm_msg},
                ],
                stream=True,
            )

            final_text = ""

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
        ses = await session.get(SessionsModel, session_id)
        ses_history = ses.history
        ses_history.append(chat_message.message)

        query = (
            update(SessionsModel)
            .where(SessionsModel.session_id == session_id)
            .values(history=ses_history)
        )
        await session.execute(query)
        await session.commit()

        return {"success": True}
    except:
        return {"success": False}
