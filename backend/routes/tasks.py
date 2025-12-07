import io
import traceback
from contextlib import redirect_stdout, redirect_stderr
from typing import Any, Callable
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
        "entry": "sum_even",
        "title": "Сумма чётных чисел",
        "description": "Напиши функцию sum_even(numbers), которая возвращает сумму всех чётных чисел в списке.",
        "visible_tests": [
            {"input": [1, 2, 3, 4], "output": 6},
            {"input": [0, 0, 1], "output": 0},
        ],
        "hidden_tests": [
            {"input": [1, 1, 1], "output": 0},
            {"input": list(range(1, 11)), "output": 30},
        ],
        "constraints": ["O(n)", "Память O(1)", "Учитывать пустой список"],
    },
    "middle": {
        "task_id": "middle_001",
        "entry": "count_substrings",
        "title": "Подстроки и частоты",
        "description": "Функция count_substrings(s, sub) должна считать количество вхождений подстроки.",
        "visible_tests": [
            {"input": ["banana", "an"], "output": 2},
            {"input": ["aaa", "aa"], "output": 2},
        ],
        "hidden_tests": [
            {"input": ["hello", "ll"], "output": 1},
            {"input": ["abababa", "aba"], "output": 3},
        ],
        "constraints": ["O(n*m)", "Регистрозависимость", "Учитывать перекрытия"],
    },
}


def error_response(code: str, message: str, status_code: int = 400):
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": {"code": code, "message": message}},
    )


def _run_python(code: str, entry: str, tests: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Раннер Python: выполняет код, ищет функцию entry и прогоняет тесты.
    """
    results = []
    namespace: dict[str, Any] = {}
    try:
        exec(code, namespace, namespace)
    except Exception:
        tb = traceback.format_exc()
        return [{"test": idx + 1, "passed": False, "error": "CompileError", "details": tb} for idx in range(len(tests))]

    func: Callable[..., Any] | None = namespace.get(entry)  # type: ignore
    if not callable(func):
        return [{"test": idx + 1, "passed": False, "error": "EntryNotFound", "details": f"Функция {entry} не найдена"} for idx in range(len(tests))]

    for idx, test in enumerate(tests):
        inp = test.get("input", [])
        expected = test.get("output")
        try:
            args = inp if isinstance(inp, (list, tuple)) else [inp]
            got = func(*args)
            passed = got == expected
            results.append(
                {
                    "test": idx + 1,
                    "input": inp,
                    "expected": expected,
                    "got": got,
                    "passed": bool(passed),
                }
            )
        except Exception:
            tb = traceback.format_exc()
            results.append(
                {
                    "test": idx + 1,
                    "input": inp,
                    "expected": expected,
                    "got": None,
                    "passed": False,
                    "error": "RuntimeError",
                    "details": tb,
                }
            )
    return results


def _exec_python_script(code: str) -> dict[str, Any]:
    """
    Выполняет произвольный Python-скрипт и возвращает stdout/stderr.
    """
    stdout = io.StringIO()
    stderr = io.StringIO()
    try:
        with redirect_stdout(stdout), redirect_stderr(stderr):
            exec(code, {})
        return {"success": True, "stdout": stdout.getvalue(), "stderr": stderr.getvalue()}
    except Exception:
        return {
            "success": False,
            "stdout": stdout.getvalue(),
            "stderr": stderr.getvalue() + "\n" + traceback.format_exc(),
        }


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

    # поддерживаем только python для демо
    if body.language != "python":
        return error_response("LANG_NOT_SUPPORTED", "Текущий раннер поддерживает только Python", 400)

    task_meta = None
    for meta in tasks.values():
        if meta["task_id"] == body.task_id:
            task_meta = meta
            break

    # Если задача известна, запускаем видимые тесты, иначе просто исполняем скрипт
    if task_meta:
        results = _run_python(body.code, task_meta["entry"], task_meta["visible_tests"])
        passed = all(r.get("passed") for r in results)
        details = "Видимые тесты пройдены" if passed else "Есть ошибки в видимых тестах"
        stdout, stderr = "", ""
    else:
        exec_res = _exec_python_script(body.code)
        results = []
        passed = exec_res["success"]
        details = "Код выполнен" if passed else "Ошибка выполнения"
        stdout = exec_res.get("stdout", "")
        stderr = exec_res.get("stderr", "")

    stored_session.state = "awaiting_solution"
    await session.commit()

    return {
        "success": passed,
        "task_id": body.task_id,
        "results": results,
        "stdout": stdout,
        "stderr": stderr,
        "time_ms": 0,
        "state": stored_session.state,
        "details": details,
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

    if body.language != "python":
        return error_response("LANG_NOT_SUPPORTED", "Текущий раннер поддерживает только Python", 400)

    task_meta = None
    for meta in tasks.values():
        if meta["task_id"] == body.task_id:
            task_meta = meta
            break
    if not task_meta:
        stored_session.state = "feedback_ready"
        await session.commit()
        return {
          "success": True,
          "task_id": body.task_id,
          "results": [],
          "hidden_failed": False,
          "details": "Задача не зарегистрирована, проверка пропущена",
          "timeout": False,
          "limit_exceeded": False,
          "state": stored_session.state,
        }

    results = _run_python(body.code, task_meta["entry"], task_meta.get("hidden_tests", []))
    passed = all(r.get("passed") for r in results) if results else False

    stored_session.state = "feedback_ready"
    await session.commit()

    return {
        "success": passed,
        "task_id": body.task_id,
        "results": results,
        "hidden_failed": not passed,
        "details": "Все скрытые тесты пройдены" if passed else "Есть ошибки в скрытых тестах",
        "timeout": False,
        "limit_exceeded": False,
        "state": stored_session.state,
    }
