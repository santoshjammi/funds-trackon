"""
Task Controller - Handles task management endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from app.models.task import Task, TaskStatus, TaskPriority, TaskType
from beanie import PydanticObjectId

task_router = APIRouter(tags=["tasks"])

# Request/Response models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: str = "other"
    status: str = "pending"
    priority: str = "medium"
    due_date: Optional[str] = None
    completed_date: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_by: Optional[str] = None
    contact_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    fundraising_id: Optional[str] = None
    tags: List[str] = []
    notes: Optional[str] = None

    class Config:
        # Allow arbitrary types to pass validation
        arbitrary_types_allowed = True

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    task_type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    completed_date: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_by: Optional[str] = None
    contact_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    fundraising_id: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

    class Config:
        # Allow arbitrary types to pass validation
        arbitrary_types_allowed = True

@task_router.post("/", response_model=dict)
async def create_task(task_data: TaskCreate):
    """Create a new task"""
    # Convert frontend values to backend enum values
    task_dict = task_data.dict()
    
    # Convert task_type
    task_type_mapping = {
        'call': TaskType.CALL,
        'email': TaskType.EMAIL, 
        'meeting': TaskType.MEETING,
        'follow_up': TaskType.FOLLOW_UP,
        'research': TaskType.RESEARCH,
        'presentation': TaskType.PRESENTATION,
        'other': TaskType.OTHER
    }
    if task_dict.get('task_type') in task_type_mapping:
        task_dict['task_type'] = task_type_mapping[task_dict['task_type']]
    
    # Convert status
    status_mapping = {
        'pending': TaskStatus.TODO,
        'in_progress': TaskStatus.IN_PROGRESS,
        'completed': TaskStatus.COMPLETED,
        'cancelled': TaskStatus.CANCELLED
    }
    if task_dict.get('status') in status_mapping:
        task_dict['status'] = status_mapping[task_dict['status']]
    
    # Convert priority
    priority_mapping = {
        'low': TaskPriority.low,
        'medium': TaskPriority.medium,
        'high': TaskPriority.high,
        'urgent': TaskPriority.urgent
    }
    if task_dict.get('priority') in priority_mapping:
        task_dict['priority'] = priority_mapping[task_dict['priority']]
    
    # Handle empty date strings
    if task_dict.get('due_date') == '':
        task_dict['due_date'] = None
    if task_dict.get('completed_date') == '':
        task_dict['completed_date'] = None
    
    # Remove fields that should not be set by the client
    task_dict.pop('created_at', None)
    task_dict.pop('updated_at', None)
    
    task = Task(**task_dict)
    await task.insert()
    return {"message": "Task created successfully", "id": str(task.id)}

@task_router.get("/", response_model=List[dict])
async def get_all_tasks(
    skip: int = Query(0, ge=0)
):
    """Get all tasks"""
    tasks = await Task.find_all().skip(skip).to_list()
    # Convert to dict and ensure id is a string
    return [{"id": str(task.id), **task.model_dump(exclude={"id"})} for task in tasks]

@task_router.get("/{task_id}", response_model=dict)
async def get_task(task_id: PydanticObjectId):
    """Get a specific task"""
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"id": str(task.id), **task.model_dump(exclude={"id"})}

@task_router.put("/{task_id}", response_model=dict)
async def update_task(task_id: PydanticObjectId, update_data: TaskUpdate):
    """Update a task"""
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
        # Convert frontend values to backend enum values
    if 'task_type' in update_dict:
        task_type_mapping = {
            'call': TaskType.CALL,
            'email': TaskType.EMAIL, 
            'meeting': TaskType.MEETING,
            'follow_up': TaskType.FOLLOW_UP,
            'research': TaskType.RESEARCH,
            'presentation': TaskType.PRESENTATION,
            'other': TaskType.OTHER
        }
        if update_dict['task_type'] in task_type_mapping:
            update_dict['task_type'] = task_type_mapping[update_dict['task_type']]
    
    if 'status' in update_dict:
        status_mapping = {
            'pending': TaskStatus.TODO,
            'in_progress': TaskStatus.IN_PROGRESS,
            'completed': TaskStatus.COMPLETED,
            'cancelled': TaskStatus.CANCELLED
        }
        if update_dict['status'] in status_mapping:
            update_dict['status'] = status_mapping[update_dict['status']]
    
    if 'priority' in update_dict:
        priority_mapping = {
            'low': TaskPriority.low,
            'medium': TaskPriority.medium,
            'high': TaskPriority.high,
            'urgent': TaskPriority.urgent
        }
        if update_dict['priority'] in priority_mapping:
            update_dict['priority'] = priority_mapping[update_dict['priority']]
    
    # Handle empty date strings
    if 'due_date' in update_dict and update_dict['due_date'] == '':
        update_dict['due_date'] = None
    if 'completed_date' in update_dict and update_dict['completed_date'] == '':
        update_dict['completed_date'] = None
    
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
    return [{"id": str(task.id), **task.model_dump(exclude={"id"})} for task in tasks]

@task_router.get("/assignee/{assignee_id}", response_model=List[dict])
async def get_tasks_by_assignee(assignee_id: str):
    """Get tasks by assignee"""
    tasks = await Task.find({"assignee_id": assignee_id}).to_list()
    return [{"id": str(task.id), **task.model_dump(exclude={"id"})} for task in tasks]