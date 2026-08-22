from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TaskCreate(BaseModel):
    type: str
    title: str
    activity_tag: Optional[str] = None


class Task(BaseModel):
    id: int
    type: str
    title: str
    activity_tag: Optional[str]
    created_at: datetime


class FocusSession(BaseModel):
    id: int
    task_id: int
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: Optional[int]