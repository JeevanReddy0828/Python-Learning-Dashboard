from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.deps import get_current_user
from app.models.user import User
from app.services.code_execution_service import run_python_code

router = APIRouter()


class RunRequest(BaseModel):
    code: str
    stdin: str = ""


class RunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float
    timed_out: bool


@router.post("/run", response_model=RunResponse)
async def run_code(
    payload: RunRequest,
    current_user: User = Depends(get_current_user),
):
    result = await run_python_code(payload.code, payload.stdin)
    return RunResponse(
        stdout=result.stdout,
        stderr=result.stderr,
        exit_code=result.exit_code,
        execution_time=result.execution_time,
        timed_out=result.timed_out,
    )
