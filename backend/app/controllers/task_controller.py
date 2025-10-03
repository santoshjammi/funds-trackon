"""
Task Controller - Handles task management endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from app.models.task import Task, TaskStatus, TaskPriority
from beanie import PydanticObjectId

task_router = APIRouter(tags=["tasks"])

# Request/Response models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[str] = None
    priority: TaskPriority = TaskPriority.medium
    tags: List[str] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    tags: Optional[List[str]] = None

@task_router.post("/", response_model=dict)
async def create_task(task_data: TaskCreate):
    """Create a new task"""
    task = Task(**task_data.dict())
    await task.insert()
    return {"message": "Task created successfully", "id": str(task.id)}

@task_router.get("/", response_model=List[dict])
async def get_all_tasks(
    skip: int = Query(0, ge=0)
):
    """Get all tasks"""
    tasks = await Task.find_all().skip(skip).to_list()
    return [task.dict() for task in tasks]

@task_router.get("/{task_id}", response_model=dict)
async def get_task(task_id: PydanticObjectId):
    """Get a specific task"""
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task.dict()

@task_router.put("/{task_id}", response_model=dict)
async def update_task(task_id: PydanticObjectId, update_data: TaskUpdate):
    """Update a task"""
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    for key, value in update_dict.items():
        setattr(task, key, value)
    
    await task.save()
    return {"message": "Task updated successfully"}

@task_router.delete("/{task_id}", response_model=dict)
async def delete_task(task_id: PydanticObjectId):
    """Delete a task"""
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await task.delete()
    return {"message": "Task deleted successfully"}

@task_router.get("/status/{status}", response_model=List[dict])
async def get_tasks_by_status(status: TaskStatus):
    """Get tasks by status"""
    tasks = await Task.find({"status": status}).to_list()
    return [task.dict() for task in tasks]

@task_router.get("/assignee/{assignee_id}", response_model=List[dict])
async def get_tasks_by_assignee(assignee_id: str):
    """Get tasks by assignee"""
    tasks = await Task.find({"assignee_id": assignee_id}).to_list()
    return [task.dict() for task in tasks]