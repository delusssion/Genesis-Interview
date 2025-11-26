from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select

from schemas import TaskRequestSchema, RunRequestSchema
from dependencies import sessionDep, verify_access_token
from models import SessionsModel

router = APIRouter(prefix="/tasks", tags=["Tasks"])

tasks = {
    "junior": {
        "task_id": "junior_001",
        "title": "Сумма чётных чисел",
        "description": "Напиши функцию sum_even(numbers), которая возвращает сумму всех чётных чисел в списке.",
        "visible_tests": [
            {"input": [1, 2, 3, 4], "output": 6},
            {"input": [0, 0, 1], "output": 0},
        ],
        "constraints": ["O(n)", "Память O(1)", "Учитывать пустой список"],
    },
    "middle": {
        "task_id": "middle_001",
        "title": "Подстроки и частоты",
        "description": "Функция count_substrings(s, sub) должна считать количество вхождений подстроки.",
        "visible_tests": [
            {"input": ["banana", "an"], "output": 2},
            {"input": ["aaa", "aa"], "output": 2},
        ],
        "constraints": ["O(n*m)", "Регистрозависимость", "Учитывать перекрытия"],
    },
}


def error_response(code: str, message: str, status_code: int = 400):
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": {"code": code, "message": message}},
    )


@router.post("/next")
async def next_task(
    body: TaskRequestSchema,
    session: sessionDep,
    is_token_valid=Depends(verify_access_token),
):
    """
    Возвращает следующую задачу и видимые тесты, фиксирует стейт в сессии.
    """
    if not is_token_valid:
        raise HTTPException(status_code=401, detail="Unauthorized")

    level = body.level
    session_id = body.session_id

    if level not in tasks:
        return error_response("TASK_LEVEL_NOT_FOUND", f"Level {level} not found")

    db_session = await session.execute(
        select(SessionsModel).where(SessionsModel.session_id == session_id)
    )
    stored_session = db_session.scalar_one_or_none()
    if stored_session is None:
        return error_response("SESSION_NOT_FOUND", "Session not found", 404)

    stored_session.current_task = tasks[level]["task_id"]
    stored_session.state = "task_issued"
    await session.commit()

    return {
        "success": True,
        "task": tasks[level],
        "session_id": session_id,
        "state": stored_session.state,
    }


@router.post("/run")
async def run_code(
    body: RunRequestSchema,
    session: sessionDep,
    is_token_valid=Depends(verify_access_token),
):
    """
    Мок раннера на видимых тестах
    """
    if not is_token_valid:
        raise HTTPException(status_code=401, detail="Unauthorized")

    db_session = await session.execute(
        select(SessionsModel).where(SessionsModel.session_id == body.session_id)
    )
    stored_session = db_session.scalar_one_or_none()
    if stored_session is None:
        return error_response("SESSION_NOT_FOUND", "Session not found", 404)

    results = [
        {"test": 1, "passed": True},
        {"test": 2, "passed": True},
    ]

    stored_session.state = "awaiting_solution"
    await session.commit()

    return {
        "success": True,
        "task_id": body.task_id,
        "results": results,
        "time_ms": 42,
        "state": stored_session.state,
    }


@router.post("/check")
async def check_code(
    body: RunRequestSchema,
    session: sessionDep,
    is_token_valid=Depends(verify_access_token),
):
    """
    Мок проверки кода на скрытых тестах
    """
    if not is_token_valid:
        raise HTTPException(status_code=401, detail="Unauthorized")

    db_session = await session.execute(
        select(SessionsModel).where(SessionsModel.session_id == body.session_id)
    )
    stored_session = db_session.scalar_one_or_none()
    if stored_session is None:
        return error_response("SESSION_NOT_FOUND", "Session not found", 404)

    hidden_failed = False
    timeout = False
    limit_exceeded = False

    stored_session.state = "feedback_ready"
    await session.commit()

    return {
        "success": not hidden_failed,
        "task_id": body.task_id,
        "hidden_failed": hidden_failed,
        "details": None,
        "timeout": timeout,
        "limit_exceeded": limit_exceeded,
        "state": stored_session.state,
    }
