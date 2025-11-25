from fastapi import APIRouter, Depends, HTTPException

from schemas import TelemetryPayloadSchema
from dependencies import verify_access_token

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.post("/anticheat")
async def anticheat_events(
    payload: TelemetryPayloadSchema, is_token_valid=Depends(verify_access_token)
):
    if not is_token_valid:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Для MVP просто логируем в stdout; далее — сохранить в БД/логах
    print(f"[ANTICHEAT] session={payload.session_id} events={payload.events}")
    return {"success": True, "received": len(payload.events)}
