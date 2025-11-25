from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import insert

from schemas import TelemetryPayloadSchema
from dependencies import verify_access_token, sessionDep
from models import TelemetryEventModel, SessionsModel

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.post("/anticheat")
async def anticheat_events(
    payload: TelemetryPayloadSchema,
    session: sessionDep,
    is_token_valid=Depends(verify_access_token),
):
    if not is_token_valid:
        raise HTTPException(status_code=401, detail="Unauthorized")

    db_session = await session.get(SessionsModel, payload.session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if not payload.events:
        return {"success": True, "received": 0}

    rows = [
        {
          "session_id": payload.session_id,
          "type": event.type,
          "at": event.at,
          "meta": event.meta,
        }
        for event in payload.events
    ]

    await session.execute(insert(TelemetryEventModel), rows)
    await session.commit()
    return {"success": True, "received": len(rows)}
